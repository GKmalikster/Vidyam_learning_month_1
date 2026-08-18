import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { consumeResetToken } from "@/lib/passwordReset";
import { createLearnerSessionToken, LEARNER_SESSION_COOKIE_NAME, LEARNER_SESSION_MAX_AGE } from "@/lib/learnerAuth";

// Consumes a single-use reset token, updates the password, and signs the
// learner in immediately — same reasoning as auto-sign-in on registration:
// they just proved they control both the email and the new password, so
// making them log in again right after is pure friction.
export async function POST(request) {
  const { token, password, confirmPassword } = await request.json();
  if (!token) return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords don't match" }, { status: 400 });
  }

  const reset = await consumeResetToken("learner", token);
  if (!reset) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.query("UPDATE learner_accounts SET password_hash = $1 WHERE learner_id = $2", [hash, reset.account_id]);

  const learner = await db.queryOne("SELECT * FROM learners WHERE id = $1", [reset.account_id]);
  const sessionToken = await createLearnerSessionToken(learner);
  const res = NextResponse.json({ ok: true, name: learner.name });
  res.cookies.set(LEARNER_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LEARNER_SESSION_MAX_AGE,
  });
  return res;
}
