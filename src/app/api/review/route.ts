// @ts-nocheck
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const rows = await sql`select qid from srs where user_id = ${s.uid} and due <= now()`;
  return NextResponse.json({ qids: rows.map((r) => r.qid) });
}
