// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const ensureQuestions = () => sql`create table if not exists questions (
  id text primary key, track text not null, domain int not null, q text not null,
  opts jsonb not null, a int not null, why text not null,
  active boolean not null default true, source text, created_at timestamptz not null default now()
)`;

async function admin() {
  const s = await getSession();
  if (!s?.admin) return null;
  return s;
}

export async function GET(req: NextRequest) {
  const s = await admin();
  if (!s) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await ensureQuestions();
  const subs = await sql`select sub.*, u.name as by_name from submissions sub join users u on u.id = sub.user_id where sub.status = 'pending' order by sub.created_at`;
  const questions = await sql`select * from questions order by created_at desc`;
  return NextResponse.json({ subs, questions });
}

export async function POST(req: NextRequest) {
  const s = await admin();
  if (!s) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await ensureQuestions();
  const b = await req.json();
  const act = b.action;

  if (act === "approve") {
    const rows = await sql`select * from submissions where id = ${b.id} and status = 'pending'`;
    if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
    const sub = rows[0];
    const qid = `c_${sub.id}`;
    await sql`insert into questions (id, track, domain, q, opts, a, why, source) values (${qid}, ${sub.track}, ${sub.domain}, ${sub.q}, ${JSON.stringify(sub.opts)}, ${sub.a}, ${sub.why}, ${"submission:" + sub.by_name || sub.user_id}) on conflict (id) do nothing`;
    await sql`update submissions set status = 'approved' where id = ${b.id}`;
    return NextResponse.json({ ok: true });
  }
  if (act === "reject") { await sql`update submissions set status = 'rejected' where id = ${b.id}`; return NextResponse.json({ ok: true }); }
  if (act === "create" || act === "update") {
    const { id, track, domain, q, opts, a, why } = b;
    if (!q?.trim() || !Array.isArray(opts) || opts.length !== 4 || a < 0 || a > 3 || !why?.trim()) return NextResponse.json({ error: "invalid question" }, { status: 400 });
    const qid = act === "create" ? `c_m${Date.now()}` : id;
    await sql`insert into questions (id, track, domain, q, opts, a, why, source) values (${qid}, ${track}, ${domain}, ${q.trim()}, ${JSON.stringify(opts)}, ${a}, ${why.trim()}, ${"admin"})
      on conflict (id) do update set track = ${track}, domain = ${domain}, q = ${q.trim()}, opts = ${JSON.stringify(opts)}, a = ${a}, why = ${why.trim()}`;
    return NextResponse.json({ ok: true, id: qid });
  }
  if (act === "toggle") { await sql`update questions set active = not active where id = ${b.id}`; return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
