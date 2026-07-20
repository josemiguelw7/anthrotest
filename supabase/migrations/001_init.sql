-- AnthroTest schema. Run in Supabase SQL Editor (or supabase db push).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  is_admin boolean not null default false,
  wants_reports boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  qid text not null,
  track text not null check (track in ('arch','assoc')),
  domain int not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on public.attempts(user_id);

create table public.exam_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  track text not null check (track in ('arch','assoc')),
  form text not null,
  score int not null,
  total int not null,
  pct int not null,
  by_dom jsonb not null,
  created_at timestamptz not null default now()
);
create index exam_results_user_idx on public.exam_results(user_id);

create table public.srs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  qid text not null,
  misses int not null default 1,
  ivl int not null default 1,
  due timestamptz not null,
  primary key (user_id, qid)
);

create table public.submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  track text not null,
  domain int not null,
  q text not null,
  opts jsonb not null,
  a int not null,
  why text not null,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.exam_results enable row level security;
alter table public.srs enable row level security;
alter table public.submissions enable row level security;

-- Profiles: everyone signed in can read names (for the leaderboard); you edit only yours.
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);

-- Attempts / SRS: private to the owner.
create policy "attempts own" on public.attempts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "srs own" on public.srs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Exam results: owner writes; all signed-in users can read (powers the team board).
create policy "exams insert own" on public.exam_results for insert to authenticated with check (auth.uid() = user_id);
create policy "exams readable" on public.exam_results for select to authenticated using (true);

-- Submissions: owner writes/reads own; admins read all and update status.
create policy "subs insert own" on public.submissions for insert to authenticated with check (auth.uid() = user_id);
create policy "subs read own" on public.submissions for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "subs admin update" on public.submissions for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Make yourself admin after signing up (replace the email):
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
