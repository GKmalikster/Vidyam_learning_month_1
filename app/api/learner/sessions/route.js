import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getLearnerSession } from "@/lib/learnerAuth";

// A signed-in learner's view of every public (approved/completed) session,
// flagged with whether they're already registered/waitlisted for it — the
// dashboard splits this one list into "My programs" and "Browse new
// programs" client-side rather than needing two round trips.
export async function GET() {
  const session = await getLearnerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await db.queryAll(
    `SELECT s.id, s.title, s.brief, s.date, s.time, s.category_id, s.capacity, s.status,
            c.name as category_name, c.color as category_color,
            t.id as trainer_id, t.name as trainer_name,
            (SELECT COUNT(*)::int FROM registrations r WHERE r.session_id = s.id AND r.waitlisted = false) as registered_count,
            r.id as registration_id, r.waitlisted as my_waitlisted, r.attended as my_attended
     FROM sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     LEFT JOIN registrations r ON r.session_id = s.id AND r.learner_id = $1
     WHERE s.status IN ('approved','completed')
     ORDER BY s.date ASC`,
    [session.learnerId]
  );
  const sessions = rows.map((s) => ({
    ...s,
    registered: !!s.registration_id,
    waitlisted: !!s.my_waitlisted,
    attended: !!s.my_attended,
  }));
  return NextResponse.json(sessions);
}

// One-click join — reuses the learner's stored profile (from the learners
// table) instead of asking them to fill out the public form again. Same
// waitlist-instead-of-reject rule as the public /api/registrations route.
export async function POST(request) {
  const session = await getLearnerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const learner = await db.queryOne("SELECT * FROM learners WHERE id = $1", [session.learnerId]);
  if (!learner) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const targetSession = await db.queryOne("SELECT * FROM sessions WHERE id = $1 AND status = 'approved'", [sessionId]);
  if (!targetSession) return NextResponse.json({ error: "This program isn't open for registration." }, { status: 404 });

  const existing = await db.queryOne(
    "SELECT id FROM registrations WHERE session_id = $1 AND learner_id = $2",
    [sessionId, learner.id]
  );
  if (existing) return NextResponse.json({ error: "You're already registered for this program." }, { status: 409 });

  let waitlisted = false;
  if (targetSession.capacity) {
    const { count } = await db.queryOne(
      "SELECT COUNT(*)::int as count FROM registrations WHERE session_id = $1 AND waitlisted = false",
      [sessionId]
    );
    waitlisted = count >= targetSession.capacity;
  }

  const row = await db.queryOne(
    `INSERT INTO registrations
      (session_id, learner_id, name, email, phone, city, age_group, role, education, industry, experience,
       interests, linkedin, format, language, time_pref, is_returning, goal, source, consent, waitlisted,
       profile_type, org_name, org_role, org_detail, corporate_modes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,1,$20,$21,$22,$23,$24,$25)
     RETURNING id`,
    [
      sessionId, learner.id, learner.name, learner.email, learner.phone, learner.city, learner.age_group,
      learner.role, learner.education, learner.industry, learner.experience, learner.interests, learner.linkedin,
      learner.format, learner.language, learner.time_pref, learner.is_returning, learner.goal, learner.source,
      waitlisted, learner.profile_type, learner.org_name, learner.org_role, learner.org_detail, learner.corporate_modes,
    ]
  );

  return NextResponse.json({ registrationId: row.id, waitlisted }, { status: 201 });
}
