import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

// This middleware is the real access boundary for the Content Manager.
// It runs server-side on every request to /console/* and /api/admin/*
// BEFORE any page or API code executes, so an unauthenticated visitor
// cannot reach admin markup or data even by guessing the URL — unlike the
// old single-file prototype where the admin panel's HTML/JS shipped to
// every visitor and was just hidden by client-side JS.
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/console/login";
  const isAdminApi = pathname.startsWith("/api/admin");
  const isConsole = pathname.startsWith("/console");

  if (!isConsole && !isAdminApi) return NextResponse.next();
  if (isLoginPage) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/console/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*", "/api/admin/:path*"],
};
