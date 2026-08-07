import { NextResponse } from "next/server";
import db from "@/lib/db";

// PATCH covers the full session lifecycle plus plain edits — all driven by
// which fields the console UI sends.
//   { action: "approve", slotIndices, capacity?, courseId? }
//                                       -> publishes using the selected slot(s)' date/time.
//                                          A trainer proposes 3 candidate slots; the admin can
//                                          approve more than one, which turns the single request
//                                          into that many published sessions (the request's own
//                                          row becomes the first slot, additional slots are cloned
//                                          as new session rows with the same title/category/brief/
//                                          trainer). Optional capacity/courseId apply to all of them.
//                                          `slotIndex` (singular) is still accepted for old callers.
//   { action: "hold", holdReason }     -> requires a non-empty reason
//   { action: "complete", recordingUrl } -> status -> completed, moves to "Past programs"
//   { action: "archive" }              -> status -> archived, hidden everywhere public
//   { action: "restore" }              -> status -> approved (undo archive/complete)
//   { title, categoryId, brief, ... }  -> plain field edit (also covers
//                                          courseId/courseOrder/capacity)
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const existing = await db.queryOne("SELECT * FROM sessions WHERE id = $1", [id]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "approve") {
    const slots = JSON.parse(existing.slots || "[]");
    const indices = Array.isArray(body.slotIndices) ? body.slotIndices : (body.slotIndex !== undefined ? [body.slotIndex] : []);
    const chosen = indices.map((i) => slots[i]).filter(Boolean);
    if (chosen.length === 0) return NextResponse.json({ error: "Pick a valid time slot before approving" }, { status: 400 });

    // Preserve whatever capacity/course the session already had (e.g. set by
    // the trainer when proposing it, or on an earlier partial approval)
    // unless the admin explicitly supplies a new value here.
    const capacity = body.capacity !== undefined && body.capacity !== null && body.capacity !== "" ? Number(body.capacity) : existing.capacity;
    const courseId = body.courseId !== undefined ? (body.courseId || null) : existing.course_id;

    // First chosen slot updates the original request row in place.
    await db.query(
      "UPDATE sessions SET status='approved', date=$1, time=$2, hold_reason='', capacity=$3, course_id=$4 WHERE id=$5",
      [chosen[0].date, chosen[0].time, capacity, courseId, id]
    );
    const createdIds = [Number(id)];

    // Any additional chosen slots become independent published sessions,
    // cloned from the same proposal (title/category/brief/trainer).
    for (const slot of chosen.slice(1)) {
      const row = await db.queryOne(
        `INSERT INTO sessions (title, category_id, brief, date, time, trainer_id, status, slots, capacity, course_id)
         VALUES ($1,$2,$3,$4,$5,$6,'approved','[]',$7,$8) RETURNING id`,
        [existing.title, existing.category_id, existing.brief, slot.date, slot.time, existing.trainer_id, capacity, courseId]
      );
      createdIds.push(row.id);
    }

    return NextResponse.json({ ok: true, createdIds });
  }

  if (body.action === "hold") {
    if (!body.holdReason || !body.holdReason.trim()) {
      return NextResponse.json({ error: "A reason is required to put a session on hold" }, { status: 400 });
    }
    await db.query("UPDATE sessions SET status='on_hold', hold_reason=$1 WHERE id=$2", [body.holdReason.trim(), id]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "complete") {
    await db.query("UPDATE sessions SET status='completed', recording_url=$1 WHERE id=$2", [body.recordingUrl ?? existing.recording_url, id]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "archive") {
    await db.query("UPDATE sessions SET status='archived' WHERE id=$1", [id]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "restore") {
    await db.query("UPDATE sessions SET status='approved' WHERE id=$1", [id]);
    return NextResponse.json({ ok: true });
  }

  const merged = {
    title: body.title ?? existing.title,
    category_id: body.categoryId ?? existing.category_id,
    brief: body.brief ?? existing.brief,
    date: body.date ?? existing.date,
    time: body.time ?? existing.time,
    trainer_id: body.trainerId ?? existing.trainer_id,
    course_id: body.courseId !== undefined ? body.courseId : existing.course_id,
    course_order: body.courseOrder ?? existing.course_order,
    capacity: body.capacity !== undefined ? body.capacity : existing.capacity,
  };
  await db.query(
    `UPDATE sessions SET title=$1, category_id=$2, brief=$3, date=$4, time=$5, trainer_id=$6,
     course_id=$7, course_order=$8, capacity=$9 WHERE id=$10`,
    [merged.title, merged.category_id, merged.brief, merged.date, merged.time, merged.trainer_id,
     merged.course_id, merged.course_order, merged.capacity, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.query("DELETE FROM sessions WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
