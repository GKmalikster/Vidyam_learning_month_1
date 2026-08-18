import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

// Voluntary change-password for a signed-in trainer, distinct from
// /api/trainer-auth/set-password (used for the forced first-login reset of
// a temporary password) and /api/trainer-auth/reset (emailed-token flow for
// someone locked out) — this one requires the current password.
export async function POST(request) {
  const session = await getTrainerSession();
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

  const account = await db.queryOne("SELECT password_hash FROM trainer_accounts WHERE trainer_id = $1", [session.trainerId]);
  if (!account || !bcrypt.compareSync(currentPassword, account.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  await db.query("UPDATE trainer_accounts SET password_hash = $1 WHERE trainer_id = $2", [hash, session.trainerId]);
  return NextResponse.json({ ok: true });
}
