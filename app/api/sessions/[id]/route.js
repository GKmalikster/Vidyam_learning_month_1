import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: single approved session detail, with full trainer profile.
export async function GET(request, { params }) {
  const { id } = await params;
  const row = await db.queryOne(
    `SELECT s.*, c.name as category_name, c.color as category_color,
            t.id as trainer_id, t.name as trainer_name, t.bio as trainer_bio,
            t.topics as trainer_topics, t.years as trainer_years, t.mode as trainer_mode,
            t.linkedin as trainer_linkedin, t.photo as trainer_photo
     FROM sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     WHERE s.id = $1 AND s.status = 'approved'`,
    [id]
  );

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
