"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// This page is intentionally not linked from anywhere on the public site.
// It's the only door into the Content Manager: no admin markup or data
// ships to a visitor who doesn't come here and authenticate first.
export default function ConsoleLogin() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Login failed");
      }
      router.push("/console");
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel)" }}>
      <form onSubmit={submit} className="form-card" style={{ maxWidth: 380, width: "100%" }}>
        <img src="/logo.png" alt="Vidyam" style={{ height: 56, display: "block", margin: "0 auto 18px" }} />
        <h2 style={{ textAlign: "center" }}>Content Manager</h2>
        <p className="hint" style={{ textAlign: "center", display: "block", marginBottom: 20 }}>Admin access only</p>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 16 }}>{error}</div>}
        <div className="field"><label>Admin ID</label><input type="text" value={id} onChange={(e) => setId(e.target.value)} autoFocus /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="pill pill-primary" style={{ width: "100%" }} disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
