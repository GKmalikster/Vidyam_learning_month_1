import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { createResetToken } from "@/lib/passwordReset";

// Same generic-response pattern as the learner version — see that file for
// why the response never reveals whether the email has an account.
export async function POST(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
  const trainer = await db.queryOne(
    "SELECT t.id, t.name FROM trainers t JOIN trainer_accounts ta ON ta.trainer_id = t.id WHERE lower(t.email) = lower($1)",
    [email.trim()]
  );

  let debugToken;
  if (trainer) {
    const token = await createResetToken("trainer", trainer.id);
    const resetUrl = `${origin}/trainer/reset-password?token=${token}`;
    try {
      const { subject, html } = passwordResetEmail({ name: trainer.name, resetUrl, dashboardName: "trainer dashboard" });
      const result = await sendEmail({ to: email.trim(), subject, html });
      if (result?.skipped) debugToken = token;
    } catch (e) {
      console.error("[trainer-auth/forgot] email send failed", e);
    }
  }

  return NextResponse.json({ ok: true, ...(debugToken ? { debugToken } : {}) });
}
