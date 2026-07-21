// @ts-nocheck
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const rows = await sql`select qid, misses from srs where user_id = ${s.uid} and qid not like 'ai\\_%' order by misses desc, due asc`;
  return NextResponse.json({ rows });
}
