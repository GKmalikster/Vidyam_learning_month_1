import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: learner registration submission. One row is written per selected
// program, all sharing the same profile — mirrors the multi-program wizard.
export async function POST(request) {
  const body = await request.json();
  const { sessionIds, ...profile } = body;

  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return NextResponse.json({ error: "Select at least one program" }, { status: 400 });
  }
  if (!profile.name || !profile.email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const ids = [];
  for (const sessionId of sessionIds) {
    const row = await db.queryOne(
      `INSERT INTO registrations
        (session_id, name, email, phone, city, age_group, role, education, industry, experience,
         interests, linkedin, format, language, time_pref, is_returning, goal, source, consent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        sessionId,
        profile.name,
        profile.email,
        profile.phone || "",
        profile.city || "",
        profile.ageGroup || "",
        profile.role || "",
        profile.education || "",
        profile.industry || "",
        profile.experience || "",
        JSON.stringify(profile.interests || []),
        profile.linkedin || "",
        profile.format || "",
        profile.language || "",
        profile.timePref || "",
        profile.returning || "",
        profile.goal || "",
        profile.source || "",
        profile.consent ? 1 : 0,
      ]
    );
    ids.push(row.id);
  }

  return NextResponse.json({ registrationIds: ids }, { status: 201 });
}
