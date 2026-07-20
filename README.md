# AnthroTest — anthrotest.com

Study platform for Claude certifications: two tracks (Architect Foundations / Entry-Level
Fundamentals), 85 original practice questions, blueprint-weighted mock exams (forms A/B/C/Random),
study notes with audio, spaced repetition, an AI tutor (server-side API key), a team leaderboard,
real email auth with password reset, and optional weekly progress report emails.

**Independent study resource — not affiliated with Anthropic.** The footer disclaimer ships on
every page; keep it there.

## Stack
Next.js 14 (App Router) · Supabase (auth + Postgres) · Anthropic API (tutor) · Resend (optional
weekly emails) · Vercel (hosting + cron).

## Setup — about 20 minutes

### 1. Supabase (~7 min)
1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/migrations/001_init.sql`.
3. Authentication → Providers → Email: leave "Confirm email" ON (recommended).
4. Authentication → URL Configuration → set Site URL to `https://anthrotest.com` and add
   `http://localhost:3000` to redirect URLs for local dev.
5. Project Settings → API: copy the **URL**, **anon key**, and **service_role key**.

### 2. Local run (~5 min)
```bash
cp .env.example .env.local   # paste your keys
npm install
npm run dev                  # http://localhost:3000
```
Create your account, then make yourself admin in the SQL editor:
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

### 3. Vercel + domain (~5 min)
1. Push this folder to a GitHub repo, import it in Vercel.
2. Add the env vars from `.env.local` in Vercel → Settings → Environment Variables.
3. Vercel → Settings → Domains → add `anthrotest.com` and follow the DNS instructions at your
   registrar (usually an A record to 76.76.21.21 and a CNAME for www).

### 4. Optional: weekly report emails (~5 min)
1. Create a Resend account, verify the anthrotest.com domain (they give you 3 DNS records).
2. Set `RESEND_API_KEY`, `REPORT_FROM`, and `CRON_SECRET` in Vercel.
3. `vercel.json` already schedules `/api/report` for Fridays 14:00 UTC (~9am Austin). Vercel Cron
   sends the `Authorization: Bearer CRON_SECRET` header automatically when CRON_SECRET is set.
Skip this entirely and everything else still works.

## Where things live
- Question banks & notes: `src/lib/data/content.js` (edit/add questions here for now)
- Track config (exam length, timing, weights): `src/lib/tracks.ts`
- Tutor system prompt & model: `src/app/api/tutor/route.ts`
- DB schema & RLS: `supabase/migrations/001_init.sql`

## Roadmap ideas (not built yet)
- Admin UI for the `submissions` table (schema is ready — approving currently means moving the
  question into `content.js`)
- Wrong-answer notebook page (SRS data is already collected)
- Hands-on labs with AI grading (the `/api/tutor` route can grade; needs a page)
- Readiness score + streaks on the dashboard

## Security notes
- The Anthropic key and Supabase service-role key are **server-only** (API routes). Never prefix
  them with `NEXT_PUBLIC_`.
- Row Level Security is on: users can only read/write their own attempts/SRS; exam results and
  display names are readable by signed-in users to power the leaderboard.
- The tutor route is unauthenticated in v1 (rate-limit it or add an auth check if the site is
  public-facing and traffic grows).
