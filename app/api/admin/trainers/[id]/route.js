import { NextResponse } from "next/server";
import db from "@/lib/db";

// PATCH handles both edits and status changes (approve / reject) — the
// console UI sends whichever fields changed.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await db.queryOne("SELECT * FROM trainers WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = {
    name: body.name ?? existing.name,
    email: body.email ?? existing.email,
    years: body.years ?? existing.years,
    bio: body.bio ?? existing.bio,
    topics: body.topics ?? existing.topics,
    mode: body.mode ?? existing.mode,
    linkedin: body.linkedin ?? existing.linkedin,
    availability: body.availability ? JSON.stringify(body.availability) : existing.availability,
    expertise: body.expertise ? JSON.stringify(body.expertise) : existing.expertise,
    photo: body.photo ?? existing.photo,
    status: body.status ?? existing.status,
  };

  await db.query(
    `UPDATE trainers SET name=$1, email=$2, years=$3, bio=$4, topics=$5,
     mode=$6, linkedin=$7, availability=$8, expertise=$9, photo=$10, status=$11
     WHERE id = $12`,
    [
      merged.name, merged.email, merged.years, merged.bio, merged.topics,
      merged.mode, merged.linkedin, merged.availability, merged.expertise,
      merged.photo, merged.status, id,
    ]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  // Unassign (not cascade-delete) any sessions pointing at this trainer,
  // matching the prior prototype's behaviour.
  await db.query("UPDATE sessions SET trainer_id = NULL WHERE trainer_id = $1", [id]);
  await db.query("DELETE FROM trainers WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
