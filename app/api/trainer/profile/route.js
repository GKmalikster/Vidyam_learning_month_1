import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// Lets an approved trainer keep their own public-facing profile current
// (bio, topics, photo, etc.) without needing an admin to edit it for them.
export async function PUT(request) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { bio, topics, mode, linkedin, photo, availability } = await request.json();
  await db.query(
    `UPDATE trainers SET bio = $1, topics = $2, mode = $3, linkedin = $4, photo = $5, availability = $6 WHERE id = $7`,
    [bio || "", topics || "", mode || "", linkedin || "", photo || null, JSON.stringify(availability || []), session.trainerId]
  );
  return NextResponse.json({ ok: true });
}
