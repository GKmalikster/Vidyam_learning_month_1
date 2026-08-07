import { NextResponse } from "next/server";
import { TRAINER_SESSION_COOKIE_NAME } from "@/lib/trainerAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TRAINER_SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
