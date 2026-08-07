import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// open_slots is a JSON array of { day, start, end } windows a trainer is
// generally free in — separate from `availability` (the coarse tags like
// "Weekday evenings" shown on the public trainer card) and from a
// session's own 3 proposed time slots. This is what the console can look
// at when working out when to schedule a trainer next.
export async function GET() {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const row = await db.queryOne("SELECT open_slots FROM trainers WHERE id = $1", [session.trainerId]);
  return NextResponse.json(JSON.parse(row?.open_slots || "[]"));
}

export async function PUT(request) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const slots = await request.json();
  await db.query("UPDATE trainers SET open_slots = $1 WHERE id = $2", [JSON.stringify(slots || []), session.trainerId]);
  return NextResponse.json({ ok: true });
}
