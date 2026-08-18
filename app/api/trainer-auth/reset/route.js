import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { consumeResetToken } from "@/lib/passwordReset";
import { createTrainerSessionToken, TRAINER_SESSION_COOKIE_NAME, TRAINER_SESSION_MAX_AGE } from "@/lib/trainerAuth";

export async function POST(request) {
  const { token, password, confirmPassword } = await request.json();
  if (!token) return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords don't match" }, { status: 400 });
  }

  const reset = await consumeResetToken("trainer", token);
  if (!reset) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.query("UPDATE trainer_accounts SET password_hash = $1, must_reset = false WHERE trainer_id = $2", [hash, reset.account_id]);

  const trainer = await db.queryOne("SELECT * FROM trainers WHERE id = $1", [reset.account_id]);
  const sessionToken = await createTrainerSessionToken(trainer);
  const res = NextResponse.json({ ok: true, name: trainer.name });
  res.cookies.set(TRAINER_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRAINER_SESSION_MAX_AGE,
  });
  return res;
}
