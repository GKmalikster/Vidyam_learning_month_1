"use client";

import { useState } from "react";
import Link from "next/link";

const CAPACITIES = [
  "Trainer & Mentor Partner",
  "Institutional Partner",
  "Corporate Partner",
  "Community & Nonprofit Partner",
  "Incubator & Ecosystem Partner",
  "Media & Content Partner",
  "Technology & Platform Partner",
  "Government & Public-Sector Partner",
  "Individual Champion / Ambassador",
];

export default function PartnerForm() {
  const [form, setForm] = useState({
    name: "", contactName: "", email: "", phone: "", depth: "friend", offer: "", hopeFor: "", timeline: "", consent: false,
  });
  const [capacities, setCapacities] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function toggleCapacity(c) {
    setCapacities((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function submit() {
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (capacities.length === 0) {
      setError("Pick at least one way you'd like to partner.");
      return;
    }
    if (!form.consent) {
      setError("Please confirm you've read the Terms & Privacy Policy.");
      return;
    }
    setSubmitting(true);
    try {
      const { consent, ...formToSend } = form;
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formToSend, capacities }),
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
        <h2>Thanks for reaching out! 🤝</h2>
        <p style={{ color: "var(--navy-soft)" }}>
          Your interest in partnering with Vidyam is with our team. We aim to respond within 5 business days to talk
          through what a partnership could look like.
        </p>
      </div>
    );
  }

  return (
    <div className="form-card" style={{ margin: "0 auto 56px", maxWidth: 760 }}>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 18 }}>{error}</div>}

      <div className="field"><label>Your name or organization&apos;s name *</label><input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
      <div className="field"><label>Contact person <span className="hint">(if different)</span></label><input type="text" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></div>
      <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field"><label>Email *</label><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
        <div className="field"><label>Phone <span className="hint">(optional)</span></label><input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
      </div>

      <div className="field">
        <label>How would you like to partner? <span className="hint">(select any)</span></label>
        <div className="chip-row">
          {CAPACITIES.map((c) => (
            <div key={c} className={`chip ${capacities.includes(c) ? "selected" : ""}`} onClick={() => toggleCapacity(c)}>
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <label>What depth of partnership are you thinking?</label>
        <select value={form.depth} onChange={(e) => update("depth", e.target.value)}>
          <option value="friend">Friend of Vidyam — a lightweight, one-time contribution</option>
          <option value="structured">Structured Partner — a recurring commitment</option>
        </select>
      </div>

      <div className="field"><label>What can you offer?</label><textarea value={form.offer} onChange={(e) => update("offer", e.target.value)} /></div>
      <div className="field"><label>What are you hoping to get out of partnering with Vidyam?</label><textarea value={form.hopeFor} onChange={(e) => update("hopeFor", e.target.value)} /></div>
      <div className="field"><label>Timeline <span className="hint">(optional)</span></label><input type="text" placeholder="e.g. Ready to start this month" value={form.timeline} onChange={(e) => update("timeline", e.target.value)} /></div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} style={{ width: "auto" }} />
          I&apos;ve read the <Link href="/terms" target="_blank">Terms</Link> &amp; <Link href="/privacy" target="_blank">Privacy Policy</Link>.
        </label>
      </div>

      <div className="wizard-nav">
        <span />
        <button className="pill pill-primary" disabled={submitting} onClick={submit}>{submitting ? "Sending…" : "Express interest"}</button>
      </div>
    </div>
  );
}
