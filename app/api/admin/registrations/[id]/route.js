import { NextResponse } from "next/server";
import db from "@/lib/db";

// Toggling attendance or waitlist status for a single registrant — used by
// the console's per-session registrant manager.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { attended, waitlisted } = await request.json();
  const existing = await db.queryOne("SELECT * FROM registrations WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = {
    attended: attended ?? existing.attended,
    waitlisted: waitlisted ?? existing.waitlisted,
  };
  await db.query("UPDATE registrations SET attended = $1, waitlisted = $2 WHERE id = $3", [
    merged.attended, merged.waitlisted, id,
  ]);
  return NextResponse.json({ ok: true });
}
