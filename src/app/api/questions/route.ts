// @ts-nocheck
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { mergeBanks } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let rows = [];
  try { rows = await sql`select id, track, domain, q, opts, a, why from questions where active`; }
  catch {
    try {
      await sql`create table if not exists questions (
        id text primary key, track text not null, domain int not null, q text not null,
        opts jsonb not null, a int not null, why text not null,
        active boolean not null default true, source text, created_at timestamptz not null default now()
      )`;
    } catch {}
  }
  return NextResponse.json({ banks: mergeBanks(rows) });
}
