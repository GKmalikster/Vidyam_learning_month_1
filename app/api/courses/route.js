import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: published courses (multi-session bundles) with their approved
// sessions attached, in curriculum order.
export async function GET() {
  const courses = await db.queryAll(`
    SELECT co.*, c.name as category_name, c.color as category_color
    FROM courses co LEFT JOIN categories c ON c.id = co.category_id
    WHERE co.status = 'published'
    ORDER BY co.created_at DESC
  `);
  const sessions = await db.queryAll(`
    SELECT s.id, s.title, s.date, s.time, s.course_id, s.course_order
    FROM sessions s WHERE s.course_id IS NOT NULL AND s.status IN ('approved','completed')
    ORDER BY s.course_order ASC
  `);
  const withSessions = courses.map((c) => ({
    ...c,
    sessions: sessions.filter((s) => s.course_id === c.id),
  }));
  return NextResponse.json(withSessions);
}
