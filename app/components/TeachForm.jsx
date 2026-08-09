"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const AVAILABILITY_OPTS = ["Weekday evenings", "Weekends", "Flexible / either"];

function blankProposal(defaultCategoryId) {
  return {
    title: "", categoryId: defaultCategoryId || "", brief: "",
    slots: [{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }],
  };
}

export default function TeachForm({ categories }) {
  const searchParams = useSearchParams();
  const referralId = searchParams.get("ref") || "";
  const referrerName = searchParams.get("refName") || "";

  const [profile, setProfile] = useState({
    name: searchParams.get("name") || "", email: searchParams.get("email") || "",
    password: "", confirmPassword: "", years: "", bio: "", topics: "", mode: "", linkedin: "", motivation: "", consent: false,
  });
  const [expertise, setExpertise] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [proposals, setProposals] = useState([blankProposal(categories[0]?.id)]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }
  function toggle(setFn, arr, id) {
    setFn(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function addProposal() {
    setProposals((p) => [...p, blankProposal(categories[0]?.id)]);
  }
  function removeProposal(idx) {
    setProposals((p) => p.filter((_, i) => i !== idx));
  }
  function updateProposal(idx, field, value) {
    setProposals((p) => p.map((prop, i) => (i === idx ? { ...prop, [field]: value } : prop)));
  }
  function updateSlot(idx, slotIdx, field, value) {
    setProposals((p) =>
      p.map((prop, i) =>
        i === idx
          ? { ...prop, slots: prop.slots.map((s, si) => (si === slotIdx ? { ...s, [field]: value } : s)) }
          : prop
      )
    );
  }

  function isTouched(p) {
    return p.title.trim() || p.brief.trim() || p.slots.some((s) => s.date || s.time);
  }
  function isComplete(p) {
    return p.title.trim() && p.categoryId && p.brief.trim() && p.slots.every((s) => s.date && s.time);
  }

  async function submit() {
    setError("");
    if (!profile.name.trim() || !profile.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!profile.password || profile.password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    if (profile.password !== profile.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!profile.consent) {
      setError("Please confirm you've read the Terms & Privacy Policy before applying.");
      return;
    }
    const touched = proposals.filter(isTouched);
    if (touched.some((p) => !isComplete(p))) {
      setError("Each session you start needs a title, category, brief, and all 3 proposed time slots — or remove it.");
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword, consent, ...profileToSend } = profile;
      const res = await fetch("/api/trainers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileToSend, expertise, availability, photo, proposals: touched, referralId: referralId || null }),
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
        <h2>Thanks for stepping up! 🙌</h2>
        <p style={{ color: "var(--navy-soft)" }}>
          Your application{proposals.filter(isTouched).length > 0 ? " and proposed session(s) are" : " is"} with the Vidyam team for review. We&apos;ll email you as soon as you&apos;re approved — then you can sign in to your trainer dashboard with the password you just set.
        </p>
      </div>
    );
  }

  return (
    <div className="form-card" style={{ margin: "0 auto 56px", maxWidth: 760 }}>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 18 }}>{error}</div>}

      <div className="field"><label>Full name *</label><input type="text" value={profile.name} onChange={(e) => update("name", e.target.value)} /></div>
      <div className="field"><label>Email *</label><input type="email" value={profile.email} onChange={(e) => update("email", e.target.value)} /></div>

      <div className="field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field"><label>Create a password *</label><input type="password" value={profile.password} onChange={(e) => update("password", e.target.value)} /></div>
        <div className="field"><label>Confirm password *</label><input type="password" value={profile.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} /></div>
      </div>
      <p className="hint" style={{ display: "block", marginTop: -12, marginBottom: 18 }}>At least 8 characters. This is how you'll sign in to your trainer dashboard once we approve your application — no need to wait for a separate email with a temp password.</p>

      <div className="field">
        <label>Your photo <span className="hint">(shown on your trainer profile)</span></label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {photo ? (
            <img src={photo} alt="Preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--panel)", flexShrink: 0 }} />
          )}
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </div>
      </div>

      <div className="field"><label>Years of experience</label><input type="text" value={profile.years} onChange={(e) => update("years", e.target.value)} /></div>
      <div className="field"><label>Short bio</label><textarea value={profile.bio} onChange={(e) => update("bio", e.target.value)} /></div>
      <div className="field"><label>Topics you can teach</label><input type="text" value={profile.topics} onChange={(e) => update("topics", e.target.value)} /></div>

      <div className="field">
        <label>Areas of expertise</label>
        <div className="chip-row">
          {categories.map((c) => (
            <div key={c.id} className={`chip ${expertise.includes(c.id) ? "selected" : ""}`} onClick={() => toggle(setExpertise, expertise, c.id)}>
              {c.name}
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Preferred mode</label>
        <select value={profile.mode} onChange={(e) => update("mode", e.target.value)}>
          <option value="">Select</option><option>Online</option><option>In-person</option><option>Hybrid</option>
        </select>
      </div>

      <div className="field">
        <label>General availability</label>
        <div className="chip-row">
          {AVAILABILITY_OPTS.map((a) => (
            <div key={a} className={`chip ${availability.includes(a) ? "selected" : ""}`} onClick={() => toggle(setAvailability, availability, a)}>
              {a}
            </div>
          ))}
        </div>
      </div>

      <div className="field"><label>LinkedIn (optional)</label><input type="text" value={profile.linkedin} onChange={(e) => update("linkedin", e.target.value)} /></div>
      <div className="field"><label>Why do you want to volunteer as a trainer/mentor?</label><textarea value={profile.motivation} onChange={(e) => update("motivation", e.target.value)} /></div>

      <div style={{ borderTop: "1px solid var(--line)", margin: "24px 0" }} />

      <h3 style={{ marginBottom: 4 }}>Propose session(s)</h3>
      <p className="hint" style={{ marginBottom: 16 }}>Optional — propose one or more sessions now with 3 possible time slots each, or skip this and we&apos;ll follow up.</p>

      {proposals.map((p, idx) => (
        <div key={idx} className="proposal-card" style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <div className="proposal-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <b>Session {idx + 1}</b>
            {proposals.length > 1 && <button type="button" className="pill pill-ghost" style={{ padding: "4px 12px", minHeight: "auto" }} onClick={() => removeProposal(idx)}>Remove</button>}
          </div>
          <div className="field"><label>Title</label><input type="text" value={p.title} onChange={(e) => updateProposal(idx, "title", e.target.value)} /></div>
          <div className="field">
            <label>Category</label>
            <select value={p.categoryId} onChange={(e) => updateProposal(idx, "categoryId", Number(e.target.value))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Brief</label><textarea value={p.brief} onChange={(e) => updateProposal(idx, "brief", e.target.value)} /></div>
          <div className="field">
            <label>Propose 3 time slots</label>
            {p.slots.map((s, si) => (
              <div key={si} className="slot-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <input type="date" value={s.date} onChange={(e) => updateSlot(idx, si, "date", e.target.value)} />
                <input type="text" placeholder="e.g. 7:00 – 8:00 PM IST" value={s.time} onChange={(e) => updateSlot(idx, si, "time", e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="pill pill-ghost" onClick={addProposal} style={{ marginBottom: 24 }}>+ Propose another session</button>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={profile.consent} onChange={(e) => update("consent", e.target.checked)} style={{ width: "auto" }} />
          I've read the <Link href="/terms" target="_blank">Terms</Link> &amp; <Link href="/privacy" target="_blank">Privacy Policy</Link>, and I consent to Vidyam storing my application details.
        </label>
      </div>

      <div className="wizard-nav">
        <span />
        <button className="pill pill-primary" disabled={submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit application"}</button>
      </div>
    </div>
  );
}
