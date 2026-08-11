import Link from "next/link";
import db from "@/lib/db";
import SiteNav from "./components/SiteNav";
import ProgramGrid from "./components/ProgramGrid";
import Footer from "./components/Footer";

export const dynamic = "force-dynamic"; // always reflect the latest admin-approved data

export default async function HomePage() {
  const sessions = await db.queryAll(`
    SELECT s.id, s.title, s.brief, s.date, s.time, s.category_id, s.capacity,
           c.name as category_name, c.color as category_color,
           t.id as trainer_id, t.name as trainer_name, t.photo as trainer_photo,
           (SELECT COUNT(*)::int FROM registrations r WHERE r.session_id = s.id AND r.waitlisted = false) as registered_count
    FROM sessions s
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN trainers t ON t.id = s.trainer_id
    WHERE s.status = 'approved'
    ORDER BY s.date ASC
  `);
  const categories = await db.queryAll("SELECT * FROM categories ORDER BY name");
  const { c: trainerCount } = await db.queryOne("SELECT COUNT(*)::int as c FROM trainers WHERE status='approved'");

  const courses = await db.queryAll(`
    SELECT co.*, c.color as category_color FROM courses co
    LEFT JOIN categories c ON c.id = co.category_id
    WHERE co.status = 'published' ORDER BY co.created_at DESC
  `);
  const courseSessions = await db.queryAll(`
    SELECT id, title, date, time, course_id, course_order FROM sessions
    WHERE course_id IS NOT NULL AND status IN ('approved','completed')
    ORDER BY course_order ASC
  `);

  const past = await db.queryAll(`
    SELECT s.id, s.title, s.date, s.recording_url, c.name as category_name, c.color as category_color
    FROM sessions s LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'completed' ORDER BY s.date DESC LIMIT 6
  `);

  const trainers = await db.queryAll(
    "SELECT id, name, photo, years, mode, bio FROM trainers WHERE status='approved' ORDER BY created_at DESC LIMIT 8"
  );

  return (
    <>
      <SiteNav />
      <div className="hero">
        <img className="hero-logo" src="/logo.png" alt="Vidyam" />
        <span className="eyebrow"><span className="eyebrow-dot"></span>Learn. Simulate. Become.</span>
        <h1 className="hero-title">A world of learning,<span className="line2 grad-text">for everyone</span></h1>
        <p className="hero-sub">Vidyam is a free learning initiative for everyone, no matter your background, experience, or where you are in your learning journey. Our trainers and mentors generously volunteer their time and expertise, offering programs in flexible formats and at convenient timings so more people can participate. With new programs added every week, there is always something new to explore, and no better time to begin than now.</p>
        <div className="hero-ctas">
          <a className="pill pill-grad" href="/join">Join a program</a>
          <a className="pill pill-ghost" href="/teach">Become a trainer / mentor</a>
        </div>
        <div className="statrow">
          <div className="stat"><b>{sessions.length}</b><span>live programs &amp; counting</span></div>
          <div className="stat"><b>{trainerCount}</b><span>trainers &amp; mentors onboarded</span></div>
          <div className="stat"><b>FREE</b><span>to join</span></div>
        </div>
      </div>

      <div className="wrap">
        <div className="value-grid">
          <div className="value-card"><div className="value-icon">🎯</div><h3>Bite-sized, live</h3><p>Each session runs 60–90 minutes and can be attended after work, with no multi-week course commitment required.</p></div>
          <div className="value-card"><div className="value-icon">🗂️</div><h3>Register once, join many</h3><p>Please select as many programs as you would like in a single form, without needing to repeat your details each time.</p></div>
          <div className="value-card"><div className="value-icon">🧑‍🏫</div><h3>Practitioners, not slides</h3><p>Our trainers are working professionals teaching what they do in practice, and each has a profile you are welcome to review.</p></div>
          <div className="value-card"><div className="value-icon">🤝</div><h3>Community, not content</h3><p>Designed around peer support and shared learning rather than a sales funnel — everyone is welcome to take part.</p></div>
        </div>

        {courses.map((course) => {
          const steps = courseSessions.filter((s) => s.course_id === course.id);
          return (
            <div className="course-band" key={course.id} style={{ "--cat-color": course.category_color }}>
              <div className="course-eyebrow">Multi-part course</div>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="course-steps">
                {steps.map((s, i) => (
                  <Link key={s.id} href={`/programs/${s.id}`} className="course-step" style={{ textDecoration: "none", color: "inherit" }}>
                    <span className="course-step-num">{i + 1}</span>
                    <span><b>{s.title}</b><br />{s.date || "Date TBC"}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div className="section-head" style={{ marginTop: 12 }}>
          <h2>Upcoming programs</h2>
        </div>
        <ProgramGrid sessions={sessions} categories={categories} />

        {trainers.length > 0 && (
          <>
            <div className="section-head">
              <h2>Meet your trainers</h2>
              <Link href="/trainers" className="pill pill-ghost pill-sm">See all trainers</Link>
            </div>
            <p className="section-sub">Working professionals who generously volunteer their time and expertise to teach what they do in practice.</p>
            <div className="trainer-mini-grid">
              {trainers.map((t) => (
                <Link key={t.id} href={`/trainers/${t.id}`} className="trainer-mini-card">
                  <div className="trainer-mini-avatar">
                    {t.photo ? (
                      <img src={t.photo} alt={t.name} />
                    ) : (
                      <span>{t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                    )}
                  </div>
                  <h4>{t.name}</h4>
                  <div className="role">{t.years ? `${t.years} yrs · ` : ""}{t.mode}</div>
                  {t.bio && <p className="trainer-mini-bio">{t.bio}</p>}
                </Link>
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <div className="section-head">
              <h2>Past programs</h2>
            </div>
            <p className="section-sub">If you were unable to join a session live, recordings and materials remain available here.</p>
            <div className="grid" style={{ marginBottom: 56 }}>
              {past.map((s) => (
                <Link key={s.id} href={`/programs/${s.id}`} className="card" style={{ "--cat-color": s.category_color, textDecoration: "none" }}>
                  <span className="tag">{s.category_name || "General"}</span>
                  <h3>{s.title}</h3>
                  <div className="meta">{s.date}</div>
                  <div className="meta" style={{ marginTop: 8, color: s.recording_url ? "var(--blue)" : "var(--navy-soft)" }}>
                    {s.recording_url ? "▶ Recording available" : "Materials available"}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
