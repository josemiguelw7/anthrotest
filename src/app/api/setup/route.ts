// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// One-time (but idempotent) schema bootstrap + admin promotion.
// GET /api/setup?key=AUTH_SECRET            -> creates tables if missing
// GET /api/setup?key=AUTH_SECRET&admin=you@x.com -> also flags that user admin
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET)
    return NextResponse.json({ ok: false, error: "bad key" }, { status: 401 });

  try {
    await sql`create extension if not exists pgcrypto`;
    await sql`create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      name text not null,
      pw_hash text not null,
      is_admin boolean not null default false,
      wants_reports boolean not null default true,
      reset_token text,
      reset_expires timestamptz,
      created_at timestamptz not null default now()
    )`;
    await sql`create table if not exists attempts (
      id bigint generated always as identity primary key,
      user_id uuid not null references users(id) on delete cascade,
      qid text not null,
      track text not null,
      domain int not null,
      correct boolean not null,
      created_at timestamptz not null default now()
    )`;
    await sql`create index if not exists attempts_user_idx on attempts(user_id, created_at)`;
    await sql`create table if not exists exam_results (
      id bigint generated always as identity primary key,
      user_id uuid not null references users(id) on delete cascade,
      track text not null,
      form text not null,
      score int not null,
      total int not null,
      pct int not null,
      by_dom jsonb not null,
      created_at timestamptz not null default now()
    )`;
    await sql`create index if not exists exam_results_user_idx on exam_results(user_id)`;
    await sql`create table if not exists srs (
      user_id uuid not null references users(id) on delete cascade,
      qid text not null,
      misses int not null default 1,
      ivl int not null default 1,
      due timestamptz not null,
      primary key (user_id, qid)
    )`;
    await sql`create table if not exists submissions (
      id bigint generated always as identity primary key,
      user_id uuid not null references users(id) on delete cascade,
      track text not null,
      domain int not null,
      q text not null,
      opts jsonb not null,
      a int not null,
      why text not null,
      status text not null default 'pending',
      created_at timestamptz not null default now()
    )`;

    let promoted = null;
    const admin = req.nextUrl.searchParams.get("admin");
    if (admin) {
      const r = await sql`update users set is_admin = true where email = ${admin.toLowerCase().trim()} returning email`;
      promoted = r.length ? r[0].email : `no user with email ${admin} yet — sign up first, then call this again`;
    }
    const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`;
    return NextResponse.json({ ok: true, tables: tables.map((t) => t.table_name), promoted });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
