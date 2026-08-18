"use client";

import { useState } from "react";
import Link from "next/link";

export default function LearnerForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setSubmitting(true);
    setError("");
    try {
      await fetch("/api/learner-auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show the same confirmation, whether or not an account exists.
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel)" }}>
      <div className="form-card" style={{ maxWidth: 380, width: "100%" }}>
        <img src="/logo.png" alt="Vidyam" style={{ height: 56, display: "block", margin: "0 auto 18px" }} />
        <h2 style={{ textAlign: "center" }}>Reset your password</h2>
        {sent ? (
          <>
            <p style={{ color: "var(--navy-soft)", textAlign: "center" }}>
              If an account exists for that email, we have sent a link to reset your password. It expires in an hour.
            </p>
            <p style={{ textAlign: "center", fontSize: 13, marginTop: 18 }}>
              <Link href="/learner/login" style={{ color: "var(--blue)", fontWeight: 600 }}>Back to sign in</Link>
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="hint" style={{ textAlign: "center", display: "block", marginBottom: 20 }}>Enter the email you registered with, and we will send you a reset link.</p>
            {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 16 }}>{error}</div>}
            <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
            <button className="pill pill-primary" style={{ width: "100%" }} disabled={submitting}>{submitting ? "Sending…" : "Send reset link"}</button>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--navy-soft)", marginTop: 18, marginBottom: 0 }}>
              <Link href="/learner/login" style={{ color: "var(--blue)", fontWeight: 600 }}>Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
