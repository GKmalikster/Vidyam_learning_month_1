import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

async function assertOwnership(sessionId, trainerId) {
  return db.queryOne("SELECT id FROM sessions WHERE id = $1 AND trainer_id = $2", [sessionId, trainerId]);
}

export async function GET(request, { params }) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  if (!(await assertOwnership(id, session.trainerId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db.queryAll("SELECT * FROM session_materials WHERE session_id = $1 ORDER BY created_at ASC", [id]);
  return NextResponse.json(rows);
}

export async function POST(request, { params }) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  if (!(await assertOwnership(id, session.trainerId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, url } = await request.json();
  if (!title || !url) return NextResponse.json({ error: "Title and link are required." }, { status: 400 });

  const row = await db.queryOne(
    "INSERT INTO session_materials (session_id, title, url) VALUES ($1,$2,$3) RETURNING id",
    [id, title, url]
  );
  return NextResponse.json({ id: row.id }, { status: 201 });
}

export async function DELETE(request, { params }) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  if (!(await assertOwnership(id, session.trainerId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get("materialId");
  await db.query("DELETE FROM session_materials WHERE id = $1 AND session_id = $2", [materialId, id]);
  return NextResponse.json({ ok: true });
}
