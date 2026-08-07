import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendEmail, sessionReminderEmail } from "@/lib/email";

// Triggered by Vercel Cron (see vercel.json) roughly hourly. Finds approved
// sessions happening within the next ~26 hours that haven't had a reminder
// sent yet, emails every confirmed (non-waitlisted) registrant, then stamps
// reminder_sent_at so the same session is never emailed twice.
//
// Protected by CRON_SECRET so this can't be triggered by a random visitor
// hammering the URL — Vercel Cron automatically sends this as a Bearer
// token when CRON_SECRET is set as a project env var.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dueSessions = await db.queryAll(`
    SELECT id, title, date, time FROM sessions
    WHERE status = 'approved'
      AND reminder_sent_at IS NULL
      AND date <> ''
      AND (date::date) BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '2 day')
  `);

  let emailsSent = 0;
  const results = [];
  for (const session of dueSessions) {
    const registrants = await db.queryAll(
      "SELECT name, email FROM registrations WHERE session_id = $1 AND waitlisted = false",
      [session.id]
    );
    for (const r of registrants) {
      try {
        const { subject, html } = sessionReminderEmail({
          learnerName: r.name, sessionTitle: session.title, date: session.date, time: session.time,
        });
        const sendResult = await sendEmail({ to: r.email, subject, html });
        await db.query(
          "INSERT INTO notifications_queue (type, recipient_email, subject, body, session_id, status, sent_at) VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $6='sent' THEN NOW() ELSE NULL END)",
          ["session_reminder", r.email, subject, html, session.id, sendResult.skipped ? "skipped" : "sent"]
        );
        if (!sendResult.skipped) emailsSent++;
      } catch (e) {
        await db.query(
          "INSERT INTO notifications_queue (type, recipient_email, subject, body, session_id, status, error) VALUES ($1,$2,$3,$4,$5,'failed',$6)",
          ["session_reminder", r.email, `Reminder: ${session.title}`, "", session.id, e.message]
        );
      }
    }
    await db.query("UPDATE sessions SET reminder_sent_at = NOW() WHERE id = $1", [session.id]);
    results.push({ sessionId: session.id, title: session.title, registrants: registrants.length });
  }

  return NextResponse.json({ processedSessions: results.length, emailsSent, results });
}
