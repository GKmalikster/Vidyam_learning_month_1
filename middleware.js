import { NextResponse } from "next/server";

// This middleware is the real access boundary for the Content Manager.
// It runs server-side on every request to /console/* and /api/admin/*
// BEFORE any page or API code executes, so an unauthenticated visitor
// cannot reach admin markup or data even by guessing the URL — unlike the
// old single-file prototype where the admin panel's HTML/JS shipped to
// every visitor and was just hidden by client-side JS.
//
// The session-token verification logic is intentionally duplicated here
// (rather than imported from lib/auth.js) because Vercel's Edge Function
// bundler for the legacy "middleware" file convention rejects ANY
// cross-file project import — "referencing unsupported modules" — even
// when that file only uses edge-safe Web APIs. Keeping this file
// self-contained (only importing "next/server") sidesteps that entirely.
// lib/auth.js still holds the canonical version used by the Node-runtime
// API routes (login/logout/me) — if the signing logic ever changes, both
// copies need updating together.

const SESSION_COOKIE_NAME = "vidyam_admin_session";

function getSecret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-in-production";
}

function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(sig));
}

async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = await hmac(payloadB64);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(fromBase64Url(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

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
