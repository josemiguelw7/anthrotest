// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Weekly progress email via Vercel Cron (Fridays, see vercel.json). Safe no-op without RESEND_API_KEY.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ ok: false }, { status: 401 });
  const rk = process.env.RESEND_API_KEY;
  if (!rk) return NextResponse.json({ ok: true, skipped: "no RESEND_API_KEY" });

  const users = await sql`select id, email, name from users where wants_reports`;
  let sent = 0;
  for (const u of users) {
    const at = await sql`select count(*)::int as t, count(*) filter (where correct)::int as c from attempts where user_id = ${u.id} and created_at > now() - interval '7 days'`;
    const ex = await sql`select track, form, pct from exam_results where user_id = ${u.id} and created_at > now() - interval '7 days'`;
    const { t, c } = at[0] || { t: 0, c: 0 };
    if (!t && !ex.length) continue;
    const html = `<div style="font-family:sans-serif;max-width:520px"><h2>Your AnthroTest week, ${u.name}</h2>
      <p><b>${t}</b> questions answered · <b>${t ? Math.round((c / t) * 100) : 0}%</b> accuracy</p>
      ${ex.length ? `<p>Mock exams: ${ex.map((e) => `${e.track === "arch" ? "CCA-F" : "Fundamentals"} Form ${e.form} — <b>${e.pct}%</b>`).join(", ")}</p>` : ""}
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
