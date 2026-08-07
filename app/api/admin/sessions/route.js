import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = await db.queryAll(`
    SELECT s.*, c.name as category_name, c.color as category_color, t.name as trainer_name
    FROM sessions s
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN trainers t ON t.id = s.trainer_id
    ORDER BY s.created_at DESC
  `);
  const sessions = rows.map((s) => ({ ...s, slots: JSON.parse(s.slots || "[]") }));
  return NextResponse.json(sessions);
}

// Admin adding a program directly — published immediately (status approved),
// unlike a trainer-proposed session which starts pending.
export async function POST(request) {
  const { title, categoryId, brief, date, time, trainerId } = await request.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const row = await db.queryOne(
    `INSERT INTO sessions (title, category_id, brief, date, time, trainer_id, status, slots)
     VALUES ($1,$2,$3,$4,$5,$6,'approved','[]') RETURNING id`,
    [title, categoryId || null, brief || "", date || "", time || "", trainerId || null]
  );
  return NextResponse.json({ id: row.id }, { status: 201 });
}
