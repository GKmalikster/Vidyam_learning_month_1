import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(request) {
  const { id, password } = await request.json();
  if (!id || !password) {
    return NextResponse.json({ error: "ID and password are required" }, { status: 400 });
  }

  const admin = await db.queryOne("SELECT * FROM admins WHERE id = $1", [id.trim()]);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return NextResponse.json({ error: "Invalid ID or password" }, { status: 401 });
  }

  const token = await createSessionToken(admin);
  const res = NextResponse.json({ id: admin.id, name: admin.name });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
