import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public, read-only. Category CRUD lives under /api/admin/categories.
export async function GET() {
  const categories = await db.queryAll("SELECT * FROM categories ORDER BY name");
  return NextResponse.json(categories);
}
