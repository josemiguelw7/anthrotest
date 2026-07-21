// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { track, domain, q, opts, a, why } = await req.json();
  if (!["arch", "assoc"].includes(track) || !q?.trim() || !Array.isArray(opts) || opts.length !== 4 || opts.some((o) => !String(o).trim()) || a < 0 || a > 3 || !why?.trim())
    return NextResponse.json({ error: "Fill the question, all four options, the correct answer, and the explanation." }, { status: 400 });
  await sql`insert into submissions (user_id, track, domain, q, opts, a, why) values (${s.uid}, ${track}, ${domain}, ${q.trim()}, ${JSON.stringify(opts.map((o) => String(o).trim()))}, ${a}, ${why.trim()})`;
  return NextResponse.json({ ok: true });
}
