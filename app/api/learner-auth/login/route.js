import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createLearnerSessionToken, LEARNER_SESSION_COOKIE_NAME, LEARNER_SESSION_MAX_AGE } from "@/lib/learnerAuth";

// Learners sign in with the email + password they set on the public Join
// form. A learner without an account yet (registered before this feature,
// or skipped the optional password field) gets a clear error pointing them
// back to /join to set one up — this is a separate credential system from
// admin/trainer login, see learner_accounts in lib/db.js.
export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const learner = await db.queryOne(
    "SELECT l.*, la.password_hash FROM learners l JOIN learner_accounts la ON la.learner_id = l.id WHERE lower(l.email) = lower($1)",
    [email.trim()]
  );
  if (!learner || !bcrypt.compareSync(password, learner.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createLearnerSessionToken(learner);
  const res = NextResponse.json({ id: learner.id, name: learner.name });
  res.cookies.set(LEARNER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LEARNER_SESSION_MAX_AGE,
  });
  return res;
}
