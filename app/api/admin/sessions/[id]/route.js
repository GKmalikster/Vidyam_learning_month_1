import { NextResponse } from "next/server";
import db from "@/lib/db";

// PATCH covers the full session lifecycle plus plain edits — all driven by
// which fields the console UI sends.
//   { action: "approve", slotIndex }   -> publishes using that slot's date/time
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
    const slot = slots[body.slotIndex];
    if (!slot) return NextResponse.json({ error: "Pick a valid time slot before approving" }, { status: 400 });
    await db.query(
      "UPDATE sessions SET status='approved', date=$1, time=$2, hold_reason='' WHERE id=$3",
      [slot.date, slot.time, id]
    );
    return NextResponse.json({ ok: true });
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
