// lib/auth.js
// Session tokens are HMAC-signed with Web Crypto (globalThis.crypto.subtle),
// which is available in both the Node.js runtime (API routes) and the Edge
// runtime (middleware) — so the exact same verify function protects both,
// with no native dependency and no separate session store needed.

const SESSION_COOKIE = "vidyam_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hour admin session

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Dev fallback so the app runs out of the box; ALWAYS set a real
    // SESSION_SECRET env var in production (see README.md).
    return "dev-only-insecure-secret-change-me-in-production";
  }
  return secret;
}

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
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

export async function createSessionToken(admin) {
  const payload = JSON.stringify({
    id: admin.id,
    name: admin.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = await hmac(payloadB64);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload; // { id, name, exp }
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
