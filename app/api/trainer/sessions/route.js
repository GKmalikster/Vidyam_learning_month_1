import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// A trainer's own sessions, every status included (unlike the public API
// which only ever returns status='approved'), plus a live registrant count
// so the dashboard can show "24 registered" without a second round trip.
export async function GET() {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await db.queryAll(
    `SELECT s.*, c.name as category_name, c.color as category_color,
            co.title as course_title,
            (SELECT COUNT(*)::int FROM registrations r WHERE r.session_id = s.id AND r.waitlisted = false) as registered_count,
            (SELECT COUNT(*)::int FROM registrations r WHERE r.session_id = s.id AND r.waitlisted = true) as waitlist_count
     FROM sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN courses co ON co.id = s.course_id
     WHERE s.trainer_id = $1
     ORDER BY s.created_at DESC`,
    [session.trainerId]
  );
  const sessions = rows.map((s) => ({ ...s, slots: JSON.parse(s.slots || "[]") }));
  return NextResponse.json(sessions);
}

// A trainer proposing a new session from their own dashboard — same rule
// as the public apply flow (3 candidate time slots), always starts pending
// so it still goes through the console's Session requests review.
export async function POST(request) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { title, categoryId, brief, slots, capacity } = await request.json();
  if (!title || !categoryId || !brief) {
    return NextResponse.json({ error: "Title, category and brief are required." }, { status: 400 });
  }
  const validSlots = (slots || []).filter((s) => s.date && s.time);
  if (validSlots.length < 3) {
    return NextResponse.json({ error: "Propose 3 candidate time slots." }, { status: 400 });
  }

  const row = await db.queryOne(
    `INSERT INTO sessions (title, category_id, brief, trainer_id, status, slots, capacity)
     VALUES ($1,$2,$3,$4,'pending',$5,$6) RETURNING id`,
    [title, categoryId, brief, session.trainerId, JSON.stringify(validSlots), capacity || null]
  );
  return NextResponse.json({ id: row.id }, { status: 201 });
}
