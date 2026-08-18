"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!token) { setError("This reset link is missing its token — please request a new one."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/learner-auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
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
    <div className="form-card" style={{ maxWidth: 380, width: "100%" }}>
      <img src="/logo.png" alt="Vidyam" style={{ height: 56, display: "block", margin: "0 auto 18px" }} />
      <h2 style={{ textAlign: "center" }}>Choose a new password</h2>
      {!token && (
        <p style={{ color: "#c0392b", textAlign: "center", fontSize: 13.5 }}>
          This link is missing its reset token. Please request a new link from the <Link href="/learner/forgot-password" style={{ color: "var(--blue)", fontWeight: 600 }}>forgot password</Link> page.
        </p>
      )}
      <form onSubmit={submit}>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 16 }}>{error}</div>}
        <div className="field"><label>New password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></div>
        <div className="field"><label>Confirm password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
        <button className="pill pill-primary" style={{ width: "100%" }} disabled={submitting || !token}>{submitting ? "Saving…" : "Save new password"}</button>
      </form>
    </div>
  );
}

export default function LearnerResetPassword() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--panel)" }}>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
