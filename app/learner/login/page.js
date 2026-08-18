"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Not linked from the main nav (mirrors /trainer/login) — reachable via the
// footer's "Learner sign in" link or the note on the Join form once a
// learner has set a password.
export default function LearnerLogin() {
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
      const res = await fetch("/api/learner-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Login failed");
      }
      router.push("/learner/dashboard");
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
        <h2 style={{ textAlign: "center" }}>Learner Dashboard</h2>
        <p className="hint" style={{ textAlign: "center", display: "block", marginBottom: 20 }}>See your programs and join new ones in one click</p>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 16 }}>{error}</div>}
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="pill pill-primary" style={{ width: "100%" }} disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
        <p style={{ textAlign: "center", fontSize: 13, marginTop: 14, marginBottom: 0 }}>
          <Link href="/learner/forgot-password" style={{ color: "var(--blue)", fontWeight: 600 }}>Forgot your password?</Link>
        </p>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--navy-soft)", marginTop: 10, marginBottom: 0 }}>
          Don&apos;t have an account? <Link href="/join" style={{ color: "var(--blue)", fontWeight: 600 }}>Join a program</Link> and set a password there to create one.
        </p>
      </form>
    </div>
  );
}
