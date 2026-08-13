import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyLearnerSessionToken, LEARNER_SESSION_COOKIE_NAME } from "@/lib/learnerAuth";
import db from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LEARNER_SESSION_COOKIE_NAME)?.value;
  const session = await verifyLearnerSessionToken(token);
  if (!session) return NextResponse.json({ learner: null });

  const learner = await db.queryOne("SELECT * FROM learners WHERE id = $1", [session.learnerId]);
  if (!learner) return NextResponse.json({ learner: null });

  return NextResponse.json({
    learner: {
      ...learner,
      interests: JSON.parse(learner.interests || "[]"),
      corporateModes: JSON.parse(learner.corporate_modes || "[]"),
    },
  });
}
