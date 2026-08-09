import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendEmail, referralInviteEmail } from "@/lib/email";

// Public: refer one or more people as potential trainers/mentors/coaches.
// Referring is an introduction, not an application on someone else's
// behalf — each referred person gets a warm, personal invite email and
// must complete their own /teach application to actually become a trainer
// (see /api/trainers/apply, which links the resulting trainer back to the
// referral row via referralId).
export async function POST(request) {
  const body = await request.json();
  const { referrerName, referrerEmail, referrerRelationship, consent, referrals } = body;

  if (!referrerName || !referrerEmail) {
    return NextResponse.json({ error: "Your name and email are required" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Please confirm you have permission to share their contact details" }, { status: 400 });
  }
  if (!Array.isArray(referrals) || referrals.length === 0) {
    return NextResponse.json({ error: "Add at least one person to refer" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
  const createdIds = [];

  for (const ref of referrals) {
    if (!ref.name || !ref.name.trim()) continue;
    if (!ref.email && !ref.phone) continue;

    const row = await db.queryOne(
      `INSERT INTO referrals
        (referrer_name, referrer_email, referrer_relationship, referred_name, referred_email, referred_phone,
         category_id, how_known, why_great, consent, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,'invited') RETURNING id`,
      [
        referrerName, referrerEmail, referrerRelationship || "", ref.name, ref.email || "", ref.phone || "",
        ref.categoryId || null, ref.howKnown || "", ref.whyGreat || "",
      ]
    );
    createdIds.push(row.id);

    if (ref.email) {
      const params = new URLSearchParams({ name: ref.name, email: ref.email, ref: String(row.id), refName: referrerName });
      const applyUrl = `${origin}/teach?${params.toString()}`;
      try {
        const { subject, html } = referralInviteEmail({
          referredName: ref.name, referrerName, note: ref.whyGreat || "", applyUrl,
        });
        const result = await sendEmail({ to: ref.email, subject, html });
        await db.query(
          "INSERT INTO notifications_queue (type, recipient_email, subject, body, status, sent_at) VALUES ($1,$2,$3,$4,$5, CASE WHEN $5='sent' THEN NOW() ELSE NULL END)",
          ["referral_invite", ref.email, subject, html, result.skipped ? "skipped" : "sent"]
        );
      } catch (e) {
        await db.query(
          "INSERT INTO notifications_queue (type, recipient_email, subject, body, status, error) VALUES ($1,$2,$3,$4,'failed',$5)",
          ["referral_invite", ref.email, "You've been referred to Vidyam Learning Month", "", e.message]
        );
      }
    }
  }

  return NextResponse.json({ createdIds }, { status: 201 });
}
