// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { track, form, score, total, pct, byDom, answers } = await req.json();
  if (!["arch", "assoc"].includes(track) || !Array.isArray(answers)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await sql`insert into exam_results (user_id, track, form, score, total, pct, by_dom) values (${s.uid}, ${track}, ${String(form).slice(0, 8)}, ${score}, ${total}, ${pct}, ${JSON.stringify(byDom)})`;
  for (const a of answers.slice(0, 100)) {
    await sql`insert into attempts (user_id, qid, track, domain, correct) values (${s.uid}, ${a.qid}, ${track}, ${a.domain}, ${!!a.correct})`;
    if (!a.correct) await sql`insert into srs (user_id, qid, misses, ivl, due) values (${s.uid}, ${a.qid}, 1, 1, now() + interval '1 day')
      on conflict (user_id, qid) do update set misses = srs.misses + 1, ivl = 1, due = now() + interval '1 day'`;
  }
  return NextResponse.json({ ok: true });
}
