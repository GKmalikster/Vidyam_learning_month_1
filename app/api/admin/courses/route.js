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

export async function POST(request) {
  const { title, description, categoryId } = await request.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const row = await db.queryOne(
    "INSERT INTO courses (title, description, category_id, status) VALUES ($1,$2,$3,'draft') RETURNING id",
    [title, description || "", categoryId || null]
  );
  return NextResponse.json({ id: row.id }, { status: 201 });
}
