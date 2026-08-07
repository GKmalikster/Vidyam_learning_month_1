import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// Setting a recording link is also how a trainer marks a session done —
// it flips status to 'completed' so it moves from "Upcoming" to "Past
// programs" on the public site, materials/recording included.
export async function PATCH(request, { params }) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const owns = await db.queryOne("SELECT id, status FROM sessions WHERE id = $1 AND trainer_id = $2", [id, session.trainerId]);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { recordingUrl, markCompleted } = await request.json();
  if (markCompleted) {
    await db.query("UPDATE sessions SET recording_url = $1, status = 'completed' WHERE id = $2", [recordingUrl || "", id]);
  } else {
    await db.query("UPDATE sessions SET recording_url = $1 WHERE id = $2", [recordingUrl || "", id]);
  }
  return NextResponse.json({ ok: true });
}
