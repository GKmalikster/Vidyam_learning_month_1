import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { name, color } = await request.json();
  if (!name || !color) return NextResponse.json({ error: "Name and color are required" }, { status: 400 });
  await db.query("UPDATE categories SET name = $1, color = $2 WHERE id = $3", [name, color, id]);
  return NextResponse.json({ id: Number(id), name, color });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { count } = await db.queryOne("SELECT COUNT(*)::int as count FROM sessions WHERE category_id = $1", [id]);
  if (count > 0) {
    return NextResponse.json(
      { error: "This category is still in use by one or more programs and can't be deleted." },
      { status: 409 }
    );
  }
  await db.query("DELETE FROM categories WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
