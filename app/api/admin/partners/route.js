import { NextResponse } from "next/server";
import db from "@/lib/db";

// Admin: list all partner applications (pending review + already reviewed),
// newest first. Console splits into pending/active panels client-side, same
// pattern as the trainers tab.
export async function GET() {
  const rows = await db.queryAll("SELECT * FROM partners ORDER BY created_at DESC");
  const partners = rows.map((p) => ({ ...p, capacities: JSON.parse(p.capacities || "[]") }));
  return NextResponse.json(partners);
}
