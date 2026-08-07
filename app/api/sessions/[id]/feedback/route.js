import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: anyone can leave feedback on a session they attended (there's no
// learner login to check "did you actually register" against, so this is
// an honour-system field like the rest of the free, open community site).
export async function GET(request, { params }) {
  const { id } = await params;
  const rows = await db.queryAll(
    "SELECT id, name, rating, comment, created_at FROM session_feedback WHERE session_id = $1 ORDER BY created_at DESC",
    [id]
  );
  const avg = rows.length ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length : null;
  return NextResponse.json({ feedback: rows, average: avg, count: rows.length });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { name, email, rating, comment } = await request.json();
  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "A rating from 1 to 5 is required." }, { status: 400 });
  }
  await db.query(
    "INSERT INTO session_feedback (session_id, name, email, rating, comment) VALUES ($1,$2,$3,$4,$5)",
    [id, name || "Anonymous learner", email || null, ratingNum, comment || ""]
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
