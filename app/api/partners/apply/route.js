import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public: "Partner With Us" expression of interest. Creates a pending
// partner record for the console to review — mirrors the trainer
// application's pending -> approved pattern (see /api/trainers/apply).
export async function POST(request) {
  const body = await request.json();
  const { name, contactName, email, phone, capacities, depth, offerings, offer, hopeFor, timeline } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (!Array.isArray(capacities) || capacities.length === 0) {
    return NextResponse.json({ error: "Pick at least one way you'd like to partner" }, { status: 400 });
  }

  const row = await db.queryOne(
    `INSERT INTO partners (name, contact_name, email, phone, capacities, depth, offerings, offer, hope_for, timeline, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending') RETURNING id`,
    [
      name, contactName || "", email, phone || "", JSON.stringify(capacities),
      depth || "friend", JSON.stringify(offerings || []), offer || "", hopeFor || "", timeline || "",
    ]
  );

  return NextResponse.json({ id: row.id }, { status: 201 });
}
