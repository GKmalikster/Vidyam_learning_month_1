import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { sendEmail, trainerApprovedEmail, trainerApprovedNoPasswordEmail } from "@/lib/email";

function randomTempPassword() {
  // 10 url-safe characters — easy enough to read aloud/copy if the admin
  // has to relay it manually when Resend isn't configured yet.
  return crypto.randomBytes(8).toString("base64url").slice(0, 10);
}

// PATCH handles both edits and status changes (approve / reject) — the
// console UI sends whichever fields changed. Approving a trainer for the
// first time also provisions their dashboard login (trainer_accounts) and
// emails them the credentials.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await db.queryOne("SELECT * FROM trainers WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = {
    name: body.name ?? existing.name,
    email: body.email ?? existing.email,
    years: body.years ?? existing.years,
    bio: body.bio ?? existing.bio,
    topics: body.topics ?? existing.topics,
    mode: body.mode ?? existing.mode,
    linkedin: body.linkedin ?? existing.linkedin,
    availability: body.availability ? JSON.stringify(body.availability) : existing.availability,
    expertise: body.expertise ? JSON.stringify(body.expertise) : existing.expertise,
    photo: body.photo ?? existing.photo,
    status: body.status ?? existing.status,
  };

  await db.query(
    `UPDATE trainers SET name=$1, email=$2, years=$3, bio=$4, topics=$5,
     mode=$6, linkedin=$7, availability=$8, expertise=$9, photo=$10, status=$11
     WHERE id = $12`,
    [
      merged.name, merged.email, merged.years, merged.bio, merged.topics,
      merged.mode, merged.linkedin, merged.availability, merged.expertise,
      merged.photo, merged.status, id,
    ]
  );

  let tempPassword = null;
  let emailSent = false;
  const justApproved = body.status === "approved" && existing.status !== "approved";
  if (justApproved) {
    // Trainers who applied via /teach already set their own password at
    // apply time, so a trainer_accounts row usually exists already — in
    // that case skip temp-password generation entirely and just let them
    // know they can log in. Only fall back to generating a temp password
    // for the rare case of no account yet (e.g. a trainer added directly
    // in the console rather than through the public application).
    const account = await db.queryOne("SELECT id FROM trainer_accounts WHERE trainer_id = $1", [id]);
    const selfRegistered = !!account;
    if (!account) {
      tempPassword = randomTempPassword();
      const hash = bcrypt.hashSync(tempPassword, 10);
      await db.query(
        "INSERT INTO trainer_accounts (trainer_id, password_hash, must_reset) VALUES ($1, $2, true)",
        [id, hash]
      );
    }

    if (merged.email) {
      try {
        const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
        const { subject, html } = selfRegistered
          ? trainerApprovedNoPasswordEmail({
              trainerName: merged.name,
              loginUrl: `${origin}/trainer/login`,
            })
          : trainerApprovedEmail({
              trainerName: merged.name,
              loginUrl: `${origin}/trainer/login`,
              tempPassword,
            });
        const result = await sendEmail({ to: merged.email, subject, html });
        emailSent = !result.skipped;
        await db.query(
          "INSERT INTO notifications_queue (type, recipient_email, subject, body, status, sent_at) VALUES ($1,$2,$3,$4,$5, CASE WHEN $5='sent' THEN NOW() ELSE NULL END)",
          ["trainer_approved", merged.email, subject, html, emailSent ? "sent" : "skipped"]
        );
      } catch (e) {
        await db.query(
          "INSERT INTO notifications_queue (type, recipient_email, subject, body, status, error) VALUES ($1,$2,$3,$4,'failed',$5)",
          ["trainer_approved", merged.email, "You're approved to train on Vidyam Learning Month", "", e.message]
        );
      }
    }
  }

  return NextResponse.json({ ok: true, tempPassword, emailSent });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  // Unassign (not cascade-delete) any sessions pointing at this trainer,
  // matching the prior prototype's behaviour.
  await db.query("UPDATE sessions SET trainer_id = NULL WHERE trainer_id = $1", [id]);
  await db.query("DELETE FROM trainer_accounts WHERE trainer_id = $1", [id]);
  await db.query("DELETE FROM trainers WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
