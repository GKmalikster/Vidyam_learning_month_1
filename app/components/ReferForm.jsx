"use client";

import { useState } from "react";
import Link from "next/link";

function blankReferral(defaultCategoryId) {
  return { name: "", email: "", phone: "", categoryId: defaultCategoryId || "", howKnown: "", whyGreat: "" };
}

export default function ReferForm({ categories }) {
  const [referrer, setReferrer] = useState({ name: "", email: "", relationship: "", consent: false });
  const [referrals, setReferrals] = useState([blankReferral(categories[0]?.id)]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateReferrer(field, value) {
    setReferrer((r) => ({ ...r, [field]: value }));
  }
  function updateReferral(idx, field, value) {
    setReferrals((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addReferral() {
    setReferrals((rs) => [...rs, blankReferral(categories[0]?.id)]);
  }
  function removeReferral(idx) {
    setReferrals((rs) => rs.filter((_, i) => i !== idx));
  }

  async function submit() {
    setError("");
    if (!referrer.name.trim() || !referrer.email.trim()) {
      setError("Please provide your name and email.");
      return;
    }
    if (!referrer.consent) {
      setError("Please confirm you have permission to share their contact details.");
      return;
    }
    const complete = referrals.filter((r) => r.name.trim() && (r.email.trim() || r.phone.trim()));
    if (complete.length === 0) {
      setError("Please add at least one person to refer, including their name and either an email address or phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerName: referrer.name, referrerEmail: referrer.email, referrerRelationship: referrer.relationship,
          consent: referrer.consent, referrals: complete,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="form-card" style={{ margin: "0 auto 56px", textAlign: "center" }}>
        <h2>Thank you for your referral</h2>
        <p style={{ color: "var(--navy-soft)" }}>
          We have sent a personal invitation to the individuals you referred. Should they apply, you will receive
          credit, along with our thanks.
        </p>
      </div>
    );
  }

  return (
    <div className="form-card" style={{ margin: "0 auto 56px", maxWidth: 760 }}>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 18 }}>{error}</div>}

      <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field"><label>Your name *</label><input type="text" value={referrer.name} onChange={(e) => updateReferrer("name", e.target.value)} /></div>
        <div className="field"><label>Your email *</label><input type="email" value={referrer.email} onChange={(e) => updateReferrer("email", e.target.value)} /></div>
      </div>
      <div className="field">
        <label>Your relationship to Vidyam <span className="hint">(optional)</span></label>
        <select value={referrer.relationship} onChange={(e) => updateReferrer("relationship", e.target.value)}>
          <option value="">Select</option>
          <option>Learner</option><option>Trainer</option><option>Partner coordinator</option><option>Other</option>
        </select>
      </div>

      <div style={{ borderTop: "1px solid var(--line)", margin: "20px 0 14px" }} />
      <h3 style={{ marginBottom: 4 }}>Who would you like to invite?</h3>
      <p className="hint" style={{ marginBottom: 16 }}>You may refer as many people as you like; each will receive their own personal invitation.</p>

      {referrals.map((r, idx) => (
        <div key={idx} className="proposal-card" style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <b>Person {idx + 1}</b>
            {referrals.length > 1 && <button type="button" className="pill pill-ghost" style={{ padding: "4px 12px", minHeight: "auto" }} onClick={() => removeReferral(idx)}>Remove</button>}
          </div>
          <div className="field"><label>Their name *</label><input type="text" value={r.name} onChange={(e) => updateReferral(idx, "name", e.target.value)} /></div>
          <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field"><label>Their email</label><input type="email" value={r.email} onChange={(e) => updateReferral(idx, "email", e.target.value)} /></div>
            <div className="field"><label>Their phone</label><input type="tel" value={r.phone} onChange={(e) => updateReferral(idx, "phone", e.target.value)} /></div>
          </div>
          <p className="hint" style={{ display: "block", marginBottom: 10 }}>Please provide at least an email address or phone number.</p>
          <div className="field">
            <label>Area of expertise</label>
            <select value={r.categoryId} onChange={(e) => updateReferral(idx, "categoryId", Number(e.target.value))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>How do you know them? <span className="hint">(optional)</span></label><input type="text" value={r.howKnown} onChange={(e) => updateReferral(idx, "howKnown", e.target.value)} /></div>
          <div className="field"><label>Why would they be great? <span className="hint">(optional — we'll share this with them)</span></label><textarea value={r.whyGreat} onChange={(e) => updateReferral(idx, "whyGreat", e.target.value)} /></div>
        </div>
      ))}
      <button type="button" className="pill pill-ghost" onClick={addReferral} style={{ marginBottom: 24 }}>+ Refer another person</button>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={referrer.consent} onChange={(e) => updateReferrer("consent", e.target.checked)} style={{ width: "auto" }} />
          I confirm that I have each person&apos;s permission to share their contact details with Vidyam for this invitation, and that I have read the{" "}
          <Link href="/terms" target="_blank">Terms</Link> &amp; <Link href="/privacy" target="_blank">Privacy Policy</Link>.
        </label>
      </div>

      <div className="wizard-nav">
        <span />
        <button className="pill pill-primary" disabled={submitting} onClick={submit}>{submitting ? "Sending…" : "Send invitation(s)"}</button>
      </div>
    </div>
  );
}
