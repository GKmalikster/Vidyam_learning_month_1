// lib/trainerAuth.js
// Same HMAC-signed session token scheme as lib/auth.js, kept as a separate
// file/cookie so a trainer login can never be mistaken for (or reused as)
// an admin session — they're two independent credential systems that just
// happen to share the same signing algorithm.
//
// See middleware.js for why the verification logic is ALSO duplicated
// inline there rather than imported from this file: Vercel's Edge Function
// bundler for the legacy "middleware" convention rejects cross-file
// project imports.

const TRAINER_SESSION_COOKIE = "vidyam_trainer_session";
const TRAINER_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hour trainer session

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

export async function createTrainerSessionToken(trainer) {
  const payload = JSON.stringify({
    trainerId: trainer.id,
    name: trainer.name,
    exp: Math.floor(Date.now() / 1000) + TRAINER_SESSION_TTL_SECONDS,
  });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyTrainerSessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = await hmac(payloadB64);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(fromBase64Url(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload; // { trainerId, name, exp }
  } catch {
    return null;
  }
}

export const TRAINER_SESSION_COOKIE_NAME = TRAINER_SESSION_COOKIE;
export const TRAINER_SESSION_MAX_AGE = TRAINER_SESSION_TTL_SECONDS;

// Convenience for Node-runtime API routes under /api/trainer/* — middleware
// has already rejected unauthenticated requests before they get here, so
// this is mainly about getting the trainerId back out of the cookie.
export async function getTrainerSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(TRAINER_SESSION_COOKIE_NAME)?.value;
  return verifyTrainerSessionToken(token);
}
