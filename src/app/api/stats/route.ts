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
  const days = await sql`select distinct date(created_at) as d from attempts where user_id = ${s.uid} order by d desc limit 60`;
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const set = new Set(days.map((r) => String(r.d).slice(0, 10)));
  let cursor = new Date(today);
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1); // streak survives until end of today
  while (set.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return NextResponse.json({ agg, exams, due: due[0]?.n || 0, streak });
}
