import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createTrainerSessionToken, TRAINER_SESSION_COOKIE_NAME, TRAINER_SESSION_MAX_AGE } from "@/lib/trainerAuth";

// Trainers sign in with the email address their application/profile is
// under, plus the password from their approval email (or one they've since
// reset). This is a separate credential system from admin login — see
// trainer_accounts in lib/db.js.
export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const trainer = await db.queryOne(
    "SELECT t.*, ta.password_hash, ta.must_reset FROM trainers t JOIN trainer_accounts ta ON ta.trainer_id = t.id WHERE lower(t.email) = lower($1)",
    [email.trim()]
  );
  if (!trainer || !bcrypt.compareSync(password, trainer.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (trainer.status !== "approved") {
    return NextResponse.json({ error: "Your trainer application isn't approved yet." }, { status: 403 });
  }

  const token = await createTrainerSessionToken(trainer);
  const res = NextResponse.json({ id: trainer.id, name: trainer.name, mustReset: trainer.must_reset });
  res.cookies.set(TRAINER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRAINER_SESSION_MAX_AGE,
  });
  return res;
}
