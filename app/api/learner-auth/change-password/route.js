import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getLearnerSession } from "@/lib/learnerAuth";

// Voluntary password change from a signed-in learner's own profile screen —
// distinct from /api/learner-auth/reset (which is for someone who's locked
// out): this one requires the current password, that one requires a
// single-use emailed token instead.
export async function POST(request) {
  const session = await getLearnerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { currentPassword, newPassword, confirmPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords don't match" }, { status: 400 });
  }

  const account = await db.queryOne("SELECT password_hash FROM learner_accounts WHERE learner_id = $1", [session.learnerId]);
  if (!account || !bcrypt.compareSync(currentPassword, account.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  await db.query("UPDATE learner_accounts SET password_hash = $1 WHERE learner_id = $2", [hash, session.learnerId]);
  return NextResponse.json({ ok: true });
}
