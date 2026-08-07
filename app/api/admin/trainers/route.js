import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = await db.queryAll("SELECT * FROM trainers ORDER BY created_at DESC");
  const trainers = rows.map((t) => ({
    ...t,
    availability: JSON.parse(t.availability || "[]"),
    expertise: JSON.parse(t.expertise || "[]"),
  }));
  return NextResponse.json(trainers);
}

// Admin adding a trainer directly — pre-approved, unlike the public apply flow.
// Optionally accepts a `programs` array so the admin can roll out one or more
// sessions for this trainer in the same submission — each entry can be
// attached to a different course, so a single trainer ends up linked to as
// many courses as the admin wants right from the start (mirrors the fields
// on "Roll out a new program" in the Programs tab).
export async function POST(request) {
  const body = await request.json();
  const { name, email, years, bio, topics, mode, linkedin, availability, expertise, photo, programs } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const row = await db.queryOne(
    `INSERT INTO trainers (name, email, years, bio, topics, mode, linkedin, availability, expertise, photo, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved') RETURNING id`,
    [
      name, email || "", years || "", bio || "", topics || "", mode || "",
      linkedin || "", JSON.stringify(availability || []), JSON.stringify(expertise || []), photo || null,
    ]
  );
  const trainerId = row.id;

  const createdSessionIds = [];
  for (const p of programs || []) {
    if (!p.title || !p.title.trim()) continue;
    const s = await db.queryOne(
      `INSERT INTO sessions (title, category_id, brief, date, time, trainer_id, status, slots, course_id, capacity)
       VALUES ($1,$2,$3,$4,$5,$6,'approved','[]',$7,$8) RETURNING id`,
      [p.title, p.categoryId || null, p.brief || "", p.date || "", p.time || "", trainerId, p.courseId || null, p.capacity || null]
    );
    createdSessionIds.push(s.id);
  }

  return NextResponse.json({ id: trainerId, createdSessionIds }, { status: 201 });
}
