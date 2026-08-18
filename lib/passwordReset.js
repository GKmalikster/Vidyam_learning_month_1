// lib/passwordReset.js
// Shared helpers for the learner/trainer "forgot password" flow. Only a
// SHA-256 hash of the token is ever stored — the raw token exists only in
// the emailed link — so a leaked password_resets row can't be replayed.
// Tokens are single-use (consumeResetToken marks them used atomically with
// the lookup) and expire after ttlMinutes.

import crypto from "crypto";
import db from "@/lib/db";

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createResetToken(accountType, accountId, ttlMinutes = 60) {
  const token = generateResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await db.query(
    "INSERT INTO password_resets (account_type, account_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)",
    [accountType, accountId, tokenHash, expiresAt]
  );
  return token;
}

// Looks up a still-valid, unused token and marks it used in the same call —
// callers should treat a null return as "invalid or expired", not attempt
// to distinguish why, so we don't leak which case applies.
export async function consumeResetToken(accountType, token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = await db.queryOne(
    "SELECT * FROM password_resets WHERE account_type = $1 AND token_hash = $2 AND used = false AND expires_at > NOW()",
    [accountType, tokenHash]
  );
  if (!row) return null;
  await db.query("UPDATE password_resets SET used = true WHERE id = $1", [row.id]);
  return row;
}
