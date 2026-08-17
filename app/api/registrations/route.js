import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createLearnerSessionToken, LEARNER_SESSION_COOKIE_NAME, LEARNER_SESSION_MAX_AGE } from "@/lib/learnerAuth";

// Public: learner registration submission. One row is written per selected
// program, all sharing the same profile — mirrors the multi-program wizard.
// If a session has a capacity set and is already full, the registration is
// still recorded but flagged waitlisted=true rather than rejected, so the
// learner still has a place in line and the console can promote them later.
//
// As of the learner-accounts feature, this route also upserts a canonical
// `learners` row by email (so the same person registering again — even
// without a password — keeps one profile instead of scattering duplicates),
// and optionally provisions a learner_accounts login if a password was
// supplied and the learner doesn't already have one. This is what lets a
// returning learner sign in at /learner/login and one-click join programs
// added after their first visit, instead of needing to know to come back
// to this form and resubmit it.
export async function POST(request) {
  const body = await request.json();
  const { sessionIds, password, confirmPassword, ...profile } = body;

  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return NextResponse.json({ error: "Select at least one program" }, { status: 400 });
  }
  if (!profile.name || !profile.email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (password && password.length > 0) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords don't match" }, { status: 400 });
    }
  }

  const learnerFields = [
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
    profile.profileType || "individual",
    profile.orgName || "",
    profile.orgRole || "",
    profile.orgDetail || "",
    JSON.stringify(profile.corporateModes || []),
  ];

  let learner = await db.queryOne("SELECT * FROM learners WHERE lower(email) = lower($1)", [profile.email]);
  if (learner) {
    await db.query(
      `UPDATE learners SET
        name=$1, email=$2, phone=$3, city=$4, age_group=$5, role=$6, education=$7, industry=$8, experience=$9,
        interests=$10, linkedin=$11, format=$12, language=$13, time_pref=$14, is_returning=$15, goal=$16,
        source=$17, profile_type=$18, org_name=$19, org_role=$20, org_detail=$21, corporate_modes=$22
       WHERE id = $23`,
      [...learnerFields, learner.id]
    );
  } else {
    const row = await db.queryOne(
      `INSERT INTO learners
        (name, email, phone, city, age_group, role, education, industry, experience,
         interests, linkedin, format, language, time_pref, is_returning, goal, source,
         profile_type, org_name, org_role, org_detail, corporate_modes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      learnerFields
    );
    learner = row;
  }
  const learnerId = learner.id;

  // shouldSignIn tracks whether we can safely issue a learner session
  // cookie on this response. That's only safe in two cases: (a) an account
  // was just created in this very request, using a password the submitter
  // just chose themselves, or (b) an account already existed and the
  // submitted password matches its hash — i.e. this doubles as a login.
  // A bare email with no correct password must never sign anyone in, or
  // submitting someone else's email address would silently log in as them.
  let accountCreated = false;
  let shouldSignIn = false;
  if (password && password.length >= 8) {
    const existingAccount = await db.queryOne("SELECT id, password_hash FROM learner_accounts WHERE learner_id = $1", [learnerId]);
    if (!existingAccount) {
      const hash = bcrypt.hashSync(password, 10);
      await db.query("INSERT INTO learner_accounts (learner_id, password_hash) VALUES ($1, $2)", [learnerId, hash]);
      accountCreated = true;
      shouldSignIn = true;
    } else if (bcrypt.compareSync(password, existingAccount.password_hash)) {
      shouldSignIn = true;
    }
    // If an account already exists and the password doesn't match, it's
    // intentionally ignored rather than rejecting the whole registration —
    // keeps re-registering low-friction even if they mistype a password
    // they no longer remember exactly.
  }

  const ids = [];
  const waitlistedFor = [];
  const alreadyRegisteredFor = [];
  for (const sessionId of sessionIds) {
    const existingReg = await db.queryOne(
      "SELECT id FROM registrations WHERE session_id = $1 AND learner_id = $2",
      [sessionId, learnerId]
    );
    if (existingReg) {
      alreadyRegisteredFor.push(Number(sessionId));
      continue;
    }

    const sessionRow = await db.queryOne("SELECT capacity FROM sessions WHERE id = $1", [sessionId]);
    let waitlisted = false;
    if (sessionRow?.capacity) {
      const { count } = await db.queryOne(
        "SELECT COUNT(*)::int as count FROM registrations WHERE session_id = $1 AND waitlisted = false",
        [sessionId]
      );
      waitlisted = count >= sessionRow.capacity;
    }

    const row = await db.queryOne(
      `INSERT INTO registrations
        (session_id, learner_id, name, email, phone, city, age_group, role, education, industry, experience,
         interests, linkedin, format, language, time_pref, is_returning, goal, source, consent, waitlisted,
         profile_type, org_name, org_role, org_detail, corporate_modes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       RETURNING id`,
      [
        sessionId,
        learnerId,
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
        waitlisted,
        profile.profileType || "individual",
        profile.orgName || "",
        profile.orgRole || "",
        profile.orgDetail || "",
        JSON.stringify(profile.corporateModes || []),
      ]
    );
    ids.push(row.id);
    if (waitlisted) waitlistedFor.push(Number(sessionId));
  }

  const res = NextResponse.json(
    { registrationIds: ids, waitlistedFor, alreadyRegisteredFor, learnerId, accountCreated, signedIn: shouldSignIn },
    { status: 201 }
  );

  if (shouldSignIn) {
    const sessionToken = await createLearnerSessionToken(learner);
    res.cookies.set(LEARNER_SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: LEARNER_SESSION_MAX_AGE,
    });
  }

  return res;
}
