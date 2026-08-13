"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashShell from "../../components/DashShell";

const NAV = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "mine", label: "My programs", icon: "🗓️" },
  { id: "browse", label: "Browse new programs", icon: "✨" },
  { id: "profile", label: "My profile", icon: "🎓" },
];

async function jsonFetch(url, opts) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

export default function LearnerDashboard() {
  const router = useRouter();
  const [learner, setLearner] = useState(null);
  const [tab, setTab] = useState("overview");
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [me, s, c] = await Promise.all([
      jsonFetch("/api/learner-auth/me"),
      jsonFetch("/api/learner/sessions"),
      jsonFetch("/api/categories"),
    ]);
    if (!me.learner) { router.push("/learner/login"); return; }
    setLearner(me.learner);
    setSessions(s);
    setCategories(c);
    setLoading(false);
  }, [router]);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await fetch("/api/learner-auth/logout", { method: "POST" });
    router.push("/learner/login");
  }

  if (loading || !learner) return <div style={{ padding: 40 }}>Loading…</div>;

  const mine = sessions.filter((s) => s.registered);
  const available = sessions.filter((s) => !s.registered && s.status === "approved");
  const waitlistedCount = mine.filter((s) => s.waitlisted).length;

  return (
    <DashShell
      title="Learner Dashboard"
      subtitle="Vidyam Learning Month"
      navItems={NAV.map((n) => ({ ...n, badge: n.id === "browse" ? available.length : undefined }))}
      activeId={tab}
      onSelect={setTab}
      userLabel={<>Signed in as <b style={{ color: "#fff" }}>{learner.name}</b></>}
      onLogout={logout}
      stats={[
        { label: "Programs joined", value: mine.length },
        { label: "On waitlist", value: waitlistedCount },
        { label: "New programs to explore", value: available.length },
      ]}
    >
      {tab === "overview" && <OverviewTab mine={mine} available={available} setTab={setTab} />}
      {tab === "mine" && <MyProgramsTab mine={mine} />}
      {tab === "browse" && <BrowseTab available={available} refresh={refresh} />}
      {tab === "profile" && <ProfileTab learner={learner} categories={categories} refresh={refresh} />}
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

function OverviewTab({ mine, available, setTab }) {
  return (
    <>
      <Panel title="Your upcoming programs">
        {mine.length === 0 && <div className="empty-note">You haven&apos;t joined any programs yet — browse what&apos;s open below.</div>}
        {mine.map((s) => (
          <div key={s.id} className="proposal-card">
            <div className="proposal-card-head">
              <b>{s.title}</b>
              {s.waitlisted && <span className="badge pending">Waitlisted</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--navy-soft)" }}>{s.category_name} · {s.date || "Date TBC"} {s.time}</div>
          </div>
        ))}
      </Panel>
      {available.length > 0 && (
        <Panel title="New programs since you last joined">
          <p className="hint" style={{ display: "block", marginBottom: 14 }}>{available.length} program{available.length > 1 ? "s" : ""} added since you signed up — no need to fill out the form again.</p>
          <button className="pill pill-primary pill-sm" onClick={() => setTab("browse")}>Browse new programs</button>
        </Panel>
      )}
    </>
  );
}

function MyProgramsTab({ mine }) {
  return (
    <Panel title={`Programs you've joined (${mine.length})`}>
      {mine.length === 0 && <div className="empty-note">You haven&apos;t joined any programs yet.</div>}
      {mine.map((s) => (
        <div key={s.id} className="registrant-row" style={{ padding: "12px 4px" }}>
          <div style={{ minWidth: 220 }}>
            <b style={{ color: "var(--navy)" }}>{s.title}</b>
            <div className="registrant-meta">{s.category_name} · {s.date || "Date TBC"} {s.time}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {s.waitlisted && <span className="check-pill waitlist">Waitlisted</span>}
            {s.attended && <span className="check-pill on">Attended</span>}
            <Link href={`/programs/${s.id}`} className="pill pill-ghost pill-sm">View</Link>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function BrowseTab({ available, refresh }) {
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState({});

  async function join(sessionId) {
    setError("");
    setJoining(sessionId);
    try {
      const result = await jsonFetch("/api/learner/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }),
      });
      setJoined((j) => ({ ...j, [sessionId]: result.waitlisted ? "waitlisted" : "joined" }));
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setJoining(null);
    }
  }

  return (
    <Panel title={`Programs you haven't joined yet (${available.length})`}>
      <p className="hint" style={{ display: "block", marginBottom: 14 }}>Using your saved profile — one click and you&apos;re in, no form to refill.</p>
      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 14 }}>{error}</div>}
      {available.length === 0 && <div className="empty-note">You&apos;re already registered for every open program — nice work.</div>}
      {available.map((s) => (
        <div key={s.id} className="proposal-card">
          <div className="proposal-card-head">
            <b>{s.title}</b>
            {joined[s.id] === "joined" && <span className="badge approved">Joined</span>}
            {joined[s.id] === "waitlisted" && <span className="badge pending">Waitlisted</span>}
          </div>
          <div style={{ fontSize: 13, color: "var(--navy-soft)", marginBottom: 10 }}>{s.category_name} · {s.date || "Date TBC"} {s.time}</div>
          {!joined[s.id] && (
            <button className="pill pill-primary pill-sm" disabled={joining === s.id} onClick={() => join(s.id)}>
              {joining === s.id ? "Joining…" : "Join this program"}
            </button>
          )}
        </div>
      ))}
    </Panel>
  );
}

function ProfileTab({ learner, categories, refresh }) {
  const [form, setForm] = useState({
    phone: learner.phone || "", city: learner.city || "", ageGroup: learner.age_group || "", role: learner.role || "",
    education: learner.education || "", industry: learner.industry || "", experience: learner.experience || "",
    interests: learner.interests || [], linkedin: learner.linkedin || "", format: learner.format || "",
    language: learner.language || "", timePref: learner.time_pref || "", goal: learner.goal || "",
  });
  const [saved, setSaved] = useState(false);

  function toggleInterest(id) {
    setForm((f) => ({ ...f, interests: f.interests.includes(id) ? f.interests.filter((x) => x !== id) : [...f.interests, id] }));
  }

  async function save() {
    await jsonFetch("/api/learner/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaved(true);
    refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Panel title="Your profile">
      <div className="field"><label>Name</label><input value={learner.name} disabled /></div>
      <div className="field"><label>Email</label><input value={learner.email} disabled /></div>
      <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="field"><label>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
      <div className="field">
        <label>Areas you&apos;re interested in</label>
        <div className="chip-row">
          {categories.map((c) => (
            <span key={c.id} className={`chip ${form.interests.includes(c.id) ? "selected" : ""}`} onClick={() => toggleInterest(c.id)}>{c.name}</span>
          ))}
        </div>
      </div>
      <div className="field"><label>LinkedIn</label><input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
      <div className="field">
        <label>Preferred format</label>
        <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
          <option value="">Select</option><option>Online</option><option>In-person</option><option>Either</option>
        </select>
      </div>
      <div className="field"><label>What are you hoping to get out of this?</label><textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></div>
      <button className="pill pill-primary" onClick={save}>Save profile</button>
      {saved && <span style={{ color: "#227722", fontSize: 13, marginLeft: 12 }}>Saved ✓</span>}
    </Panel>
  );
}
