import { NextResponse } from "next/server";
import db from "@/lib/db";

// Admin: approve/decline a partner application, or attach a review note.
// Kept intentionally simple (status + notes only) — unlike trainers, an
// approved partner doesn't provision any account; follow-up happens
// off-platform (email/call), per the Onboarding & Partnership Playbook.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await db.queryOne("SELECT * FROM partners WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = {
    status: body.status ?? existing.status,
    notes: body.notes ?? existing.notes,
  };
  await db.query("UPDATE partners SET status = $1, notes = $2 WHERE id = $3", [merged.status, merged.notes, id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.query("DELETE FROM partners WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
