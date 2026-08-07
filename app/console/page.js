"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashShell from "../components/DashShell";

const NAV = [
  { id: "programs", label: "Programs", icon: "🗓️" },
  { id: "requests", label: "Session requests", icon: "📥" },
  { id: "courses", label: "Courses", icon: "📚" },
  { id: "trainers", label: "Trainers & mentors", icon: "🧑‍🏫" },
  { id: "categories", label: "Categories", icon: "🏷️" },
  { id: "registrants", label: "Registrants", icon: "👥" },
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
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [me, s, t, c, co, r] = await Promise.all([
      jsonFetch("/api/auth/me"),
      jsonFetch("/api/admin/sessions"),
      jsonFetch("/api/admin/trainers"),
      jsonFetch("/api/admin/categories"),
      jsonFetch("/api/admin/courses"),
      jsonFetch("/api/admin/registrations"),
    ]);
    setAdmin(me.admin);
    setSessions(s);
    setTrainers(t);
    setCategories(c);
    setCourses(co);
    setRegistrations(r);
    setLoading(false);
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/console/login");
  }

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  const liveCount = sessions.filter((s) => s.status === "approved").length;
  const pendingRequestCount = sessions.filter((s) => s.status === "pending" || s.status === "on_hold").length;
  const pendingTrainerCount = trainers.filter((t) => t.status === "pending").length;
  const waitlistCount = registrations.filter((r) => r.waitlisted).length;

  return (
    <DashShell
      title="Content Manager"
      subtitle="Vidyam Learning Month"
      navItems={NAV.map((n) => ({
        ...n,
        badge: n.id === "requests" ? pendingRequestCount : n.id === "trainers" ? pendingTrainerCount : undefined,
      }))}
      activeId={tab}
      onSelect={setTab}
      userLabel={<>Signed in as <b style={{ color: "#fff" }}>{admin?.name}</b></>}
      onLogout={logout}
      stats={[
        { label: "Live programs", value: liveCount },
        { label: "Session requests waiting", value: pendingRequestCount },
        { label: "Trainer applications waiting", value: pendingTrainerCount },
        { label: "Registrations", value: registrations.length },
        { label: "On waitlist", value: waitlistCount },
      ]}
    >
      {tab === "programs" && <ProgramsTab sessions={sessions} categories={categories} trainers={trainers} courses={courses} refresh={refreshAll} />}
      {tab === "requests" && <RequestsTab sessions={sessions} courses={courses} refresh={refreshAll} />}
      {tab === "courses" && <CoursesTab courses={courses} categories={categories} sessions={sessions} trainers={trainers} refresh={refreshAll} />}
      {tab === "trainers" && <TrainersTab trainers={trainers} categories={categories} courses={courses} refresh={refreshAll} />}
      {tab === "categories" && <CategoriesTab categories={categories} refresh={refreshAll} />}
      {tab === "registrants" && <RegistrantsTab sessions={sessions} registrations={registrations} refresh={refreshAll} />}
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

/* ---------------- Programs tab ---------------- */
function ProgramsTab({ sessions, categories, trainers, courses, refresh }) {
  const [form, setForm] = useState({ title: "", categoryId: categories[0]?.id || "", brief: "", date: "", time: "", trainerId: "", courseId: "", capacity: "" });
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("live");

  const live = sessions.filter((s) => s.status === "approved");
  const past = sessions.filter((s) => s.status === "completed");
  const archived = sessions.filter((s) => s.status === "archived");
  const shown = filter === "live" ? live : filter === "past" ? past : archived;

  async function save() {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    try {
      await jsonFetch("/api/admin/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, courseId: form.courseId || null, capacity: form.capacity ? Number(form.capacity) : null }),
      });
      setForm({ title: "", categoryId: categories[0]?.id || "", brief: "", date: "", time: "", trainerId: "", courseId: "", capacity: "" });
      refresh();
    } catch (e) { setError(e.message); }
  }
  async function del(id) { await jsonFetch(`/api/admin/sessions/${id}`, { method: "DELETE" }); refresh(); }
  async function act(id, action, extra) {
    await jsonFetch(`/api/admin/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    refresh();
  }
  async function assignCourse(id, courseId) {
    await jsonFetch(`/api/admin/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: courseId || null }) });
    refresh();
  }

  return (
    <>
      <Panel title="Roll out a new program">
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
        <div className="row2">
          <div className="field"><label>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field">
            <label>Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Brief</label><textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} /></div>
        <div className="row2">
          <div className="field"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="field"><label>Time</label><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="e.g. 7:00 – 8:00 PM IST" /></div>
        </div>
        <div className="row2">
          <div className="field">
            <label>Trainer</label>
            <select value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: Number(e.target.value) })}>
              <option value="">Unassigned</option>
              {trainers.filter((t) => t.status === "approved").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Capacity <span className="hint">(optional)</span></label>
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Part of a course <span className="hint">(optional)</span></label>
          <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            <option value="">Standalone session</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <button className="pill pill-primary" onClick={save}>Publish program</button>
      </Panel>

      <Panel title="Programs">
        <div className="consoletabs" style={{ marginBottom: 14 }}>
          <button className={filter === "live" ? "active" : ""} onClick={() => setFilter("live")}>Live ({live.length})</button>
          <button className={filter === "past" ? "active" : ""} onClick={() => setFilter("past")}>Completed ({past.length})</button>
          <button className={filter === "archived" ? "active" : ""} onClick={() => setFilter("archived")}>Archived ({archived.length})</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th align="left">Title</th><th align="left">Category</th><th align="left">Date</th><th align="left">Trainer</th><th align="left">Registered</th><th align="left">Course</th><th /></tr></thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: "8px 4px" }}>{s.title}</td>
                  <td>{s.category_name}</td>
                  <td>{s.date} {s.time}</td>
                  <td>{s.trainer_name || "—"}</td>
                  <td>{s.registered_count}{s.waitlist_count ? ` (+${s.waitlist_count} waitlist)` : ""}{s.capacity ? ` / ${s.capacity}` : ""}</td>
                  <td>
                    <select value={s.course_id || ""} onChange={(e) => assignCourse(s.id, e.target.value)} style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }}>
                      <option value="">—</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {filter === "live" && <button className="icon-btn good" onClick={() => act(s.id, "complete")}>Mark done</button>}
                    {filter !== "archived" && <button className="icon-btn" onClick={() => act(s.id, "archive")}>Archive</button>}
                    {filter === "archived" && <button className="icon-btn good" onClick={() => act(s.id, "restore")}>Restore</button>}
                    <button className="icon-btn danger" onClick={() => del(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={7} className="empty-note">Nothing here yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Session requests tab ---------------- */
function RequestsTab({ sessions, courses, refresh }) {
  const pending = sessions.filter((s) => s.status === "pending" || s.status === "on_hold");
  const [slotChoice, setSlotChoice] = useState({}); // { [sessionId]: number[] }
  const [extra, setExtra] = useState({}); // { [sessionId]: { capacity, courseId } }
  const [holdReason, setHoldReason] = useState({});
  const [errors, setErrors] = useState({});

  function toggleSlot(id, i) {
    setSlotChoice((sc) => {
      const current = sc[id] || [];
      const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i];
      return { ...sc, [id]: next };
    });
  }
  function setField(id, field, value) {
    setExtra((ex) => ({ ...ex, [id]: { ...ex[id], [field]: value } }));
  }

  async function approve(id) {
    const slotIndices = slotChoice[id] || [];
    if (slotIndices.length === 0) { setErrors((e) => ({ ...e, [id]: "Pick at least one time slot before approving." })); return; }
    const { capacity, courseId } = extra[id] || {};
    try {
      await jsonFetch(`/api/admin/sessions/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", slotIndices, capacity: capacity || null, courseId: courseId || null }),
      });
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
      <p className="hint" style={{ display: "block", marginBottom: 14 }}>Trainers propose sessions with 3 possible time slots — from the public apply form or their own dashboard. Check off one or more slots to publish that many sessions from a single request (handy for a recurring program), optionally set a capacity and attach them to a course, or put the request on hold with a reason.</p>
      {pending.length === 0 && <div className="empty-note">No session requests waiting on you right now.</div>}
      {pending.map((s) => {
        const chosenCount = (slotChoice[s.id] || []).length;
        return (
        <div key={s.id} className="proposal-card">
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
                <input type="checkbox" checked={(slotChoice[s.id] || []).includes(i)} onChange={() => toggleSlot(s.id, i)} />
                {slot.date} · {slot.time}
              </label>
            ))}
          </div>
          <div className="row2" style={{ marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Capacity <span className="hint">(optional, applies to each published session)</span></label>
              <input type="number" min="1" value={extra[s.id]?.capacity || ""} onChange={(e) => setField(s.id, "capacity", e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Part of a course <span className="hint">(optional)</span></label>
              <select value={extra[s.id]?.courseId || ""} onChange={(e) => setField(s.id, "courseId", e.target.value)}>
                <option value="">Standalone session</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="pill pill-primary" onClick={() => approve(s.id)}>
              {chosenCount > 1 ? `Approve & publish ${chosenCount} sessions` : "Approve & publish"}
            </button>
            <input placeholder="Reason for hold" value={holdReason[s.id] || ""} onChange={(e) => setHoldReason((h) => ({ ...h, [s.id]: e.target.value }))} style={{ flex: 1, minWidth: 160, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line)" }} />
            <button className="pill pill-ghost" onClick={() => hold(s.id)}>Put on hold</button>
          </div>
        </div>
        );
      })}
    </Panel>
  );
}

/* ---------------- Courses tab ---------------- */
function CoursesTab({ courses, categories, sessions, trainers, refresh }) {
  const [form, setForm] = useState({ title: "", description: "", categoryId: categories[0]?.id || "" });
  const [sessionRows, setSessionRows] = useState([]);
  const [error, setError] = useState("");

  async function create() {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    try {
      const sessionsPayload = sessionRows
        .filter((r) => r.title.trim())
        .map((r) => ({ title: r.title, categoryId: r.categoryId || null, brief: r.brief, date: r.date, time: r.time, capacity: r.capacity || null, trainerId: r.linkId || null }));
      await jsonFetch("/api/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sessions: sessionsPayload }) });
      setForm({ title: "", description: "", categoryId: categories[0]?.id || "" });
      setSessionRows([]);
      refresh();
    } catch (e) { setError(e.message); }
  }
  async function setStatus(id, status) {
    await jsonFetch(`/api/admin/courses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    refresh();
  }
  async function del(id) { await jsonFetch(`/api/admin/courses/${id}`, { method: "DELETE" }); refresh(); }

  return (
    <>
      <Panel title="Roll out a course (bundle of sessions)">
        <p className="hint" style={{ display: "block", marginBottom: 14 }}>Create the course and its session(s) together here, or just create the course and assign existing sessions to it from the Programs tab later — use "Course order" if you want them numbered.</p>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
        <div className="field"><label>Course title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="field">
          <label>Category</label>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", margin: "18px 0 12px" }} />
        <b style={{ fontSize: 13.5 }}>Session(s) for this course</b>
        <p className="hint" style={{ display: "block", margin: "4px 0 0" }}>Optional — same fields as "Roll out a new program," so this course can go live with its sessions in one step.</p>
        <ProgramRowsEditor rows={sessionRows} setRows={setSessionRows} categories={categories} linkOptions={trainers.filter((t) => t.status === "approved")} linkLabel="Trainer (optional)" />

        <button className="pill pill-primary" style={{ marginTop: 16 }} onClick={create}>Create course (draft)</button>
      </Panel>

      <Panel title={`All courses (${courses.length})`}>
        {courses.map((c) => {
          const attached = sessions.filter((s) => s.course_id === c.id);
          return (
            <div key={c.id} className="proposal-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b>{c.title}</b>
                <span className={`badge ${c.status === "published" ? "approved" : "pending"}`}>{c.status}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--navy-soft)" }}>{c.description}</p>
              <div style={{ fontSize: 12.5, color: "var(--navy-soft)", marginBottom: 10 }}>{attached.length} session(s) attached</div>
              <div style={{ display: "flex", gap: 8 }}>
                {c.status !== "published" ? (
                  <button className="pill pill-primary pill-sm" onClick={() => setStatus(c.id, "published")}>Publish</button>
                ) : (
                  <button className="pill pill-ghost pill-sm" onClick={() => setStatus(c.id, "draft")}>Unpublish</button>
                )}
                <button className="icon-btn danger" onClick={() => del(c.id)}>Delete</button>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && <div className="empty-note">No courses yet.</div>}
      </Panel>
    </>
  );
}

// Shared repeatable "program row" editor used by both the "Add a trainer
// directly" form (trainer is implicit, pick a course per row) and the
// "Roll out a course" form (course is implicit, pick a trainer per row).
// Each row carries the same fields as "Roll out a new program" on the
// Programs tab, so either shortcut form can fully stand in for it.
function blankProgramRow(defaultCategoryId) {
  return { title: "", categoryId: defaultCategoryId || "", brief: "", date: "", time: "", capacity: "", linkId: "" };
}
function ProgramRowsEditor({ rows, setRows, categories, linkOptions, linkLabel }) {
  function update(i, field, value) { setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))); }
  function add() { setRows((r) => [...r, blankProgramRow(categories[0]?.id)]); }
  function remove(i) { setRows((r) => r.filter((_, idx) => idx !== i)); }

  return (
    <div style={{ marginTop: 10 }}>
      {rows.map((row, i) => (
        <div key={i} className="proposal-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b style={{ fontSize: 13 }}>Program {i + 1}</b>
            {rows.length > 1 && <button type="button" className="pill pill-ghost pill-sm" onClick={() => remove(i)}>Remove</button>}
          </div>
          <div className="row2">
            <div className="field"><label>Title</label><input value={row.title} onChange={(e) => update(i, "title", e.target.value)} /></div>
            <div className="field">
              <label>Category</label>
              <select value={row.categoryId} onChange={(e) => update(i, "categoryId", Number(e.target.value))}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>Brief</label><textarea value={row.brief} onChange={(e) => update(i, "brief", e.target.value)} /></div>
          <div className="row2">
            <div className="field"><label>Date</label><input type="date" value={row.date} onChange={(e) => update(i, "date", e.target.value)} /></div>
            <div className="field"><label>Time</label><input value={row.time} onChange={(e) => update(i, "time", e.target.value)} placeholder="e.g. 7:00 – 8:00 PM IST" /></div>
          </div>
          <div className="row2">
            <div className="field">
              <label>Capacity <span className="hint">(optional)</span></label>
              <input type="number" min="1" value={row.capacity} onChange={(e) => update(i, "capacity", e.target.value)} />
            </div>
            <div className="field">
              <label>{linkLabel}</label>
              <select value={row.linkId} onChange={(e) => update(i, "linkId", e.target.value)}>
                <option value="">{linkLabel.startsWith("Course") ? "Standalone session" : "Unassigned"}</option>
                {linkOptions.map((o) => <option key={o.id} value={o.id}>{o.title || o.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="pill pill-ghost pill-sm" onClick={add}>+ Add another program</button>
    </div>
  );
}

/* ---------------- Trainers tab ---------------- */
function TrainersTab({ trainers, categories, courses, refresh }) {
  const pending = trainers.filter((t) => t.status === "pending");
  const approved = trainers.filter((t) => t.status === "approved");
  const [form, setForm] = useState({ name: "", email: "", bio: "", mode: "" });
  const [programRows, setProgramRows] = useState([]);
  const [credModal, setCredModal] = useState(null);

  async function decide(id, status) {
    const result = await jsonFetch(`/api/admin/trainers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (status === "approved") {
      const t = trainers.find((tr) => tr.id === id);
      // tempPassword is only present for legacy/console-added trainers who
      // hadn't already set their own password on the /teach form.
      setCredModal({ name: t?.name, email: t?.email, tempPassword: result.tempPassword, emailSent: result.emailSent });
    }
    refresh();
  }
  async function del(id) { await jsonFetch(`/api/admin/trainers/${id}`, { method: "DELETE" }); refresh(); }
  async function addTrainer() {
    if (!form.name.trim()) return;
    const programs = programRows
      .filter((r) => r.title.trim())
      .map((r) => ({ title: r.title, categoryId: r.categoryId || null, brief: r.brief, date: r.date, time: r.time, capacity: r.capacity || null, courseId: r.linkId || null }));
    await jsonFetch("/api/admin/trainers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, programs }) });
    setForm({ name: "", email: "", bio: "", mode: "" });
    setProgramRows([]);
    refresh();
  }

  return (
    <>
      {credModal && (
        <div className="panel" style={{ borderColor: "var(--lime)", background: "#f7fdf0" }}>
          <h3>Trainer approved</h3>
          {credModal.tempPassword ? (
            <>
              <p style={{ fontSize: 13.5, color: "var(--navy-soft)" }}>
                {credModal.emailSent
                  ? <>An email with login details was sent to <b>{credModal.email}</b>.</>
                  : <>Email sending isn't configured yet — share these details with <b>{credModal.name}</b> yourself:</>}
              </p>
              <div style={{ fontSize: 14, fontFamily: "monospace", background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                Login: /trainer/login<br />Email: {credModal.email}<br />Temporary password: <b>{credModal.tempPassword}</b>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--navy-soft)" }}>
              {credModal.name} already set their own password when they applied.{" "}
              {credModal.emailSent
                ? <>We emailed them at <b>{credModal.email}</b> to let them know they can log in now.</>
                : <>Email sending isn't configured yet — let <b>{credModal.name}</b> know at <b>{credModal.email}</b> that they can sign in at /trainer/login with the password they set on their application.</>}
            </p>
          )}
          <button className="pill pill-ghost pill-sm" onClick={() => setCredModal(null)}>Dismiss</button>
        </div>
      )}

      <Panel title={`Pending applications (${pending.length})`}>
        {pending.length === 0 && <div className="empty-note">No pending trainer applications right now.</div>}
        {pending.map((t) => (
          <div key={t.id} className="registrant-row" style={{ padding: "12px 4px" }}>
            <div style={{ minWidth: 220 }}>
              <b style={{ color: "var(--navy)" }}>{t.name}</b>
              <div className="registrant-meta">{t.email} · {t.years ? `${t.years} yrs · ` : ""}{t.mode}</div>
            </div>
            <div className="registrant-meta" style={{ flex: 2 }}>{t.bio}</div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="pill pill-primary pill-sm" onClick={() => decide(t.id, "approved")}>Approve</button>
              <button className="pill pill-ghost pill-sm" onClick={() => decide(t.id, "rejected")}>Reject</button>
            </div>
          </div>
        ))}
      </Panel>

      <Panel title="Add a trainer or mentor directly">
        <div className="field"><label>Full name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>

        <div style={{ borderTop: "1px solid var(--line)", margin: "18px 0 12px" }} />
        <b style={{ fontSize: 13.5 }}>Roll out program(s) for this trainer</b>
        <p className="hint" style={{ display: "block", margin: "4px 0 0" }}>Optional — same fields as "Roll out a new program," so you can publish one or more sessions for them right now. Each one can be attached to a different course.</p>
        <ProgramRowsEditor rows={programRows} setRows={setProgramRows} categories={categories} linkOptions={courses} linkLabel="Course (optional)" />

        <button className="pill pill-primary" style={{ marginTop: 16 }} onClick={addTrainer}>Add trainer (pre-approved, no dashboard login)</button>
      </Panel>

      <Panel title={`Approved trainers & mentors (${approved.length})`}>
        <div className="table-scroll">
          <table>
            <thead><tr><th align="left">Name</th><th align="left">Mode</th><th /></tr></thead>
            <tbody>
              {approved.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: "8px 4px" }}>{t.name}</td>
                  <td>{t.mode}</td>
                  <td><button className="icon-btn danger" onClick={() => del(t.id)}>Delete</button></td>
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

  function startEdit(c) { setEditingId(c.id); setName(c.name); setColor(c.color); }
  function cancelEdit() { setEditingId(null); setName(""); setColor(BRAND_PALETTE[0]); }

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
    try { await jsonFetch(`/api/admin/categories/${id}`, { method: "DELETE" }); refresh(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <Panel title={editingId ? "Edit category" : "Add a learning category"}>
        {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
        <div className="field"><label>Category name *</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field">
          <label>Colour</label>
          <div className="swatch-row">
            {BRAND_PALETTE.map((c) => (
              <div key={c} className={`swatch ${color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <button className="pill pill-primary" onClick={save}>{editingId ? "Save changes" : "Add category"}</button>
        {editingId && <button className="pill pill-ghost" style={{ marginLeft: 8 }} onClick={cancelEdit}>Cancel</button>}
      </Panel>

      <Panel title={`All categories (${categories.length})`}>
        <div className="table-scroll">
          <table>
            <thead><tr><th align="left">Category</th><th align="left">Programs using it</th><th /></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: "8px 4px" }}><span className="cat-dot" style={{ background: c.color }} />{c.name}</td>
                  <td>{c.usage}</td>
                  <td>
                    <button className="icon-btn" onClick={() => startEdit(c)}>Edit</button>
                    <button className="icon-btn danger" onClick={() => del(c.id)}>Delete</button>
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

/* ---------------- Registrants tab ---------------- */
function RegistrantsTab({ sessions, registrations, refresh }) {
  const sessionsWithRegs = sessions.filter((s) => registrations.some((r) => r.session_id === s.id));
  const [openId, setOpenId] = useState(sessionsWithRegs[0]?.id || null);

  async function toggle(id, field, value) {
    await jsonFetch(`/api/admin/registrations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    refresh();
  }

  function exportCsv(sessionId, title) {
    const rows = registrations.filter((r) => r.session_id === sessionId);
    const header = ["Name", "Email", "Phone", "City", "Role", "Attended", "Waitlisted"];
    const lines = [header.join(",")].concat(
      rows.map((r) => [r.name, r.email, r.phone, r.city, r.role, r.attended ? "yes" : "no", r.waitlisted ? "yes" : "no"]
        .map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-registrants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Panel title={`Registrants by session (${registrations.length} total registrations)`}>
      {sessionsWithRegs.length === 0 && <div className="empty-note">No registrations yet.</div>}
      {sessionsWithRegs.map((s) => {
        const rows = registrations.filter((r) => r.session_id === s.id);
        const confirmed = rows.filter((r) => !r.waitlisted).length;
        const waitlisted = rows.filter((r) => r.waitlisted).length;
        return (
          <div key={s.id} className="proposal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <b>{s.title}</b>
                <div className="hint">{confirmed} confirmed{waitlisted ? `, ${waitlisted} waitlisted` : ""}{s.capacity ? ` · capacity ${s.capacity}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="pill pill-ghost pill-sm" onClick={() => exportCsv(s.id, s.title)}>Export CSV</button>
                <button className="pill pill-ghost pill-sm" onClick={() => setOpenId(openId === s.id ? null : s.id)}>{openId === s.id ? "Collapse" : "Expand"}</button>
              </div>
            </div>
            {openId === s.id && (
              <div style={{ marginTop: 12 }}>
                {rows.map((r) => (
                  <div key={r.id} className="registrant-row">
                    <span className="registrant-name">{r.name}</span>
                    <span className="registrant-meta">{r.email} {r.city ? `· ${r.city}` : ""} {r.role ? `· ${r.role}` : ""}</span>
                    <span className={`check-pill ${r.waitlisted ? "waitlist" : ""}`} onClick={() => toggle(r.id, "waitlisted", !r.waitlisted)}>
                      {r.waitlisted ? "Waitlisted — promote" : "Confirmed"}
                    </span>
                    <span className={`check-pill ${r.attended ? "on" : ""}`} onClick={() => toggle(r.id, "attended", !r.attended)}>
                      {r.attended ? "Attended ✓" : "Mark attended"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}
