import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public, read-only — materials are visible for any session a learner can
// already see (approved or completed), no separate learner login required.
export async function GET(request, { params }) {
  const { id } = await params;
  const session = await db.queryOne("SELECT id FROM sessions WHERE id = $1 AND status IN ('approved','completed')", [id]);
  if (!session) return NextResponse.json([], { status: 200 });
  const rows = await db.queryAll("SELECT id, title, url FROM session_materials WHERE session_id = $1 ORDER BY created_at ASC", [id]);
  return NextResponse.json(rows);
}
