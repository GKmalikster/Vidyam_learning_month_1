import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: approved sessions only, joined with trainer + category info.
export async function GET() {
  const rows = await db.queryAll(`
    SELECT s.id, s.title, s.brief, s.date, s.time, s.category_id,
           c.name as category_name, c.color as category_color,
           t.id as trainer_id, t.name as trainer_name, t.photo as trainer_photo, t.bio as trainer_bio
    FROM sessions s
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN trainers t ON t.id = s.trainer_id
    WHERE s.status = 'approved'
    ORDER BY s.date ASC
  `);
  return NextResponse.json(rows);
}
