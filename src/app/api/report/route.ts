import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Weekly progress email. Triggered by Vercel Cron (see vercel.json, Fridays 14:00 UTC).
// Requires SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY. Safe no-op if either is missing.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ ok: false }, { status: 401 });
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY, rk = process.env.RESEND_API_KEY;
  if (!svc || !rk) return NextResponse.json({ ok: true, skipped: "missing keys" });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, svc);
  const { data: users } = await db.auth.admin.listUsers();
  const { data: profiles }: any = await db.from("profiles").select("*").eq("wants_reports", true);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  let sent = 0;

  for (const p of (profiles || []) as any[]) {
    const u = (users?.users as any[])?.find((x: any) => x.id === p.id);
    if (!u?.email) continue;
    const { data: at }: any = await db.from("attempts").select("correct").eq("user_id", p.id).gte("created_at", weekAgo);
    const { data: ex }: any = await db.from("exam_results").select("pct,track,form").eq("user_id", p.id).gte("created_at", weekAgo);
    const t = at?.length || 0, c = at?.filter((a: any) => a.correct).length || 0;
    if (t === 0 && !ex?.length) continue; // nothing to report
    const html = `<div style="font-family:sans-serif;max-width:520px"><h2>Your AnthroTest week</h2>
      <p><b>${t}</b> questions answered · <b>${t ? Math.round((c / t) * 100) : 0}%</b> accuracy</p>
      ${ex?.length ? `<p>Mock exams: ${ex.map((e: any) => `${e.track === "arch" ? "CCA-F" : "Fundamentals"} Form ${e.form} — <b>${e.pct}%</b>`).join(", ")}</p>` : ""}
      <p><a href="https://anthrotest.com/dashboard">Open your dashboard →</a></p>
      <p style="color:#888;font-size:12px">AnthroTest is an independent study resource, not affiliated with Anthropic.</p></div>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${rk}` },
      body: JSON.stringify({ from: process.env.REPORT_FROM || "AnthroTest <reports@anthrotest.com>", to: u.email, subject: "Your weekly study report", html }),
    });
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
}
