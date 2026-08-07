import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTrainerSessionToken, TRAINER_SESSION_COOKIE_NAME } from "@/lib/trainerAuth";
import db from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRAINER_SESSION_COOKIE_NAME)?.value;
  const session = await verifyTrainerSessionToken(token);
  if (!session) return NextResponse.json({ trainer: null });

  const trainer = await db.queryOne(
    `SELECT t.id, t.name, t.email, t.years, t.bio, t.topics, t.mode, t.linkedin, t.photo,
            t.availability, t.open_slots, ta.must_reset
     FROM trainers t JOIN trainer_accounts ta ON ta.trainer_id = t.id WHERE t.id = $1`,
    [session.trainerId]
  );
  if (!trainer) return NextResponse.json({ trainer: null });

  return NextResponse.json({
    trainer: {
      ...trainer,
      availability: JSON.parse(trainer.availability || "[]"),
      openSlots: JSON.parse(trainer.open_slots || "[]"),
      mustReset: trainer.must_reset,
    },
  });
}
