import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getLearnerSession } from "@/lib/learnerAuth";

// Lets a signed-in learner keep their own profile current — used both to
// display "My profile" on the dashboard and to update the details that get
// reused every time they one-click join a new program.
export async function GET() {
  const session = await getLearnerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const learner = await db.queryOne("SELECT * FROM learners WHERE id = $1", [session.learnerId]);
  if (!learner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...learner,
    interests: JSON.parse(learner.interests || "[]"),
    corporateModes: JSON.parse(learner.corporate_modes || "[]"),
  });
}

export async function PUT(request) {
  const session = await getLearnerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const p = await request.json();
  await db.query(
    `UPDATE learners SET
      phone=$1, city=$2, age_group=$3, role=$4, education=$5, industry=$6, experience=$7, interests=$8,
      linkedin=$9, format=$10, language=$11, time_pref=$12, goal=$13
     WHERE id = $14`,
    [
      p.phone || "", p.city || "", p.ageGroup || "", p.role || "", p.education || "", p.industry || "",
      p.experience || "", JSON.stringify(p.interests || []), p.linkedin || "", p.format || "", p.language || "",
      p.timePref || "", p.goal || "", session.learnerId,
    ]
  );
  return NextResponse.json({ ok: true });
}
