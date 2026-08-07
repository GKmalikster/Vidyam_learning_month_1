// lib/auth.js
// Session tokens are HMAC-signed with Web Crypto (globalThis.crypto.subtle),
// which is available in both the Node.js runtime (API routes) and the Edge
// runtime (middleware) — so the exact same verify function protects both,
// with no native dependency and no separate session store needed.
//
// Deliberately avoids Node's `Buffer` here (unlike a Node-only file) since
// middleware.js runs on Vercel's Edge Runtime, which doesn't support it —
// btoa/atob + TextEncoder/TextDecoder are plain Web APIs available in both.

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
    const payload = JSON.parse(fromBase64Url(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload; // { id, name, exp }
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
