// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
const ensure = () => sql`create table if not exists path_progress (
  user_id uuid not null, unit int not null, best int not null default 0,
  passed boolean not null default false, updated_at timestamptz not null default now(),
  primary key (user_id, unit)
)`;

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await ensure();
  const rows = await sql`select unit, best, passed from path_progress where user_id = ${s.uid}`;
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await ensure();
  const { unit, score, total } = await req.json();
  if (!(unit >= 1 && unit <= 5) || !(total > 0)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const passed = score >= Math.ceil(total * 0.8);
  await sql`insert into path_progress (user_id, unit, best, passed) values (${s.uid}, ${unit}, ${score}, ${passed})
    on conflict (user_id, unit) do update set best = greatest(path_progress.best, ${score}), passed = path_progress.passed or ${passed}, updated_at = now()`;
  return NextResponse.json({ ok: true, passed });
}
