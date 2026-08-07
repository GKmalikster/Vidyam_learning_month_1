// lib/db.js
// Real, persistent Postgres data layer for the Vidyam Learning Month app.
// Works with any standard Postgres connection string — Neon and Supabase
// (both free-tier friendly) are the ones documented in README.md, and this
// is what makes the app deployable on Vercel: unlike a local SQLite file,
// a network Postgres database isn't tied to any one server's disk.
//
// All queries go through the three helpers below (query/queryOne/queryAll)
// so every API route and server component uses the same connection pool.

import { Pool } from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Point it at your Postgres connection string " +
      "(see README.md — Neon or Supabase both work) before starting the app."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon/Supabase both require TLS; rejectUnauthorized:false matches the
  // connection string's sslmode=require without needing a local CA bundle.
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Every exported query helper waits for schema+seed setup first. init()/
// seedIfEmpty() below use `pool.query` directly (not these helpers) to
// avoid a circular await-on-itself deadlock during that very setup.
export async function query(text, params) {
  await ensureReady();
  return pool.query(text, params);
}
export async function queryOne(text, params) {
  await ensureReady();
  const res = await pool.query(text, params);
  return res.rows[0];
}
export async function queryAll(text, params) {
  await ensureReady();
  const res = await pool.query(text, params);
  return res.rows;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  years TEXT,
  bio TEXT,
  topics TEXT,
  mode TEXT,
  linkedin TEXT,
  availability TEXT DEFAULT '[]',
  expertise TEXT DEFAULT '[]',
  motivation TEXT,
  photo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  brief TEXT,
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  trainer_id INTEGER REFERENCES trainers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  slots TEXT DEFAULT '[]',
  hold_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  age_group TEXT,
  role TEXT,
  education TEXT,
  industry TEXT,
  experience TEXT,
  interests TEXT DEFAULT '[]',
  linkedin TEXT,
  format TEXT,
  language TEXT,
  time_pref TEXT,
  is_returning TEXT,
  goal TEXT,
  source TEXT,
  consent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

let initPromise = null;

// Called once (lazily, on first query) rather than at module load, since
// module load can happen many times across serverless invocations — this
// makes sure schema creation + seeding only runs once per cold start, and
// is safe if two invocations race (ON CONFLICT DO NOTHING everywhere).
export function ensureReady() {
  if (!initPromise) initPromise = init();
  return initPromise;
}

async function init() {
  await pool.query(SCHEMA_SQL);
  await seedIfEmpty();
}

async function seedIfEmpty() {
  const adminCountRes = await pool.query("SELECT COUNT(*)::int as count FROM admins");
  if (adminCountRes.rows[0].count > 0) return;

  const defaultPass = process.env.SEED_ADMIN_PASSWORD || "vidyam@2026";
  const hash = bcrypt.hashSync(defaultPass, 10);
  const admins = [
    ["admin.mukesh", "Mukesh", hash],
    ["admin.meera", "Meera Iyer", hash],
    ["admin.kabir", "Kabir Malhotra", hash],
  ];
  for (const [id, name, ph] of admins) {
    await pool.query(
      "INSERT INTO admins (id, name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
      [id, name, ph]
    );
  }

  const catCountRes = await pool.query("SELECT COUNT(*)::int as count FROM categories");
  if (catCountRes.rows[0].count > 0) return; // categories/trainers/sessions already seeded by a concurrent process

  const cats = [
    ["Career & Future of Work", "#006afd"],
    ["Technology & AI", "#00cffe"],
    ["Business & Fundraising", "#fe8502"],
    ["Legal & Compliance", "#0a1a4f"],
    ["Mindset & Psychology", "#923efb"],
    ["Finance", "#a7e318"],
  ];
  const catIds = {};
  for (const [name, color] of cats) {
    const res = await pool.query(
      "INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING id",
      [name, color]
    );
    catIds[name] = res.rows[0].id;
  }

  const trainers = [
    { name: "Ritika Shah", email: "ritika@example.com", years: "9", bio: "Product leader turned career coach, ex-Flipkart.", topics: "Career pivots, resume storytelling", mode: "Online", availability: ["Weekday evenings"], expertise: [catIds["Career & Future of Work"]] },
    { name: "Devika Nair", email: "devika@example.com", years: "6", bio: "ML engineer building applied-AI tools for startups.", topics: "Practical AI adoption, prompt design", mode: "Online", availability: ["Weekends"], expertise: [catIds["Technology & AI"]] },
    { name: "Arjun Mehta", email: "arjun@example.com", years: "11", bio: "Founder, two exits; now advises early-stage teams.", topics: "Fundraising, pitch decks, negotiation", mode: "Hybrid", availability: ["Flexible / either"], expertise: [catIds["Business & Fundraising"]] },
    { name: "Priya Kulkarni", email: "priya@example.com", years: "14", bio: "Corporate lawyer specialising in startup compliance.", topics: "Contracts, IP, compliance basics", mode: "Online", availability: ["Weekday evenings"], expertise: [catIds["Legal & Compliance"]] },
    { name: "Sana Fernandes", email: "sana@example.com", years: "8", bio: "Organisational psychologist and executive coach.", topics: "Resilience, decision-making under pressure", mode: "Online", availability: ["Weekends", "Weekday evenings"], expertise: [catIds["Mindset & Psychology"], catIds["Finance"]] },
  ];
  const trainerIds = [];
  for (const t of trainers) {
    const res = await pool.query(
      `INSERT INTO trainers (name, email, years, bio, topics, mode, availability, expertise, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'approved') RETURNING id`,
      [t.name, t.email, t.years, t.bio, t.topics, t.mode, JSON.stringify(t.availability), JSON.stringify(t.expertise)]
    );
    trainerIds.push(res.rows[0].id);
  }

  const sessions = [
    { title: "Reworking Your Career Story for 2026", categoryId: catIds["Career & Future of Work"], brief: "A practical session on repositioning your resume and LinkedIn narrative for the roles you actually want next.", date: "2026-08-18", time: "7:00 – 8:00 PM IST", trainerId: trainerIds[0], status: "approved", slots: "[]" },
    { title: "AI Tools You Can Use at Work Tomorrow", categoryId: catIds["Technology & AI"], brief: "Hands-on walkthrough of AI tools that save real time on writing, research and analysis.", date: "2026-08-20", time: "11:00 AM – 12:00 PM IST", trainerId: trainerIds[1], status: "approved", slots: "[]" },
    { title: "Fundraising 101: What Investors Actually Look For", categoryId: catIds["Business & Fundraising"], brief: "Cut through the noise on pitch decks and term sheets with someone who's raised and exited twice.", date: "2026-08-22", time: "6:30 – 7:30 PM IST", trainerId: trainerIds[2], status: "approved", slots: "[]" },
    { title: "Contracts & Compliance for First-Time Founders", categoryId: catIds["Legal & Compliance"], brief: "The legal basics every founder needs before their first hire or first client contract.", date: "2026-08-24", time: "7:00 – 8:00 PM IST", trainerId: trainerIds[3], status: "approved", slots: "[]" },
    { title: "Building Resilience Under Pressure", categoryId: catIds["Mindset & Psychology"], brief: "Evidence-based techniques for staying clear-headed through high-stakes weeks.", date: "2026-08-19", time: "8:00 – 9:00 PM IST", trainerId: trainerIds[4], status: "approved", slots: "[]" },
    { title: "Personal Finance for the Sandwich Generation", categoryId: catIds["Finance"], brief: "Balancing your own goals with supporting parents and kids — a realistic money framework.", date: "2026-08-26", time: "7:30 – 8:30 PM IST", trainerId: trainerIds[4], status: "approved", slots: "[]" },
    {
      title: "Negotiation as a System: Psychological Levers & Frameworks",
      categoryId: catIds["Business & Fundraising"],
      brief: "A structured look at negotiation as a repeatable system rather than a personality trait.",
      date: "", time: "", trainerId: trainerIds[2], status: "pending",
      slots: JSON.stringify([
        { date: "2026-08-25", time: "7:00 – 8:00 PM IST" },
        { date: "2026-08-27", time: "8:00 – 9:00 PM IST" },
        { date: "2026-08-29", time: "11:00 AM – 12:00 PM IST" },
      ]),
    },
  ];
  for (const s of sessions) {
    await pool.query(
      `INSERT INTO sessions (title, category_id, brief, date, time, trainer_id, status, slots)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [s.title, s.categoryId, s.brief, s.date, s.time, s.trainerId, s.status, s.slots]
    );
  }
}

const db = { query, queryOne, queryAll, ensureReady, pool };
export default db;
