-- AnthroTest schema for Neon Postgres. Run once in the Neon SQL editor.
create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  pw_hash text not null,
  is_admin boolean not null default false,
  wants_reports boolean not null default true,
  reset_token text,
  reset_expires timestamptz,
  created_at timestamptz not null default now()
);

create table attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  qid text not null,
  track text not null,
  domain int not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on attempts(user_id, created_at);

create table exam_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  track text not null,
  form text not null,
  score int not null,
  total int not null,
  pct int not null,
  by_dom jsonb not null,
  created_at timestamptz not null default now()
);
create index exam_results_user_idx on exam_results(user_id);

create table srs (
  user_id uuid not null references users(id) on delete cascade,
  qid text not null,
  misses int not null default 1,
  ivl int not null default 1,
  due timestamptz not null,
  primary key (user_id, qid)
);

create table submissions (
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
);

-- Make yourself admin after signing up:
-- update users set is_admin = true where email = 'you@example.com';
