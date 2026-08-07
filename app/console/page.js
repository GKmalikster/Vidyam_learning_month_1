"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "programs", label: "Programs" },
  { id: "requests", label: "Session requests" },
  { id: "trainers", label: "Trainers & mentors" },
  { id: "categories", label: "Categories" },
  { id: "registrations", label: "Registrations" },
];

const BRAND_PALETTE = ["#006afd", "#00cffe", "#923efb", "#fe8502", "#a7e318", "#0a1a4f"];

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

export default function ConsoleDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState("programs");
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [me, s, t, c, r] = await Promise.all([
      jsonFetch("/api/auth/me"),
      jsonFetch("/api/admin/sessions"),
      jsonFetch("/api/admin/trainers"),
      jsonFetch("/api/admin/categories"),
      jsonFetch("/api/admin/registrations"),
    ]);
    setAdmin(me.admin);
    setSessions(s);
    setTrainers(t);
    setCategories(c);
    setRegistrations(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/console/login");
  }

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  const approvedCount = sessions.filter((s) => s.status === "approved").length;
  const pendingRequestCount = sessions.filter((s) => s.status === "pending" || s.status === "on_hold").length;
  const pendingTrainerCount = trainers.filter((t) => t.status === "pending").length;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Vidyam" style={{ height: 34 }} />
          <b>Content Manager</b>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "var(--navy-soft)" }}>
          Signed in as <b>{admin?.name}</b>
          <button className="pill pill-ghost" style={{ padding: "6px 14px", minHeight: "auto" }} onClick={logout}>Log out</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <MetricCard label="Live programs" value={approvedCount} />
        <MetricCard label="Session requests waiting" value={pendingRequestCount} />
        <MetricCard label="Trainer applications waiting" value={pendingTrainerCount} />
        <MetricCard label="Registrations" value={registrations.length} />
      </div>

      <div className="navlinks" style={{ marginBottom: 20, borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
        {TABS.map((t) => (
          <a key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)} style={{ cursor: "pointer" }}>
            {t.label}
          </a>
        ))}
      </div>

      {tab === "programs" && <ProgramsTab sessions={sessions} categories={categories} trainers={trainers} refresh={refreshAll} />}
      {tab === "requests" && <RequestsTab sessions={sessions} trainers={trainers} refresh={refreshAll} />}
      {tab === "trainers" && <TrainersTab trainers={trainers} categories={categories} refresh={refreshAll} />}
      {tab === "categories" && <CategoriesTab categories={categories} refresh={refreshAll} />}
      {tab === "registrations" && <RegistrationsTab registrations={registrations} />}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--navy-soft)" }}>{label}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="panel" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 22, marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

/* ---------------- Programs tab ---------------- */
function ProgramsTab({ sessions, categories, trainers, refresh }) {
  const [form, setForm] = useState({ title: "", categoryId: categories[0]?.id || "", brief: "", date: "", time: "", trainerId: "" });
  const [error, setError] = useState("");
  const live = sessions.filter((s) => s.status === "approved");

  async function save() {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    try {
      await jsonFetch("/api/admin/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm({ title: "", categoryId: categories[0]?.id || "", brief: "", date: "", time: "", trainerId: "" });
      refresh();
    } catch (e) { setError(e.message); }
  }
  async function del(id) {
    await jsonFetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <>
      <Panel title="Roll out a new program">
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
        <div className="field"><label>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field">
          <label>Category</label>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Brief</label><textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} /></div>
        <div className="field"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field"><label>Time</label><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="e.g. 7:00 – 8:00 PM IST" /></div>
        <div className="field">
          <label>Trainer</label>
          <select value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: Number(e.target.value) })}>
            <option value="">Unassigned</option>
            {trainers.filter((t) => t.status === "approved").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button className="pill pill-primary" onClick={save}>Publish program</button>
      </Panel>

      <Panel title={`Live programs (${live.length})`}>
        <p className="hint" style={{ display: "block", marginBottom: 12 }}>Trainer-proposed sessions go through the &quot;Session requests&quot; tab first — only approved, published programs show here and on the public site.</p>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th align="left">Title</th><th align="left">Category</th><th align="left">Date</th><th align="left">Trainer</th><th /></tr></thead>
            <tbody>
              {live.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 4px" }}>{s.title}</td>
                  <td>{s.category_name}</td>
                  <td>{s.date} {s.time}</td>
                  <td>{s.trainer_name || "—"}</td>
                  <td><button className="pill pill-ghost" style={{ padding: "4px 12px", minHeight: "auto" }} onClick={() => del(s.id)}>Delete</button></td>
                </tr>
              ))}
              {live.length === 0 && <tr><td colSpan={5} className="empty-note">No published programs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Session requests tab ---------------- */
function RequestsTab({ sessions, refresh }) {
  const pending = sessions.filter((s) => s.status === "pending" || s.status === "on_hold");
  const [slotChoice, setSlotChoice] = useState({});
  const [holdReason, setHoldReason] = useState({});
  const [errors, setErrors] = useState({});

  async function approve(id) {
    const slotIndex = slotChoice[id];
    if (slotIndex === undefined) { setErrors((e) => ({ ...e, [id]: "Pick a time slot before approving." })); return; }
    try {
      await jsonFetch(`/api/admin/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", slotIndex }) });
      refresh();
    } catch (e) { setErrors((er) => ({ ...er, [id]: e.message })); }
  }
  async function hold(id) {
    const reason = holdReason[id];
    if (!reason || !reason.trim()) { setErrors((e) => ({ ...e, [id]: "A reason is required to put a session on hold." })); return; }
    try {
      await jsonFetch(`/api/admin/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "hold", holdReason: reason }) });
      refresh();
    } catch (e) { setErrors((er) => ({ ...er, [id]: e.message })); }
  }

  return (
    <Panel title={`Session requests (${pending.length})`}>
      <p className="hint" style={{ display: "block", marginBottom: 14 }}>Trainers propose sessions with 3 possible time slots. Pick one to confirm and publish, or put the request on hold with a reason.</p>
      {pending.length === 0 && <div className="empty-note">No session requests waiting on you right now.</div>}
      {pending.map((s) => (
        <div key={s.id} className="proposal-card" style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>{s.title}</b>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.status === "on_hold" ? "#c0392b" : "var(--navy-soft)" }}>{s.status === "on_hold" ? "ON HOLD" : "PENDING"}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--navy-soft)", margin: "6px 0" }}>{s.category_name} · proposed by {s.trainer_name || "—"}</div>
          <p style={{ fontSize: 14, color: "var(--navy-soft)" }}>{s.brief}</p>
          {s.status === "on_hold" && s.hold_reason && <div className="empty-note" style={{ marginBottom: 10 }}>Hold reason: {s.hold_reason}</div>}
          {errors[s.id] && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 10 }}>{errors[s.id]}</div>}
          <div style={{ marginBottom: 10 }}>
            {s.slots.map((slot, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13 }}>
                <input type="radio" name={`slot-${s.id}`} checked={slotChoice[s.id] === i} onChange={() => setSlotChoice((sc) => ({ ...sc, [s.id]: i }))} />
                {slot.date} · {slot.time}
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="pill pill-primary" onClick={() => approve(s.id)}>Approve &amp; publish</button>
            <input placeholder="Reason for hold" value={holdReason[s.id] || ""} onChange={(e) => setHoldReason((h) => ({ ...h, [s.id]: e.target.value }))} style={{ flex: 1, minWidth: 160, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line)" }} />
            <button className="pill pill-ghost" onClick={() => hold(s.id)}>Put on hold</button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

/* ---------------- Trainers tab ---------------- */
function TrainersTab({ trainers, categories, refresh }) {
  const pending = trainers.filter((t) => t.status === "pending");
  const approved = trainers.filter((t) => t.status === "approved");
  const [form, setForm] = useState({ name: "", email: "", bio: "", mode: "" });

  async function decide(id, status) {
    await jsonFetch(`/api/admin/trainers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    refresh();
  }
  async function del(id) {
    await jsonFetch(`/api/admin/trainers/${id}`, { method: "DELETE" });
    refresh();
  }
  async function addTrainer() {
    if (!form.name.trim()) return;
    await jsonFetch("/api/admin/trainers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", email: "", bio: "", mode: "" });
    refresh();
  }

  return (
    <>
      <Panel title={`Pending applications (${pending.length})`}>
        {pending.length === 0 && <div className="empty-note">No pending trainer applications right now.</div>}
        {pending.map((t) => (
          <div key={t.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <b>{t.name}</b> — <span style={{ fontSize: 13, color: "var(--navy-soft)" }}>{t.bio}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="pill pill-primary" style={{ padding: "6px 14px", minHeight: "auto" }} onClick={() => decide(t.id, "approved")}>Approve</button>
              <button className="pill pill-ghost" style={{ padding: "6px 14px", minHeight: "auto" }} onClick={() => decide(t.id, "rejected")}>Reject</button>
            </div>
          </div>
        ))}
      </Panel>

      <Panel title="Add a trainer or mentor directly">
        <div className="field"><label>Full name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <button className="pill pill-primary" onClick={addTrainer}>Add trainer</button>
      </Panel>

      <Panel title={`Approved trainers & mentors (${approved.length})`}>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th align="left">Name</th><th align="left">Mode</th><th /></tr></thead>
            <tbody>
              {approved.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 4px" }}>{t.name}</td>
                  <td>{t.mode}</td>
                  <td><button className="pill pill-ghost" style={{ padding: "4px 12px", minHeight: "auto" }} onClick={() => del(t.id)}>Delete</button></td>
                </tr>
              ))}
              {approved.length === 0 && <tr><td colSpan={3} className="empty-note">No approved trainers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Categories tab ---------------- */
function CategoriesTab({ categories, refresh }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(BRAND_PALETTE[0]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function startEdit(c) {
    setEditingId(c.id);
    setName(c.name);
    setColor(c.color);
  }
  function cancelEdit() {
    setEditingId(null);
    setName("");
    setColor(BRAND_PALETTE[0]);
  }

  async function save() {
    setError("");
    if (!name.trim()) { setError("Category name is required."); return; }
    try {
      if (editingId) {
        await jsonFetch(`/api/admin/categories/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) });
      } else {
        await jsonFetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, color }) });
      }
      cancelEdit();
      refresh();
    } catch (e) { setError(e.message); }
  }
  async function del(id) {
    setError("");
    try {
      await jsonFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      refresh();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <Panel title={editingId ? "Edit category" : "Add a learning category"}>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
        <div className="field"><label>Category name *</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field">
          <label>Colour</label>
          <div className="swatch-row" style={{ display: "flex", gap: 8 }}>
            {BRAND_PALETTE.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid var(--navy)" : "3px solid transparent" }}
              />
            ))}
          </div>
        </div>
        <button className="pill pill-primary" onClick={save}>{editingId ? "Save changes" : "Add category"}</button>
        {editingId && <button className="pill pill-ghost" style={{ marginLeft: 8 }} onClick={cancelEdit}>Cancel</button>}
      </Panel>

      <Panel title={`All categories (${categories.length})`}>
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th align="left">Category</th><th align="left">Programs using it</th><th /></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 4px" }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: c.color, marginRight: 8 }} />
                    {c.name}
                  </td>
                  <td>{c.usage}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="pill pill-ghost" style={{ padding: "4px 12px", minHeight: "auto" }} onClick={() => startEdit(c)}>Edit</button>
                    <button className="pill pill-ghost" style={{ padding: "4px 12px", minHeight: "auto" }} onClick={() => del(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Registrations tab ---------------- */
function RegistrationsTab({ registrations }) {
  return (
    <Panel title={`Learner registrations (${registrations.length})`}>
      <p className="hint" style={{ display: "block", marginBottom: 12 }}>One row per program a learner registered for.</p>
      <div className="table-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Name</th><th align="left">Email</th><th align="left">Program</th><th align="left">City</th><th align="left">Role</th></tr></thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 4px" }}>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.session_title || "—"}</td>
                <td>{r.city}</td>
                <td>{r.role}</td>
              </tr>
            ))}
            {registrations.length === 0 && <tr><td colSpan={5} className="empty-note">No registrations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
