// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { qid, track, domain, correct } = await req.json();
  if (typeof qid !== "string" || !["arch", "assoc"].includes(track)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await sql`insert into attempts (user_id, qid, track, domain, correct) values (${s.uid}, ${qid}, ${track}, ${domain}, ${!!correct})`;
  if (qid.startsWith("ai_")) return NextResponse.json({ ok: true }); // ephemeral AI questions: stats yes, SRS no
  if (!correct) {
    await sql`insert into srs (user_id, qid, misses, ivl, due) values (${s.uid}, ${qid}, 1, 1, now() + interval '1 day')
      on conflict (user_id, qid) do update set misses = srs.misses + 1, ivl = 1, due = now() + interval '1 day'`;
  } else {
    const cur = await sql`select ivl from srs where user_id = ${s.uid} and qid = ${qid}`;
    if (cur.length) {
      const ivl = cur[0].ivl;
      if (ivl >= 7) await sql`delete from srs where user_id = ${s.uid} and qid = ${qid}`;
      else { const nxt = ivl >= 3 ? 7 : 3; await sql`update srs set ivl = ${nxt}, due = now() + (${nxt} || ' days')::interval where user_id = ${s.uid} and qid = ${qid}`; }
    }
  }
  return NextResponse.json({ ok: true });
}
