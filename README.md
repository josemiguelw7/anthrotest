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

## Feature map
- **Notebook** (`/notebook`): every missed question, worst-first, one-tap drill.
- **Labs** (`/labs`): write tool definitions / CLAUDE.md / prompts; AI grades against a rubric.
- **Flashcards** (`/cards`): tap-through deck from the study notes. Installable as a PWA
  (Add to Home Screen) via `public/manifest.webmanifest`.
- **AI drills**: dashboard "AI drill" button generates 5 fresh questions targeting your weakest
  domain (`/api/generate`); they count toward stats but not spaced repetition.
- **Readiness verdict**: dashboard blends mock scores + coverage-weighted accuracy and links to
  Pearson VUE when you look ready. Exam registration itself runs through Anthropic Partner Academy.
- **Question bank in Postgres**: admins add/edit questions at `/admin` (live instantly, no
  deploy); anyone can propose via `/submit`; the 85 built-ins stay in `src/lib/data/content.js`.
- **Learning path** (`/path`): 5 beginner units (read -> listen -> 5-question checkpoint at 4/5
  to unlock the next), progress bar on the dashboard. Content in `src/lib/data/path.js`.
- **Glossary** (`/glossary`): 56 plain-English terms with analogies; the same terms are tappable
  (dotted underline) inside explanations, notes, and path content — never inside live question
  text, so definitions can't leak answers. Also available as a flashcard deck. Content in
  `src/lib/data/glossary.js`.
- **Placement** (`/start`): 6-question diagnostic that routes beginners to the path and veterans
  to CCA-F drills. Doesn't touch stats.
- **"Explain it simpler"**: jargon-free AI re-explanations on every practice question and study
  note card.
- **Time tracking**: a 1-minute heartbeat (visible tabs only) into `time_log`; dashboard shows
  total and this-week hours. `path_progress` and `time_log` tables auto-create on first use.
- **Access fencing** (optional): set `ALLOWED_EMAIL_DOMAINS` and/or `INVITE_CODE` to close
  registration to the team. Unset = open sign-ups.

Existing deploys: the `questions` table is auto-created on first use (or re-run `/api/setup?key=...`).

## Security notes
- `DATABASE_URL`, `AUTH_SECRET`, and `ANTHROPIC_API_KEY` are **server-only** — never prefix
  with `NEXT_PUBLIC_`. The database is only ever touched from API routes.
- Passwords are bcrypt-hashed; sessions are httpOnly signed cookies (30-day JWT).
- All data routes check the session; users can only write their own rows. The leaderboard
  exposes display names + best mock scores to signed-in users only.
- The tutor route is behind login-less POST in v1 — add a session check or rate limit if the
  site opens beyond the team.
