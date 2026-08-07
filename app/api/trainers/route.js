import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: approved trainers only.
export async function GET() {
  const rows = await db.queryAll(
    "SELECT id, name, bio, topics, mode, years, linkedin, photo, expertise FROM trainers WHERE status = 'approved' ORDER BY name"
  );
  const trainers = rows.map((t) => ({ ...t, expertise: JSON.parse(t.expertise || "[]") }));
  return NextResponse.json(trainers);
}
