import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const existing = await db.queryOne("SELECT * FROM courses WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  const merged = {
    title: body.title ?? existing.title,
    description: body.description ?? existing.description,
    category_id: body.categoryId ?? existing.category_id,
    status: body.status ?? existing.status,
    image: body.image ?? existing.image,
    preview_image: body.previewImage ?? existing.preview_image,
  };
  await db.query("UPDATE courses SET title=$1, description=$2, category_id=$3, status=$4, image=$5, preview_image=$6 WHERE id=$7", [
    merged.title, merged.description, merged.category_id, merged.status, merged.image, merged.preview_image, id,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.query("UPDATE sessions SET course_id = NULL WHERE course_id = $1", [id]);
  await db.query("DELETE FROM courses WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
