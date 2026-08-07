import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// Registrant list scoped to sessions this trainer actually owns — a
// trainer can never pull another trainer's registrant list, even by
// guessing a session id.
export async function GET(request, { params }) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;

  const owns = await db.queryOne("SELECT id FROM sessions WHERE id = $1 AND trainer_id = $2", [id, session.trainerId]);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db.queryAll(
    "SELECT id, name, email, city, role, attended, waitlisted, created_at FROM registrations WHERE session_id = $1 ORDER BY waitlisted ASC, created_at ASC",
    [id]
  );
  return NextResponse.json(rows);
}
