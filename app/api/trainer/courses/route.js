import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// Lists only the courses this trainer is actually part of — i.e. courses
// that have at least one of their sessions attached — so the trainer
// dashboard never shows courses run entirely by other trainers.
export async function GET() {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await db.queryAll(
    `SELECT DISTINCT co.*
     FROM courses co
     JOIN sessions s ON s.course_id = co.id
     WHERE s.trainer_id = $1
     ORDER BY co.created_at DESC`,
    [session.trainerId]
  );
  return NextResponse.json(rows);
}
