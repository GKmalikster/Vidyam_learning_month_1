import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getTrainerSession } from "@/lib/trainerAuth";

async function assertOwnership(courseId, trainerId) {
  return db.queryOne(
    "SELECT 1 FROM sessions WHERE course_id = $1 AND trainer_id = $2 LIMIT 1",
    [courseId, trainerId]
  );
}

// Deliberately narrow: a trainer may only ever update a course's images
// here, never its title, description, category, or publish status — those
// stay admin-only (set in app/console/page.js's CoursesTab). This route
// exists so a trainer who's part of a course can keep its cover/preview
// images current without having to ask an admin every time.
export async function PATCH(request, { params }) {
  const session = await getTrainerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  if (!(await assertOwnership(id, session.trainerId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.queryOne("SELECT * FROM courses WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const image = body.image ?? existing.image;
  const previewImage = body.previewImage ?? existing.preview_image;

  await db.query("UPDATE courses SET image = $1, preview_image = $2 WHERE id = $3", [image, previewImage, id]);
  return NextResponse.json({ ok: true });
}
