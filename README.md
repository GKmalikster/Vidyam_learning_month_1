# Vidyam Learning Month — full-stack LMS

A real Next.js application backed by Postgres: public program listings and
registration, a separate unlinked Content Manager for admins, and now a
full learning-management layer — trainer accounts with their own
dashboard, course rollout (multi-session bundles), session lifecycle
management, attendance/waitlist tracking, materials & recordings, learner
feedback, and automated email reminders. Built to deploy cleanly on
**Vercel**, paired with a free **Neon** Postgres database and (optionally)
**Resend** for email.

## What's in this version

**Public site** (`/`, `/trainers`, `/programs/[id]`, `/join`, `/teach`)
- Home page shows live programs, published multi-part **courses**, and a
  **Past programs** section (completed sessions with recordings/materials).
- Program detail pages show capacity/waitlist status, trainer profile,
  posted materials, a recording link once available, and a star-rating
  feedback form anyone can use.
- The learner registration form (`/join`) automatically waitlists a
  learner if a session has hit its capacity, and tells them so.

**Trainer Dashboard** (`/trainer/login`, `/trainer/dashboard`) — new
- Approved trainers get their own login (separate credential system from
  admin — see `lib/trainerAuth.js`), issued automatically the moment an
  admin approves their application.
- From their dashboard, a trainer can: propose new sessions (3 candidate
  time slots, same rule as the public apply form), see who's registered
  for their sessions, post materials and a recording link, mark a session
  completed, set weekly availability windows, and edit their own public
  profile/photo.
- Like `/console`, this is a separate, unlinked surface — protected by
  `middleware.js` before any page or API code runs.

**Content Manager** (`/console/login`, `/console`)
- **Programs** — roll out sessions directly, assign capacity and a course,
  and move sessions through their lifecycle: live → **completed** (with a
  recording) → **archived** (hidden everywhere) or restored.
- **Session requests** — approve/hold trainer-proposed sessions (from the
  public apply form or a trainer's own dashboard), picking one of their 3
  candidate time slots.
- **Courses** — create a multi-session course bundle, publish it, and
  attach existing sessions to it in order; published courses get their own
  band on the home page.
- **Trainers & mentors** — approving a pending application provisions
  their dashboard login and emails them the credentials via Resend (or, if
  Resend isn't configured, shows you the temporary password once so you
  can share it yourself).
- **Registrants** — per-session registrant list with one-click attendance
  marking, waitlist promotion, and a CSV export button.

**Automated reminders** — a Vercel Cron job (`/api/cron/reminders`, see
`vercel.json`) runs daily, finds approved sessions happening in the next
~2 days that haven't been reminded yet, and emails every confirmed
registrant via Resend. Every attempted email (reminders and trainer
approvals) is logged in the `notifications_queue` table regardless of
whether sending is configured, so nothing is silently lost.

## Setting up your database (Neon)

1. Go to **neon.tech**, sign up free, and create a new project.
2. On the project dashboard, copy the **connection string** — it looks
   like `postgres://user:password@ep-xxxx.neon.tech/dbname?sslmode=require`.
3. That's your `DATABASE_URL`. The app creates its own tables and seed
   data automatically the first time it connects — no manual SQL needed,
   including for anyone upgrading from the pre-LMS version of this app
   (the new tables/columns are added via idempotent `ALTER TABLE` /
   `CREATE TABLE IF NOT EXISTS` statements in `lib/db.js`).

(Supabase works the same way if you'd rather use that — Project Settings →
Database → Connection string.)

## Setting up email (Resend) — optional but recommended

Without this, the app still works end to end — trainer approval and
session reminders are just skipped (and logged) instead of sent.

1. Go to **resend.com**, sign up free (100 emails/day, 3,000/month on the
   free tier — plenty for a community like this).
2. Create an API key and copy it.
3. Add `RESEND_API_KEY` as an environment variable (see below). Optionally
   set `EMAIL_FROM` once you've verified your own sending domain in Resend
   — until then, the default `onboarding@resend.dev` sender works for
   testing.

## Running it locally

Create a `.env.local` file in the project root:
```
DATABASE_URL=your-neon-connection-string
SESSION_SECRET=some-long-random-string
RESEND_API_KEY=your-resend-key       # optional
EMAIL_FROM=Vidyam Learning Month <you@yourdomain.com>   # optional
CRON_SECRET=some-long-random-string  # optional locally, required to protect the cron endpoint in production
```
then:
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site,
`http://localhost:3000/console/login` for the Content Manager, and
`http://localhost:3000/trainer/login` for the Trainer Dashboard.

On first connection, the schema is created and seeded automatically:

| Login | ID / Email | Password |
|---|---|---|
| Admin | `admin.mukesh` | `vidyam@2026` |
| Admin | `admin.meera` | `vidyam@2026` |
| Admin | `admin.kabir` | `vidyam@2026` |
| Trainer (seed data) | e.g. `ritika@example.com` | `trainer@2026` |

**Change these before going live** — update the `admins` table or a
trainer's row in `trainer_accounts` directly (Neon's SQL editor, or any
Postgres client) with a new bcrypt hash, the same way you would have with
the pre-LMS version.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Your Neon/Supabase Postgres connection string. |
| `SESSION_SECRET` | Yes in production | Long random string signing both admin and trainer session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `SEED_ADMIN_PASSWORD` | No | Password for the three seeded admin accounts, first run only. |
| `RESEND_API_KEY` | No | Enables trainer-approval emails and session reminders. Without it, both are skipped and logged instead of failing. |
| `EMAIL_FROM` | No | Sender address for outgoing email. Defaults to a Resend testing address. |
| `CRON_SECRET` | Recommended in production | Protects `/api/cron/reminders` from being triggered by anyone who finds the URL. Vercel automatically sends this as a Bearer token to your own Cron job once the env var is set. |

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, **Add New Project** → import the repo. Make sure **Framework
   Preset** is detected as **Next.js** (if it ever shows "Other", change it
   manually in Settings → Build and Deployment — that one setting is what
   makes Vercel package your pages into real functions instead of just
   copying `public/`).
3. In **Settings → Environment Variables**, add `DATABASE_URL`,
   `SESSION_SECRET`, and optionally `RESEND_API_KEY`, `EMAIL_FROM`,
   `CRON_SECRET`. Vercel's one-click **Neon integration** (Storage →
   Connect Database) can create the database and populate `DATABASE_URL`
   for you — leave "Custom Prefix" blank so the variable is named exactly
   `DATABASE_URL`.
4. Deploy. `vercel.json` in this project registers the daily reminders
   Cron job automatically — nothing else to configure for it.
5. Point your subdomain at the resulting `*.vercel.app` URL:
   - **If DNS is at Wix** (nameservers `ns0.wixdns.net` /
     `ns1.wixdns.net`): Wix Dashboard → Domains → `gkconsulting.in` → DNS
     Records → Add Record → CNAME → Host `vidyam` → Value
     `cname.vercel-dns.com` (confirm the exact value on the project's
     Domains tab).
   - **If DNS is at BigRock**: My Orders → `gkconsulting.in` → Manage DNS →
     CNAME tab → Add Record → same Host/Value.
   - Add the domain under Vercel's **Settings → Domains** so it serves
     your app for that hostname; SSL is issued automatically.
6. For a separate address for the Content Manager (e.g.
   `admin.gkconsulting.in`), add a second CNAME the same way and a small
   rewrite in `next.config.mjs` mapping that host to `/console` — ask if
   you'd like this wired up.

## Project structure

```
app/
  page.js                       Home — live programs, course bands, past programs
  trainers/page.js               Trainers grid
  programs/[id]/page.js          Program detail — materials, recording, feedback
  join/, teach/                  Learner + trainer public forms
  console/login/, console/       Admin login + dashboard (DashShell sidebar UI)
  trainer/login/, trainer/dashboard/   Trainer login + dashboard (same DashShell)
  components/
    DashShell.jsx                 Shared sidebar-dashboard shell (console + trainer)
    FeedbackForm.jsx               Star-rating feedback widget (program detail)
    ProgramGrid.jsx, JoinForm.jsx, TeachForm.jsx, SiteNav.jsx, Footer.jsx
  api/
    categories, trainers, sessions, sessions/[id], sessions/[id]/materials,
    sessions/[id]/feedback, registrations, courses          Public reads + submissions
    trainers/apply                                           Public trainer application
    auth/**                                                  Admin session management
    trainer-auth/**                                           Trainer session management (separate cookie)
    admin/**                                                 Behind middleware.js — full CRUD + lifecycle actions
    trainer/**                                               Behind middleware.js — trainer's own sessions/materials/availability/profile
    cron/reminders                                           Vercel Cron target — session reminder emails
lib/
  db.js            Postgres schema (courses, sessions, trainer_accounts,
                    session_materials, session_feedback, notifications_queue,
                    etc.), seed data, and the query/queryOne/queryAll helpers
  auth.js          Admin session token signing/verification (Web Crypto)
  trainerAuth.js   Same scheme, separate cookie/secret namespace for trainers
  email.js         Resend wrapper — trainer-approval + reminder email templates
middleware.js      Access boundary for /console, /api/admin, /trainer, /api/trainer
vercel.json        Registers the daily reminders Cron job
```

## Known limitations to plan for next

- Trainer/learner photo uploads are stored as base64 in the database
  column — fine at this scale, move to object storage (Vercel Blob or
  S3-compatible) before volumes get large.
- Feedback and materials/recording visibility are honour-system (no
  learner login exists to check "did you actually register" against) —
  matches the site's free, open-community philosophy, but worth revisiting
  if abuse becomes a concern.
- Vercel's Hobby plan limits Cron jobs to once per day, which is why
  reminders run daily rather than hourly — upgrading to Pro allows finer
  scheduling if you want same-day reminders sent closer to session time.
- No rate limiting yet on public endpoints (registration, feedback,
  trainer applications).
- No password reset flow for admins or trainers — resetting a forgotten
  password currently means updating the database directly.
- Neon's free tier auto-suspends after inactivity; the first request after
  a while may take a couple of extra seconds to "wake" it.
