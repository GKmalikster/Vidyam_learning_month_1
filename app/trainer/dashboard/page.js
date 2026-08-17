"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashShell from "../../components/DashShell";

const NAV = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "sessions", label: "My sessions", icon: "🗓️" },
  { id: "courses", label: "My courses", icon: "📚" },
  { id: "propose", label: "Propose a session", icon: "➕" },
  { id: "availability", label: "Availability", icon: "🕒" },
  { id: "profile", label: "My profile", icon: "🧑‍🏫" },
];

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

export default function TrainerDashboard() {
  const router = useRouter();
  const [trainer, setTrainer] = useState(null);
  const [tab, setTab] = useState("overview");
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [me, s, c] = await Promise.all([
      jsonFetch("/api/trainer-auth/me"),
      jsonFetch("/api/trainer/sessions"),
      jsonFetch("/api/categories"),
    ]);
    if (!me.trainer) { router.push("/trainer/login"); return; }
    setTrainer(me.trainer);
    setSessions(s);
    setCategories(c);
    setLoading(false);
  }, [router]);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await fetch("/api/trainer-auth/logout", { method: "POST" });
    router.push("/trainer/login");
  }

  if (loading || !trainer) return <div style={{ padding: 40 }}>Loading…</div>;

  const upcoming = sessions.filter((s) => ["approved", "pending", "on_hold"].includes(s.status));
  const totalRegistered = sessions.reduce((sum, s) => sum + (s.registered_count || 0), 0);

  return (
    <DashShell
      title="Trainer Dashboard"
      subtitle="Vidyam Learning Month"
      navItems={NAV}
      activeId={tab}
      onSelect={setTab}
      userLabel={<>Signed in as <b style={{ color: "#fff" }}>{trainer.name}</b></>}
      onLogout={logout}
      stats={[
        { label: "Sessions run/upcoming", value: sessions.length },
        { label: "Learners registered", value: totalRegistered },
        { label: "Pending review", value: sessions.filter((s) => s.status === "pending" || s.status === "on_hold").length },
      ]}
    >
      {trainer.mustReset && <SetPasswordBanner onDone={() => setTrainer({ ...trainer, mustReset: false })} />}
      {tab === "overview" && <OverviewTab sessions={upcoming} />}
      {tab === "sessions" && <SessionsTab sessions={sessions} refresh={refresh} />}
      {tab === "courses" && <CoursesTab />}
      {tab === "propose" && <ProposeTab categories={categories} refresh={refresh} setTab={setTab} />}
      {tab === "availability" && <AvailabilityTab />}
      {tab === "profile" && (
        <>
          <ProfileTab trainer={trainer} categories={categories} refresh={refresh} />
          <ChangePasswordPanel endpoint="/api/trainer-auth/change-password" />
        </>
      )}
    </DashShell>
  );
}

function Panel({ title, children }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    approved: ["approved", "Published"],
    pending: ["pending", "Awaiting review"],
    on_hold: ["rejected", "On hold"],
    completed: ["approved", "Completed"],
    archived: ["rejected", "Archived"],
  };
  const [cls, label] = map[status] || ["pending", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function SetPasswordBanner({ onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    setSaving(true);
    try {
      await jsonFetch("/api/trainer-auth/set-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      onDone();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="panel" style={{ borderColor: "var(--orange)", background: "#fff8ef" }}>
      <h3>Set a permanent password</h3>
      <p className="hint" style={{ display: "block", marginBottom: 12 }}>You're using the temporary password from your approval email — set your own before continuing.</p>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 12 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="password" placeholder="New password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1, minWidth: 220, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)" }} />
        <button className="pill pill-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save password"}</button>
      </div>
    </div>
  );
}

function OverviewTab({ sessions }) {
  return (
    <Panel title="Your upcoming & pending sessions">
      {sessions.length === 0 && <div className="empty-note">Nothing scheduled right now — propose a session to get started.</div>}
      {sessions.map((s) => (
        <div key={s.id} className="proposal-card">
          <div className="proposal-card-head">
            <b>{s.title}</b>
            <StatusBadge status={s.status} />
          </div>
          <div style={{ fontSize: 13, color: "var(--navy-soft)" }}>
            {s.category_name} {s.course_title ? `· Part of "${s.course_title}"` : ""}
          </div>
          {s.status === "approved" && <div style={{ fontSize: 13, marginTop: 6 }}>{s.date} · {s.time} — <b>{s.registered_count}</b> registered{s.waitlist_count ? `, ${s.waitlist_count} waitlisted` : ""}</div>}
        </div>
      ))}
    </Panel>
  );
}

function SessionsTab({ sessions, refresh }) {
  const [openId, setOpenId] = useState(null);
  return (
    <Panel title={`All your sessions (${sessions.length})`}>
      {sessions.length === 0 && <div className="empty-note">You haven't proposed any sessions yet.</div>}
      {sessions.map((s) => (
        <div key={s.id} className="proposal-card">
          <div className="proposal-card-head">
            <b>{s.title}</b>
            <StatusBadge status={s.status} />
          </div>
          <div style={{ fontSize: 13, color: "var(--navy-soft)", marginBottom: 8 }}>
            {s.category_name} {s.date ? `· ${s.date} ${s.time}` : ""}
          </div>
          {s.status === "on_hold" && s.hold_reason && <div className="empty-note" style={{ marginBottom: 10 }}>Hold reason: {s.hold_reason}</div>}
          {(s.status === "approved" || s.status === "completed") && (
            <button className="pill pill-ghost pill-sm" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
              {openId === s.id ? "Hide details" : "Manage registrants, materials & recording"}
            </button>
          )}
          {openId === s.id && <SessionManagePanel session={s} refresh={refresh} />}
        </div>
      ))}
    </Panel>
  );
}

function SessionManagePanel({ session, refresh }) {
  const [registrants, setRegistrants] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [newMaterial, setNewMaterial] = useState({ title: "", url: "" });
  const [recordingUrl, setRecordingUrl] = useState(session.recording_url || "");
  const [error, setError] = useState("");

  useEffect(() => {
    jsonFetch(`/api/trainer/sessions/${session.id}/registrants`).then(setRegistrants);
    jsonFetch(`/api/trainer/sessions/${session.id}/materials`).then(setMaterials);
  }, [session.id]);

  async function addMaterial() {
    setError("");
    if (!newMaterial.title || !newMaterial.url) { setError("Title and link are both required."); return; }
    try {
      await jsonFetch(`/api/trainer/sessions/${session.id}/materials`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMaterial) });
      setNewMaterial({ title: "", url: "" });
      jsonFetch(`/api/trainer/sessions/${session.id}/materials`).then(setMaterials);
    } catch (e) { setError(e.message); }
  }

  async function saveRecording(markCompleted) {
    await jsonFetch(`/api/trainer/sessions/${session.id}/recording`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordingUrl, markCompleted }) });
    refresh();
  }

  return (
    <div style={{ borderTop: "1px dashed var(--line)", marginTop: 12, paddingTop: 12 }}>
      <div className="form-section-title">Registrants</div>
      {!registrants && <div className="hint">Loading…</div>}
      {registrants && registrants.length === 0 && <div className="empty-note">No one has registered yet.</div>}
      {registrants && registrants.map((r) => (
        <div key={r.id} className="registrant-row">
          <span className="registrant-name">{r.name}</span>
          <span className="registrant-meta">{r.email} {r.city ? `· ${r.city}` : ""}</span>
          {r.waitlisted && <span className="check-pill waitlist">Waitlisted</span>}
          {r.attended && <span className="check-pill on">Attended</span>}
        </div>
      ))}

      <div className="form-section-title">Materials</div>
      {materials && materials.map((m) => (
        <div key={m.id} className="resource-list" style={{ marginBottom: 4 }}>
          <li><a href={m.url} target="_blank" rel="noreferrer">{m.title}</a></li>
        </div>
      ))}
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input placeholder="Title (e.g. Slides)" value={newMaterial.title} onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })} style={{ flex: 1, minWidth: 140, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)" }} />
        <input placeholder="Link (Drive, Docs, etc.)" value={newMaterial.url} onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })} style={{ flex: 2, minWidth: 180, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)" }} />
        <button className="pill pill-ghost pill-sm" onClick={addMaterial}>Add</button>
      </div>

      <div className="form-section-title">Recording &amp; completion</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Recording link (optional)" value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} style={{ flex: 1, minWidth: 220, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)" }} />
        <button className="pill pill-ghost pill-sm" onClick={() => saveRecording(false)}>Save link</button>
        {session.status !== "completed" && <button className="pill pill-primary pill-sm" onClick={() => saveRecording(true)}>Mark session completed</button>}
      </div>
    </div>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    jsonFetch("/api/trainer/courses").then(setCourses).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  function readFile(file, onDone) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onDone(reader.result);
    reader.readAsDataURL(file);
  }

  async function setCourseImage(id, field, dataUrl) {
    setError("");
    try {
      await jsonFetch(`/api/trainer/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: dataUrl }),
      });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <Panel title={`Courses you're part of ${courses ? `(${courses.length})` : ""}`}>
      <p className="hint" style={{ display: "block", marginBottom: 14 }}>
        You can update the cover and preview images for any course one of your sessions belongs to. Title, description and publishing stay admin-managed.
      </p>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
      {!courses && <div className="hint">Loading…</div>}
      {courses && courses.length === 0 && <div className="empty-note">None of your sessions are part of a course yet.</div>}
      {courses && courses.map((c) => (
        <div key={c.id} className="proposal-card">
          <div className="proposal-card-head">
            <b>{c.title}</b>
            <span className={`badge ${c.status === "published" ? "approved" : "pending"}`}>{c.status}</span>
          </div>
          {c.description && <p style={{ fontSize: 13, color: "var(--navy-soft)" }}>{c.description}</p>}
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {c.image ? <img src={c.image} alt="" style={{ width: 56, height: 34, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 56, height: 34, background: "var(--panel)", borderRadius: 6 }} />}
              <label className="pill pill-ghost pill-sm" style={{ cursor: "pointer" }}>
                {c.image ? "Change cover" : "Add cover image"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => readFile(e.target.files?.[0], (dataUrl) => setCourseImage(c.id, "image", dataUrl))} />
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {c.preview_image ? <img src={c.preview_image} alt="" style={{ width: 56, height: 34, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 56, height: 34, background: "var(--panel)", borderRadius: 6 }} />}
              <label className="pill pill-ghost pill-sm" style={{ cursor: "pointer" }}>
                {c.preview_image ? "Change preview" : "Add preview image"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => readFile(e.target.files?.[0], (dataUrl) => setCourseImage(c.id, "previewImage", dataUrl))} />
              </label>
            </div>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function ProposeTab({ categories, refresh, setTab }) {
  const [form, setForm] = useState({ title: "", categoryId: categories[0]?.id || "", brief: "", capacity: "", slots: [{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function setSlot(i, field, value) {
    const slots = [...form.slots];
    slots[i] = { ...slots[i], [field]: value };
    setForm({ ...form, slots });
  }

  async function submit() {
    setError(""); setSuccess(false);
    if (!form.title || !form.categoryId || !form.brief) { setError("Title, category and brief are required."); return; }
    try {
      await jsonFetch("/api/trainer/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : null }),
      });
      setSuccess(true);
      setForm({ title: "", categoryId: categories[0]?.id || "", brief: "", capacity: "", slots: [{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }] });
      refresh();
    } catch (e) { setError(e.message); }
  }

  return (
    <Panel title="Propose a new session">
      <p className="hint" style={{ display: "block", marginBottom: 14 }}>Suggest 3 candidate time slots — the console will pick one and publish it, or put it on hold with a reason.</p>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
      {success && <div className="success-box show" style={{ marginBottom: 14 }}>Sent for review — you'll see it under "My sessions" as pending.</div>}
      <div className="field"><label>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="field">
        <label>Category *</label>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="field"><label>Brief *</label><textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} /></div>
      <div className="field"><label>Capacity <span className="hint">(optional — leave blank for unlimited)</span></label><input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
      <div className="form-section-title">Candidate time slots (all 3 required)</div>
      {form.slots.map((slot, i) => (
        <div className="slot-row" key={i}>
          <span className="slot-label">Option {i + 1}</span>
          <input type="date" value={slot.date} onChange={(e) => setSlot(i, "date", e.target.value)} />
          <input placeholder="e.g. 7:00 – 8:00 PM IST" value={slot.time} onChange={(e) => setSlot(i, "time", e.target.value)} />
        </div>
      ))}
      <button className="pill pill-primary" onClick={submit} style={{ marginTop: 10 }}>Send for review</button>
    </Panel>
  );
}

function AvailabilityTab() {
  const [slots, setSlots] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { jsonFetch("/api/trainer/availability").then(setSlots); }, []);

  function addSlot() { setSlots([...slots, { day: "Monday", start: "19:00", end: "20:00" }]); }
  function updateSlot(i, field, value) {
    const next = [...slots]; next[i] = { ...next[i], [field]: value }; setSlots(next);
  }
  function removeSlot(i) { setSlots(slots.filter((_, idx) => idx !== i)); }

  async function save() {
    await jsonFetch("/api/trainer/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(slots) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Panel title="Weekly availability windows">
      <p className="hint" style={{ display: "block", marginBottom: 14 }}>Let the console know when you're generally free to run sessions — this doesn't publish anything on its own, it just helps scheduling.</p>
      {slots.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={s.day} onChange={(e) => updateSlot(i, "day", e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)" }}>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <input type="time" value={s.start} onChange={(e) => updateSlot(i, "start", e.target.value)} />
          <span className="hint">to</span>
          <input type="time" value={s.end} onChange={(e) => updateSlot(i, "end", e.target.value)} />
          <button className="icon-btn danger" onClick={() => removeSlot(i)}>Remove</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="pill pill-ghost pill-sm" onClick={addSlot}>+ Add window</button>
        <button className="pill pill-primary pill-sm" onClick={save}>Save availability</button>
        {saved && <span style={{ color: "#227722", fontSize: 13, alignSelf: "center" }}>Saved ✓</span>}
      </div>
    </Panel>
  );
}

function ProfileTab({ trainer, refresh }) {
  const [form, setForm] = useState({
    bio: trainer.bio || "", topics: trainer.topics || "", mode: trainer.mode || "",
    linkedin: trainer.linkedin || "", photo: trainer.photo || "", availability: trainer.availability || [],
  });
  const [saved, setSaved] = useState(false);

  async function save() {
    await jsonFetch("/api/trainer/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaved(true);
    refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photo: reader.result });
    reader.readAsDataURL(file);
  }

  return (
    <Panel title="Your public profile">
      <div className="field"><label>Name</label><input value={trainer.name} disabled /></div>
      <div className="field"><label>Email</label><input value={trainer.email} disabled /></div>
      <div className="photo-upload-row" style={{ marginBottom: 18 }}>
        <div className="photo-preview">
          {form.photo ? <img src={form.photo} alt="" /> : "🧑‍🏫"}
        </div>
        <label className="pill pill-ghost pill-sm" style={{ cursor: "pointer" }}>
          Change photo
          <input type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
        </label>
      </div>
      <div className="field"><label>Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
      <div className="field"><label>Topics you teach</label><input value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} /></div>
      <div className="field"><label>Mode</label>
        <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
          <option value="">Select</option>
          <option>Online</option><option>Hybrid</option><option>In-person</option>
        </select>
      </div>
      <div className="field"><label>LinkedIn</label><input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
      <div className="field">
        <label>Availability tags</label>
        <div className="chip-row">
          {["Weekday evenings", "Weekends", "Flexible / either"].map((t) => (
            <span
              key={t}
              className={`chip ${form.availability.includes(t) ? "selected" : ""}`}
              onClick={() => setForm({ ...form, availability: form.availability.includes(t) ? form.availability.filter((a) => a !== t) : [...form.availability, t] })}
            >{t}</span>
          ))}
        </div>
      </div>
      <button className="pill pill-primary" onClick={save}>Save profile</button>
      {saved && <span style={{ color: "#227722", fontSize: 13, marginLeft: 12 }}>Saved ✓</span>}
    </Panel>
  );
}

function ChangePasswordPanel({ endpoint }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    if (form.newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (form.newPassword !== form.confirmPassword) { setError("New passwords don't match."); return; }
    setSaving(true);
    try {
      await jsonFetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Change password">
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
      <div className="field"><label>Current password</label><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></div>
      <div className="field"><label>New password</label><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></div>
      <div className="field"><label>Confirm new password</label><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
      <button className="pill pill-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Update password"}</button>
      {saved && <span style={{ color: "#227722", fontSize: 13, marginLeft: 12 }}>Saved ✓</span>}
    </Panel>
  );
}
