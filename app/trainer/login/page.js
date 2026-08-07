"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Not linked from the public site's nav — trainers land here from the
// approval email (or by bookmarking it once they know it exists), same
// "unlinked but reachable" pattern as /console/login.
export default function TrainerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/trainer-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Login failed");
      }
      router.push("/trainer/dashboard");
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
        <h2 style={{ textAlign: "center" }}>Trainer Dashboard</h2>
        <p className="hint" style={{ textAlign: "center", display: "block", marginBottom: 20 }}>For approved trainers &amp; mentors</p>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 16 }}>{error}</div>}
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="pill pill-primary" style={{ width: "100%" }} disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--navy-soft)", marginTop: 18, marginBottom: 0 }}>
          Not a trainer yet? <Link href="/teach" style={{ color: "var(--blue)", fontWeight: 600 }}>Apply to become one</Link> — accounts are created automatically once approved.
        </p>
      </form>
    </div>
  );
}
