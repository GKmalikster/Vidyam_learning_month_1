import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = await db.queryAll(`
    SELECT r.*, s.title as session_title,
           (la.id IS NOT NULL) as has_account
    FROM registrations r
    LEFT JOIN sessions s ON s.id = r.session_id
    LEFT JOIN learner_accounts la ON la.learner_id = r.learner_id
    ORDER BY r.created_at DESC
  `);
  const registrations = rows.map((r) => ({ ...r, interests: JSON.parse(r.interests || "[]") }));
  return NextResponse.json(registrations);
}
