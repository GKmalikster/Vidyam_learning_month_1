import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendEmail, referralInviteEmail } from "@/lib/email";

// Admin: manual status override (e.g. marking a stalled referral "declined")
// and a "send reminder" action that re-sends the original invite email to
// the referred person and stamps reminder_sent_at, so the console can show
// when the last nudge went out.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await db.queryOne("SELECT * FROM referrals WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "remind") {
    if (!existing.referred_email) {
      return NextResponse.json({ error: "This referral has no email on file to remind." }, { status: 400 });
    }
    const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
    const params2 = new URLSearchParams({
      name: existing.referred_name, email: existing.referred_email, ref: String(existing.id), refName: existing.referrer_name,
    });
    const applyUrl = `${origin}/teach?${params2.toString()}`;
    let emailSent = false;
    try {
      const { subject, html } = referralInviteEmail({
        referredName: existing.referred_name, referrerName: existing.referrer_name, note: existing.why_great || "", applyUrl,
      });
      const result = await sendEmail({ to: existing.referred_email, subject, html });
      emailSent = !result.skipped;
      await db.query(
        "INSERT INTO notifications_queue (type, recipient_email, subject, body, status, sent_at) VALUES ($1,$2,$3,$4,$5, CASE WHEN $5='sent' THEN NOW() ELSE NULL END)",
        ["referral_reminder", existing.referred_email, subject, html, emailSent ? "sent" : "skipped"]
      );
    } catch (e) {
      await db.query(
        "INSERT INTO notifications_queue (type, recipient_email, subject, body, status, error) VALUES ($1,$2,$3,$4,'failed',$5)",
        ["referral_reminder", existing.referred_email, "You've been referred to Vidyam Learning Month", "", e.message]
      );
    }
    await db.query("UPDATE referrals SET reminder_sent_at = NOW() WHERE id = $1", [id]);
    return NextResponse.json({ ok: true, emailSent });
  }

  const merged = { status: body.status ?? existing.status };
  await db.query("UPDATE referrals SET status = $1 WHERE id = $2", [merged.status, id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.query("DELETE FROM referrals WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
