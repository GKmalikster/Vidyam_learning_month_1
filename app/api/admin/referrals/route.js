import { NextResponse } from "next/server";
import db from "@/lib/db";

// Admin: list all referrals (invited -> applied -> approved), joined with
// the category name and, once converted, the trainer's current status —
// lets the console show the full Discover -> Refer -> Convert -> Recognize
// chain for each row.
export async function GET() {
  const rows = await db.queryAll(`
    SELECT r.*, c.name as category_name, t.name as trainer_name, t.status as trainer_status
    FROM referrals r
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN trainers t ON t.id = r.trainer_id
    ORDER BY r.created_at DESC
  `);
  return NextResponse.json(rows);
}
