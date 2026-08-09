import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

// Public: trainer onboarding submission. Creates a pending trainer plus
// zero or more pending sessions (each carrying up to 3 proposed time slots).
// Nothing here is visible on the public site until an admin approves it —
// see /api/admin/trainers/[id] and /api/admin/sessions/[id]. Trainers set
// their own password right here at apply time (rather than waiting for a
// system-generated temp password after approval); the account exists
// immediately but login is still blocked until status flips to 'approved'
// (enforced in /api/trainer-auth/login).
export async function POST(request) {
  const body = await request.json();
  const { name, email, password, years, bio, topics, mode, linkedin, availability, expertise, motivation, photo, proposals, referralId } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await db.queryOne("SELECT id FROM trainers WHERE email = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "An application with this email already exists." }, { status: 409 });
  }

  const trainerRow = await db.queryOne(
    `INSERT INTO trainers
      (name, email, years, bio, topics, mode, linkedin, availability, expertise, motivation, photo, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')
     RETURNING id`,
    [
      name, email, years || "", bio || "", topics || "", mode || "",
      linkedin || "", JSON.stringify(availability || []), JSON.stringify(expertise || []),
      motivation || "", photo || null,
    ]
  );
  const trainerId = trainerRow.id;

  const passwordHash = bcrypt.hashSync(password, 10);
  await db.query(
    "INSERT INTO trainer_accounts (trainer_id, password_hash, must_reset) VALUES ($1, $2, false)",
    [trainerId, passwordHash]
  );

  const createdSessionIds = [];
  for (const p of proposals || []) {
    if (!p.title || !p.categoryId || !p.brief) continue;
    const validSlots = (p.slots || []).filter((s) => s.date && s.time);
    if (validSlots.length < 3) continue; // require all 3 slots, matches prior prototype rule
    const row = await db.queryOne(
      `INSERT INTO sessions (title, category_id, brief, trainer_id, status, slots)
       VALUES ($1,$2,$3,$4,'pending',$5) RETURNING id`,
      [p.title, p.categoryId, p.brief, trainerId, JSON.stringify(validSlots)]
    );
    createdSessionIds.push(row.id);
  }

  if (referralId) {
    // Link this application back to the referral that produced it, so the
    // admin console and the eventual approval-thank-you email can trace it.
    await db.query(
      "UPDATE referrals SET status = 'applied', trainer_id = $1 WHERE id = $2 AND status != 'applied'",
      [trainerId, referralId]
    );
  }

  return NextResponse.json({ trainerId, createdSessionIds }, { status: 201 });
}
