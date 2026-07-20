// @ts-nocheck
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const at = await sql`select track, domain, count(*)::int as t, count(*) filter (where correct)::int as c from attempts where user_id = ${s.uid} group by track, domain`;
  const agg = { arch: [0,1,2,3,4].map(() => ({ c: 0, t: 0 })), assoc: [0,1,2,3,4].map(() => ({ c: 0, t: 0 })) };
  at.forEach((r) => { const x = agg[r.track]?.[r.domain]; if (x) { x.t = r.t; x.c = r.c; } });
  const exams = await sql`select id, track, form, score, total, pct, created_at from exam_results where user_id = ${s.uid} order by created_at desc limit 10`;
  const due = await sql`select count(*)::int as n from srs where user_id = ${s.uid} and due <= now()`;
  return NextResponse.json({ agg, exams, due: due[0]?.n || 0 });
}
