# AnthroTest — anthrotest.com

Study platform for Claude certifications: two tracks (Architect Foundations / Entry-Level
Fundamentals), 85 original practice questions, blueprint-weighted mock exams (forms A/B/C/Random),
study notes with audio, spaced repetition, an AI tutor (server-side API key), a team leaderboard,
real email auth with password reset, and optional weekly progress report emails.

**Independent study resource — not affiliated with Anthropic.** The footer disclaimer ships on
every page; keep it there.

## Stack
Next.js 14 (App Router) · Neon Postgres (free tier) · built-in email+password auth (bcrypt +
signed session cookies) · Anthropic API (tutor) · Resend (optional emails) · Vercel (hosting + cron).

## Setup — about 15 minutes

### 1. Neon Postgres (~5 min)
1. In Vercel: your project → Storage → Create Database → **Neon** (free plan) → it auto-adds
   `DATABASE_URL` to your project env. (Or create at console.neon.tech and copy the pooled
   connection string yourself.)
2. Open the Neon SQL Editor → paste and run `db/schema.sql`.

### 2. Local run (~5 min)
```bash
cp .env.example .env.local   # paste DATABASE_URL, AUTH_SECRET (openssl rand -hex 32), ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```
Create your account, then make yourself admin in the Neon SQL editor:
```sql
update users set is_admin = true where email = 'YOUR_EMAIL';
```

### 3. Vercel + domain (~5 min)
1. Push this folder to a GitHub repo, import it in Vercel.
2. Add `AUTH_SECRET` and `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables
   (`DATABASE_URL` is already there if you created Neon through Vercel).
3. Vercel → Settings → Domains → add `anthrotest.com` and follow the DNS instructions at your
   registrar (usually an A record to 76.76.21.21 and a CNAME for www).

### 4. Optional: emails — weekly reports AND password-reset links (~5 min)
1. Create a Resend account, verify the anthrotest.com domain (they give you 3 DNS records).
2. Set `RESEND_API_KEY`, `REPORT_FROM`, and `CRON_SECRET` in Vercel.
3. `vercel.json` already schedules `/api/report` for Fridays 14:00 UTC (~9am Austin). Vercel Cron
   sends the `Authorization: Bearer CRON_SECRET` header automatically when CRON_SECRET is set.
Skip this and everything else still works — password resets then fall back to "ask the admin"
(you can set any user's password by updating `pw_hash` — or just have them sign up again).

## Where things live
- Question banks & notes: `src/lib/data/content.js` (edit/add questions here for now)
- Track config (exam length, timing, weights): `src/lib/tracks.ts`
- Tutor system prompt & model: `src/app/api/tutor/route.ts`
- Auth (signup/login/reset): `src/app/api/auth/[action]/route.ts` + `src/lib/session.ts`
- DB schema: `db/schema.sql`

## Roadmap ideas (not built yet)
- Admin UI for the `submissions` table (schema is ready — approving currently means moving the
  question into `content.js`)
- Wrong-answer notebook page (SRS data is already collected)
- Hands-on labs with AI grading (the `/api/tutor` route can grade; needs a page)
- Readiness score + streaks on the dashboard

## Security notes
- `DATABASE_URL`, `AUTH_SECRET`, and `ANTHROPIC_API_KEY` are **server-only** — never prefix
  with `NEXT_PUBLIC_`. The database is only ever touched from API routes.
- Passwords are bcrypt-hashed; sessions are httpOnly signed cookies (30-day JWT).
- All data routes check the session; users can only write their own rows. The leaderboard
  exposes display names + best mock scores to signed-in users only.
- The tutor route is behind login-less POST in v1 — add a session check or rate limit if the
  site opens beyond the team.
