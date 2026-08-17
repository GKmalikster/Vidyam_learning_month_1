import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = await db.queryAll(`
    SELECT co.*, c.name as category_name, c.color as category_color,
           (SELECT COUNT(*)::int FROM sessions s WHERE s.course_id = co.id) as session_count
    FROM courses co
    LEFT JOIN categories c ON c.id = co.category_id
    ORDER BY co.created_at DESC
  `);
  return NextResponse.json(rows);
}

// Optionally accepts a `sessions` array so the admin can roll out the
// course's session(s) — with full program details (trainer, date, time,
// capacity) — in the same submission, instead of creating the course here
// and then attaching sessions separately from the Programs tab.
export async function POST(request) {
  const { title, description, categoryId, sessions, image, previewImage } = await request.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const row = await db.queryOne(
    "INSERT INTO courses (title, description, category_id, status, image, preview_image) VALUES ($1,$2,$3,'draft',$4,$5) RETURNING id",
    [title, description || "", categoryId || null, image || "", previewImage || ""]
  );
  const courseId = row.id;

  const createdSessionIds = [];
  for (const s of sessions || []) {
    if (!s.title || !s.title.trim()) continue;
    const created = await db.queryOne(
      `INSERT INTO sessions (title, category_id, brief, date, time, trainer_id, status, slots, course_id, capacity)
       VALUES ($1,$2,$3,$4,$5,$6,'approved','[]',$7,$8) RETURNING id`,
      [s.title, s.categoryId || null, s.brief || "", s.date || "", s.time || "", s.trainerId || null, courseId, s.capacity || null]
    );
    createdSessionIds.push(created.id);
  }

  return NextResponse.json({ id: courseId, createdSessionIds }, { status: 201 });
}
