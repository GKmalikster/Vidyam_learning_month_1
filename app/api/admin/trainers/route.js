import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = await db.queryAll("SELECT * FROM trainers ORDER BY created_at DESC");
  const trainers = rows.map((t) => ({
    ...t,
    availability: JSON.parse(t.availability || "[]"),
    expertise: JSON.parse(t.expertise || "[]"),
  }));
  return NextResponse.json(trainers);
}

// Admin adding a trainer directly — pre-approved, unlike the public apply flow.
export async function POST(request) {
  const body = await request.json();
  const { name, email, years, bio, topics, mode, linkedin, availability, expertise, photo } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const row = await db.queryOne(
    `INSERT INTO trainers (name, email, years, bio, topics, mode, linkedin, availability, expertise, photo, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved') RETURNING id`,
    [
      name, email || "", years || "", bio || "", topics || "", mode || "",
      linkedin || "", JSON.stringify(availability || []), JSON.stringify(expertise || []), photo || null,
    ]
  );
  return NextResponse.json({ id: row.id }, { status: 201 });
}
