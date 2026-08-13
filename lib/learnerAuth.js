// lib/learnerAuth.js
// Same HMAC-signed session token scheme as lib/auth.js and
// lib/trainerAuth.js, kept as a third independent credential system with
// its own cookie so a learner session can never be mistaken for (or reused
// as) an admin or trainer session.
//
// See middleware.js for why the verification logic is ALSO duplicated
// inline there rather than imported from this file: Vercel's Edge Function
// bundler for the legacy "middleware" convention rejects cross-file
// project imports.

const LEARNER_SESSION_COOKIE = "vidyam_learner_session";
// Learners are casual, infrequent visitors compared to trainers/admins —
// a long-lived session (30 days) means "sign in once, come back for new
// programs later" actually holds true instead of forcing a re-login every
// visit.
const LEARNER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

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

export async function createLearnerSessionToken(learner) {
  const payload = JSON.stringify({
    learnerId: learner.id,
    name: learner.name,
    exp: Math.floor(Date.now() / 1000) + LEARNER_SESSION_TTL_SECONDS,
  });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyLearnerSessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = await hmac(payloadB64);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(fromBase64Url(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload; // { learnerId, name, exp }
  } catch {
    return null;
  }
}

export const LEARNER_SESSION_COOKIE_NAME = LEARNER_SESSION_COOKIE;
export const LEARNER_SESSION_MAX_AGE = LEARNER_SESSION_TTL_SECONDS;

// Convenience for Node-runtime API routes under /api/learner/* — middleware
// has already rejected unauthenticated requests before they get here, so
// this is mainly about getting the learnerId back out of the cookie.
export async function getLearnerSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(LEARNER_SESSION_COOKIE_NAME)?.value;
  return verifyLearnerSessionToken(token);
}
