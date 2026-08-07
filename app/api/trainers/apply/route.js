import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: trainer onboarding submission. Creates a pending trainer plus
// zero or more pending sessions (each carrying up to 3 proposed time slots).
// Nothing here is visible on the public site until an admin approves it —
// see /api/admin/trainers/[id] and /api/admin/sessions/[id].
export async function POST(request) {
  const body = await request.json();
  const { name, email, years, bio, topics, mode, linkedin, availability, expertise, motivation, photo, proposals } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
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

  return NextResponse.json({ trainerId, createdSessionIds }, { status: 201 });
}
