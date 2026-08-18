"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STEP_HINTS = {
  1: "How are you joining us?",
  2: "Pick your programs",
  3: "A little more, so trainers understand their audience",
};

const PROFILE_TYPES = [
  { id: "individual", label: "Just me" },
  { id: "institution", label: "A school, college, or institution" },
  { id: "corporate", label: "A company" },
  { id: "incubator", label: "An incubator / startup ecosystem" },
  { id: "community", label: "A community group / nonprofit" },
  { id: "other", label: "Something else" },
];

const CORPORATE_MODES = [
  "Employees as learners",
  "Employees as trainers",
  "CSR sponsorship",
];

// Org-name/role copy tailored per profile type — a generic "institution /
// company / group" label read oddly for e.g. incubators, and a shared
// placeholder list ("Coordinator, Faculty, Student, Employee") didn't fit
// any of them well.
const PROFILE_ORG_FIELDS = {
  institution: { orgLabel: "Name of your school / college / institution", rolePlaceholder: "e.g. Coordinator, Faculty, Student" },
  corporate: { orgLabel: "Name of your company", rolePlaceholder: "e.g. L&D Manager, HR, Employee" },
  incubator: { orgLabel: "Name of your incubator / accelerator", rolePlaceholder: "e.g. Program Manager, Mentor, Founder-in-Residence" },
  community: { orgLabel: "Name of your community group / nonprofit", rolePlaceholder: "e.g. Volunteer, Organizer, Member" },
  other: { orgLabel: "Organization / group name", rolePlaceholder: "e.g. your role in the group" },
};

export default function JoinForm({ sessions, categories }) {
  const searchParams = useSearchParams();
  const preselectId = Number(searchParams.get("session")) || null;
  const preselectSession = preselectId ? sessions.find((s) => s.id === preselectId) : null;

  const [step, setStep] = useState(1);
  const [selectedSessions, setSelectedSessions] = useState(preselectId ? [preselectId] : []);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [waitlistedFor, setWaitlistedFor] = useState([]);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [alreadyRegisteredTitles, setAlreadyRegisteredTitles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    name: "", email: "", phone: "", city: "", ageGroup: "", role: "",
    education: "", industry: "", experience: "", linkedin: "", format: "",
    language: "", timePref: "", returning: "", goal: "", source: "", consent: false,
    profileType: "individual", orgName: "", orgRole: "", orgDetail: "",
  });
  const [corporateModes, setCorporateModes] = useState([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);

  // Detects an existing learner session so a returning, signed-in learner
  // is offered the one-click path instead of only the full guest form —
  // the form below still works as a fallback (e.g. registering someone
  // else), it just isn't the first thing they see.
  const [learner, setLearner] = useState(null); // undefined-ish until checked; null = not signed in
  const [instantState, setInstantState] = useState("idle"); // idle | joining | joined | waitlisted | already | error
  const [instantError, setInstantError] = useState("");

  useEffect(() => {
    fetch("/api/learner-auth/me")
      .then((r) => r.json())
      .then((body) => setLearner(body.learner || null))
      .catch(() => setLearner(null));
  }, []);

  async function instantJoin() {
    if (!preselectId) return;
    setInstantState("joining");
    setInstantError("");
    try {
      const res = await fetch("/api/learner/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: preselectId }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) { setInstantState("already"); return; }
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      setInstantState(body.waitlisted ? "waitlisted" : "joined");
    } catch (e) {
      setInstantState("error");
      setInstantError(e.message);
    }
  }

  function toggleSession(id) {
    setSelectedSessions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleInterest(id) {
    setSelectedInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleCorporateMode(mode) {
    setCorporateModes((prev) => (prev.includes(mode) ? prev.filter((x) => x !== mode) : [...prev, mode]));
  }
  function update(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function goStep(n) {
    if (n === 2 && profile.profileType !== "individual" && !profile.orgName.trim()) {
      setError("Please tell us the name of your organization before continuing.");
      return;
    }
    if (n === 3 && (selectedSessions.length === 0 || !profile.name.trim() || !profile.email.trim())) {
      setError("Please select at least one program and provide your name and email before continuing.");
      return;
    }
    setError("");
    setStep(n);
  }

  async function submit() {
    if (password && password.length > 0) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionIds: selectedSessions, ...profile, interests: selectedInterests, corporateModes, password, confirmPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      const result = await res.json();
      setWaitlistedFor(result.waitlistedFor || []);
      setRegisteredCount((result.registrationIds || []).length);
      setAlreadyRegisteredTitles(
        (result.alreadyRegisteredFor || []).map((id) => sessions.find((s) => s.id === id)?.title).filter(Boolean)
      );
      setAccountCreated(!!result.accountCreated);
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
        <h2>Thank you for registering</h2>
        {registeredCount > 0 && (
          <p style={{ color: "var(--navy-soft)" }}>
            You have been registered for {registeredCount} new program{registeredCount > 1 ? "s" : ""}. We will share the joining details closer to each session.
          </p>
        )}
        {waitlistedFor.length > 0 && (
          <p style={{ color: "var(--orange-deep)", fontWeight: 600 }}>
            {waitlistedFor.length} of these {waitlistedFor.length > 1 ? "have" : "has"} reached full capacity, so you have been added to the waitlist. We will notify you as soon as a spot becomes available.
          </p>
        )}
        {alreadyRegisteredTitles.length > 0 && (
          <p style={{ color: "var(--navy-soft)" }}>
            You were already registered for {alreadyRegisteredTitles.join(", ")} — no new registration was created for {alreadyRegisteredTitles.length > 1 ? "those" : "that"}.
          </p>
        )}
        {registeredCount === 0 && alreadyRegisteredTitles.length === 0 && (
          <p style={{ color: "var(--navy-soft)" }}>Your details have been saved.</p>
        )}
        {accountCreated && (
          <p style={{ color: "var(--navy-soft)" }}>
            Your dashboard is ready — <Link href="/learner/dashboard" style={{ color: "var(--blue)", fontWeight: 600 }}>go to your dashboard</Link> to see your programs and join new ones in one click, without filling out this form again.
          </p>
        )}
      </div>
    );
  }

  if (learner && preselectId && ["joined", "waitlisted", "already"].includes(instantState)) {
    return (
      <div className="form-card" style={{ margin: "0 auto 56px", textAlign: "center" }}>
        <h2>{instantState === "already" ? "You're already registered" : "You're in"}</h2>
        <p style={{ color: "var(--navy-soft)" }}>
          {instantState === "joined" && <>You have been registered for <b>{preselectSession?.title}</b>. We will share the joining details closer to the session.</>}
          {instantState === "waitlisted" && <>This program has reached capacity, so you have been added to the waitlist for <b>{preselectSession?.title}</b>. We will notify you as soon as a spot becomes available.</>}
          {instantState === "already" && <>You were already registered for <b>{preselectSession?.title}</b> — no need to do anything else.</>}
        </p>
        <Link href="/learner/dashboard" className="pill pill-primary">Go to your dashboard</Link>
      </div>
    );
  }

  return (
    <div className="form-card" style={{ margin: "0 auto 56px" }}>
      {learner && (
        <div className="proposal-card" style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 22, background: "var(--panel)" }}>
          <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>Signed in as {learner.name}</div>
          {preselectId && preselectSession ? (
            <>
              <p className="hint" style={{ display: "block", marginBottom: 10 }}>
                Join <b>{preselectSession.title}</b> instantly using your saved profile — no need to fill out the form below.
              </p>
              {instantError && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 10 }}>{instantError}</div>}
              <button className="pill pill-primary pill-sm" disabled={instantState === "joining"} onClick={instantJoin}>
                {instantState === "joining" ? "Joining…" : "Join instantly"}
              </button>
            </>
          ) : (
            <>
              <p className="hint" style={{ display: "block", marginBottom: 10 }}>
                Visit your dashboard to see the programs you have already joined, and join new ones in one click.
              </p>
              <Link href="/learner/dashboard" className="pill pill-primary pill-sm">Go to your dashboard</Link>
            </>
          )}
          <p className="hint" style={{ display: "block", marginTop: 10 }}>Registering someone else, or with different details? You can still use the form below.</p>
        </div>
      )}
      <div className="wizard-progress-label">
        <span>Step {step} of 3</span>
        <span>{STEP_HINTS[step]}</span>
      </div>
      <div className="wizard-progress">
        <div className="wizard-progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {error && <div className="empty-note" style={{ borderColor: "#e0554a", color: "#c0392b", marginBottom: 18 }}>{error}</div>}

      {step === 1 && (
        <div className="wizard-step active">
          <div className="field">
            <label>How are you joining us?</label>
            <div className="chip-row">
              {PROFILE_TYPES.map((p) => (
                <div key={p.id} className={`chip ${profile.profileType === p.id ? "selected" : ""}`} onClick={() => update("profileType", p.id)}>
                  {p.label}
                </div>
              ))}
            </div>
            <p className="hint" style={{ display: "block", marginTop: 6 }}>
              We ask this at the outset so the remaining questions can be tailored to your profile.
            </p>
          </div>

          {profile.profileType !== "individual" && (
            <div className="proposal-card" style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 18 }}>
              <div className="field">
                <label>{PROFILE_ORG_FIELDS[profile.profileType]?.orgLabel || "Organization / group name"} *</label>
                <input type="text" value={profile.orgName} onChange={(e) => update("orgName", e.target.value)} />
              </div>
              <div className="field">
                <label>Your role there <span className="hint">(optional)</span></label>
                <input type="text" placeholder={PROFILE_ORG_FIELDS[profile.profileType]?.rolePlaceholder} value={profile.orgRole} onChange={(e) => update("orgRole", e.target.value)} />
              </div>
              {profile.profileType === "other" && (
                <div className="field">
                  <label>Please tell us a little about your group</label>
                  <textarea value={profile.orgDetail} onChange={(e) => update("orgDetail", e.target.value)} />
                </div>
              )}
              {profile.profileType === "corporate" && (
                <div className="field">
                  <label>How would your company like to engage? <span className="hint">(select any)</span></label>
                  <div className="chip-row">
                    {CORPORATE_MODES.map((m) => (
                      <div key={m} className={`chip ${corporateModes.includes(m) ? "selected" : ""}`} onClick={() => toggleCorporateMode(m)}>
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="hint" style={{ display: "block", marginTop: 4 }}>
                You are still registering on your own behalf. We will not share your individual details with your
                organization; at most, we may share an aggregate summary, should you wish us to do so.
              </p>
            </div>
          )}

          <div className="wizard-nav">
            <span />
            <button className="pill pill-primary" onClick={() => goStep(2)}>Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step active">
          <div className="field">
            <label>Which programs would you like to join? <span className="hint">(select as many as you like)</span></label>
            <div className="chip-row">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`chip ${selectedSessions.includes(s.id) ? "selected" : ""}`}
                  onClick={() => toggleSession(s.id)}
                >
                  {s.title}
                </div>
              ))}
              {sessions.length === 0 && <div className="empty-note">No programs open for registration yet.</div>}
            </div>
          </div>
          <div className="field">
            <label>Full name *</label>
            <input type="text" value={profile.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Email *</label>
            <input type="email" value={profile.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="proposal-card" style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 18 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Set a password <span className="hint">(optional)</span></label>
            <p className="hint" style={{ display: "block", marginBottom: 12 }}>
              This creates a dashboard where you can see the programs you have joined and register for new ones in one click, without filling out this form again. Leave blank to register as a guest.
            </p>
            <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="field"><label>Confirm password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          </div>
          <div className="field"><label>Phone</label><input type="tel" value={profile.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <div className="field"><label>City</label><input type="text" value={profile.city} onChange={(e) => update("city", e.target.value)} /></div>
          <div className="field">
            <label>Age group</label>
            <select value={profile.ageGroup} onChange={(e) => update("ageGroup", e.target.value)}>
              <option value="">Select</option>
              <option>Under 18</option><option>18–24</option><option>25–34</option><option>35–44</option><option>45+</option>
            </select>
          </div>
          {profile.profileType === "individual" && (
            <div className="field">
              <label>Current role</label>
              <select value={profile.role} onChange={(e) => update("role", e.target.value)}>
                <option value="">Select</option>
                <option>Student</option><option>Early career professional</option><option>Mid-career professional</option>
                <option>Senior professional / leader</option><option>Entrepreneur / founder</option><option>Between roles</option><option>Other</option>
              </select>
            </div>
          )}
          <div className="wizard-nav">
            <button className="pill pill-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="pill pill-primary" onClick={() => goStep(3)}>Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step active">
          <div className="field">
            <label>Areas you&apos;re most interested in</label>
            <div className="chip-row">
              {categories.map((c) => (
                <div key={c.id} className={`chip ${selectedInterests.includes(c.id) ? "selected" : ""}`} onClick={() => toggleInterest(c.id)}>
                  {c.name}
                </div>
              ))}
            </div>
          </div>
          <div className="field"><label>Highest education</label><input type="text" value={profile.education} onChange={(e) => update("education", e.target.value)} /></div>
          <div className="field"><label>Industry</label><input type="text" value={profile.industry} onChange={(e) => update("industry", e.target.value)} /></div>
          <div className="field"><label>Years of experience</label><input type="text" value={profile.experience} onChange={(e) => update("experience", e.target.value)} /></div>
          <div className="field"><label>LinkedIn (optional)</label><input type="text" value={profile.linkedin} onChange={(e) => update("linkedin", e.target.value)} /></div>
          <div className="field">
            <label>Preferred format</label>
            <select value={profile.format} onChange={(e) => update("format", e.target.value)}>
              <option value="">Select</option><option>Online</option><option>In-person</option><option>Either</option>
            </select>
          </div>
          <div className="field">
            <label>Preferred language</label>
            <select value={profile.language} onChange={(e) => update("language", e.target.value)}>
              <option value="">Select</option><option>English</option><option>Hindi</option><option>Other</option>
            </select>
          </div>
          <div className="field">
            <label>Best time to attend</label>
            <select value={profile.timePref} onChange={(e) => update("timePref", e.target.value)}>
              <option value="">Select</option><option>Weekday evenings</option><option>Weekends</option><option>Flexible / either</option>
            </select>
          </div>
          <div className="field">
            <label>Have you joined a Vidyam program before?</label>
            <select value={profile.returning} onChange={(e) => update("returning", e.target.value)}>
              <option value="">Select</option><option>Yes</option><option>No, first time</option>
            </select>
          </div>
          <div className="field"><label>What are you hoping to get out of this?</label><textarea value={profile.goal} onChange={(e) => update("goal", e.target.value)} /></div>
          <div className="field">
            <label>How did you hear about Vidyam?</label>
            <select value={profile.source} onChange={(e) => update("source", e.target.value)}>
              <option value="">Select</option><option>Friend / colleague</option><option>Social media</option><option>Community group</option><option>Trainer / mentor</option><option>Other</option>
            </select>
          </div>
          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
              <input type="checkbox" checked={profile.consent} onChange={(e) => update("consent", e.target.checked)} style={{ width: "auto" }} />
              I agree to be contacted regarding these programs, and confirm that I have read the{" "}
              <Link href="/terms" target="_blank">Terms</Link> &amp; <Link href="/privacy" target="_blank">Privacy Policy</Link>.
            </label>
          </div>
          <div className="wizard-nav">
            <button className="pill pill-ghost" onClick={() => setStep(2)}>Back</button>
            <button className="pill pill-primary" disabled={submitting} onClick={submit}>{submitting ? "Submitting…" : "Complete registration"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
