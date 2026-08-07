import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { verifyTrainerSessionToken, TRAINER_SESSION_COOKIE_NAME } from "@/lib/trainerAuth";

// Lets a signed-in trainer set a new password — used both for the
// first-login "must reset" flow and as an optional change-password action.
export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRAINER_SESSION_COOKIE_NAME)?.value;
  const session = await verifyTrainerSessionToken(token);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { password } = await request.json();
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.query(
    "UPDATE trainer_accounts SET password_hash = $1, must_reset = false WHERE trainer_id = $2",
    [hash, session.trainerId]
  );
  return NextResponse.json({ ok: true });
}
