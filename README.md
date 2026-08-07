# Vidyam Learning Month — real full-stack app

This replaces the earlier single-file HTML prototype with a real Next.js
application: a proper Postgres database, real password-hashed admin
authentication, and a Content Manager that lives on its own unlinked route
so public visitors never receive its code or data. It's built specifically
to deploy cleanly on **Vercel**, paired with a free **Neon** Postgres
database.

## What changed from the prototype

- **Real database**, not in-memory JS state that reset on every page
  refresh. Uses Postgres via the `pg` client — works with Neon, Supabase,
  or any standard Postgres connection string. Unlike a local file, this is
  a network database, so it works correctly across Vercel's serverless
  functions (which don't have a persistent disk).
- **Real authentication.** Admin passwords are bcrypt-hashed in the
  database, never in source code. Sessions are signed, httpOnly cookies
  with an 8-hour expiry, verified server-side on every request.
- **Content Manager is a separate, unlinked surface.** `/console/*` and
  `/api/admin/*` are blocked by `middleware.js` *before* any page or API
  code runs — an unauthenticated visitor gets redirected/rejected before
  seeing any admin markup or data. Nothing links to `/console` from the
  public site; it's reachable only if you know the URL and log in.
- **Public site** (`/`, `/trainers`, `/programs/[id]`, `/join`, `/teach`) is
  server-rendered from the live database, so a new admin-approved program
  is visible immediately — no manual redeploy needed.

## Setting up your database (Neon)

1. Go to **neon.tech**, sign up free, and create a new project.
2. On the project dashboard, copy the **connection string** it gives you —
   it looks like `postgres://user:password@ep-xxxx.neon.tech/dbname?sslmode=require`.
3. That's your `DATABASE_URL` (see below). The app creates its own tables
   and seed data automatically the first time it connects — no manual SQL
   needed.

(Supabase works the same way if you'd rather use that — Project Settings →
Database → Connection string.)

## Running it locally

```bash
npm install
DATABASE_URL="your-neon-connection-string" npm run dev
```

Or create a `.env.local` file in the project root with:
```
DATABASE_URL=your-neon-connection-string
SESSION_SECRET=some-long-random-string
```
then just run `npm run dev`.

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/console/login` for the Content Manager.

On first connection, the schema is created automatically and seeded with
the same demo categories, trainers, and programs the prototype had. Three
admin accounts are seeded:

| Admin ID       | Password      |
|----------------|---------------|
| `admin.mukesh` | `vidyam@2026` |
| `admin.meera`  | `vidyam@2026` |
| `admin.kabir`  | `vidyam@2026` |

**Change these passwords before going live** — either add a "change
password" admin API route, or update the `admins` table directly (in
Neon's SQL editor, or any Postgres client) with a new bcrypt hash.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Your Neon/Supabase Postgres connection string. |
| `SESSION_SECRET` | Yes in production | Long random string signing admin session cookies. Without it, an insecure development default is used. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `SEED_ADMIN_PASSWORD` | No | Password used for the three seeded admin accounts on first run only. Set this before the very first deploy instead of relying on the `vidyam@2026` default. |

## Deploying to Vercel

1. Push this project to a GitHub repo (Vercel deploys straight from a repo
   — or use `vercel` CLI to deploy the folder directly if you'd rather skip
   GitHub).
2. In Vercel, **Add New Project** → import the repo.
3. In the project's **Settings → Environment Variables**, add `DATABASE_URL`
   (your Neon connection string), `SESSION_SECRET`, and optionally
   `SEED_ADMIN_PASSWORD`. Vercel also has a one-click **Neon integration**
   under Storage → Connect Database if you'd rather create the database
   from inside Vercel instead of neon.tech directly — either way you end up
   with the same `DATABASE_URL`.
4. Deploy. Vercel builds and runs it with zero other configuration — no
   Dockerfile, no build command changes needed.
5. You'll get a URL like `vidyam-app.vercel.app`. Point your subdomain at
   it:
   - **If DNS is at Wix** (your nameservers currently show
     `ns0.wixdns.net` / `ns1.wixdns.net`): Wix Dashboard → Domains →
     `gkconsulting.in` → DNS Records → Add Record → CNAME → Host `vidyam`
     → Value: `cname.vercel-dns.com` (Vercel's standard CNAME target — the
     project's Domains tab will confirm the exact value to use).
   - **If DNS is at BigRock**: My Orders → `gkconsulting.in` → Manage DNS →
     CNAME tab → Add Record → same Host/Value.
   - Then add the domain in Vercel's project **Settings → Domains** so it
     knows to serve your app for that hostname, and Vercel issues the SSL
     certificate automatically.
6. For the Content Manager to also have its own clearly separate address
   (e.g. `admin.gkconsulting.in`), add a second CNAME for `admin` the same
   way, add it as a domain in Vercel too, and add a small rewrite in
   `next.config.mjs` that maps requests arriving on the `admin.` host to
   `/console` — ask if you'd like this wired up, it's a small addition.

## Project structure

```
app/
  page.js                    Home (server component, reads DB directly)
  trainers/page.js           Trainers grid
  programs/[id]/page.js      Program detail
  join/page.js + components/JoinForm.jsx      Learner registration wizard
  teach/page.js + components/TeachForm.jsx    Trainer onboarding + session proposals
  console/login/page.js      Admin login (only public-facing admin route)
  console/page.js            Admin dashboard — Programs / Session requests /
                              Trainers / Categories / Registrations tabs
  api/
    categories, trainers, sessions, sessions/[id], registrations   Public reads + submissions
    trainers/apply                                                  Public trainer application
    auth/login, auth/logout, auth/me                                Session management
    admin/**                                                        Everything behind middleware.js
lib/
  db.js      Postgres schema, seed data, and the one place all queries go
             through (query/queryOne/queryAll) — this is the only file that
             would need to change to swap Postgres providers
  auth.js    Session token signing/verification (Web Crypto — works in both
             Node and Edge runtimes, which is why middleware.js can use it too)
middleware.js  The actual access boundary for /console and /api/admin
```

## Known limitations to plan for next

- Trainer/learner photo uploads are stored as base64 in the database
  column, same as the prototype — fine at this scale, but move to object
  storage (Vercel Blob, or S3-compatible) before volumes get large, since
  large base64 blobs bloat every query that touches those rows.
- No rate limiting or audit logging wired up yet on admin actions (the
  `audit_log` table exists in the schema but nothing writes to it yet).
- No password reset flow — resetting a forgotten admin password currently
  means updating the database directly.
- Neon's free tier auto-suspends the database after a period of
  inactivity; the first request after a while may take a couple of extra
  seconds to "wake" it. Fine for this scale, worth knowing about.
