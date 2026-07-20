// @ts-nocheck
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const rows = await sql`
    select u.name,
      max(e.pct) filter (where e.track = 'arch') as arch,
      max(e.pct) filter (where e.track = 'assoc') as assoc,
      count(e.id)::int as n
    from users u left join exam_results e on e.user_id = u.id
    group by u.id, u.name
    order by max(e.pct) filter (where e.track = 'arch') desc nulls last`;
  return NextResponse.json({ rows });
}
