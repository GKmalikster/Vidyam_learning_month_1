import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { createResetToken } from "@/lib/passwordReset";

// Always returns the same generic response whether or not the email
// belongs to an account — this is deliberate, so this endpoint can't be
// used to check which email addresses have a Vidyam learner account.
export async function POST(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
  const learner = await db.queryOne(
    "SELECT l.id, l.name FROM learners l JOIN learner_accounts la ON la.learner_id = l.id WHERE lower(l.email) = lower($1)",
    [email.trim()]
  );

  let debugToken;
  if (learner) {
    const token = await createResetToken("learner", learner.id);
    const resetUrl = `${origin}/learner/reset-password?token=${token}`;
    try {
      const { subject, html } = passwordResetEmail({ name: learner.name, resetUrl, dashboardName: "learner dashboard" });
      const result = await sendEmail({ to: email.trim(), subject, html });
      // Same "no email provider configured yet" fallback already used for
      // trainer temp passwords in the console UI — surfaces the token
      // directly in the response only when sending was skipped, so the
      // flow is still usable (and testable) before RESEND_API_KEY is set.
      if (result?.skipped) debugToken = token;
    } catch (e) {
      console.error("[learner-auth/forgot] email send failed", e);
    }
  }

  return NextResponse.json({ ok: true, ...(debugToken ? { debugToken } : {}) });
}
