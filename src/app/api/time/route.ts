// @ts-nocheck
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
const ensure = () => sql`create table if not exists time_log (
  user_id uuid not null, day date not null, minutes int not null default 0,
  primary key (user_id, day)
)`;

// One heartbeat = one active minute. Client sends at most 1/min while the tab is visible.
export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await ensure();
  await sql`insert into time_log (user_id, day, minutes) values (${s.uid}, current_date, 1)
    on conflict (user_id, day) do update set minutes = least(time_log.minutes + 1, 720)`;
  return NextResponse.json({ ok: true });
}
