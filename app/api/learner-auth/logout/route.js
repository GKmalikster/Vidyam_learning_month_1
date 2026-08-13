import { NextResponse } from "next/server";
import { LEARNER_SESSION_COOKIE_NAME } from "@/lib/learnerAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LEARNER_SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
