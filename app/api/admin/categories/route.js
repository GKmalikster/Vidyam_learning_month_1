import { NextResponse } from "next/server";
import db from "@/lib/db";

// Protected by middleware.js (matches /api/admin/:path*).
export async function GET() {
  const categories = await db.queryAll(`
    SELECT c.*, (SELECT COUNT(*)::int FROM sessions s WHERE s.category_id = c.id) as usage
    FROM categories c ORDER BY c.name
  `);
  return NextResponse.json(categories);
}

export async function POST(request) {
  const { name, color } = await request.json();
  if (!name || !color) return NextResponse.json({ error: "Name and color are required" }, { status: 400 });
  const row = await db.queryOne("INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING id", [name, color]);
  return NextResponse.json({ id: row.id, name, color }, { status: 201 });
}
