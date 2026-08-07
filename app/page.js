import db from "@/lib/db";
import SiteNav from "./components/SiteNav";
import ProgramGrid from "./components/ProgramGrid";
import Footer from "./components/Footer";

export const dynamic = "force-dynamic"; // always reflect the latest admin-approved data

export default async function HomePage() {
  const sessions = await db.queryAll(`
    SELECT s.id, s.title, s.brief, s.date, s.time, s.category_id,
           c.name as category_name, c.color as category_color,
           t.id as trainer_id, t.name as trainer_name, t.photo as trainer_photo
    FROM sessions s
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN trainers t ON t.id = s.trainer_id
    WHERE s.status = 'approved'
    ORDER BY s.date ASC
  `);
  const categories = await db.queryAll("SELECT * FROM categories ORDER BY name");
  const { c: trainerCount } = await db.queryOne("SELECT COUNT(*)::int as c FROM trainers WHERE status='approved'");

  return (
    <>
      <SiteNav />
      <div className="hero">
        <img className="hero-logo" src="/logo.png" alt="Vidyam" />
        <span className="eyebrow"><span className="eyebrow-dot"></span>Learn. Simulate. Become.</span>
        <h1 className="hero-title">A learning month for<span className="line2 grad-text">everyone, exactly as you are</span></h1>
        <p className="hero-sub">100% free and open to all — whatever your background, experience level, or stage of learning. One free program at a time, led by trainers and mentors who volunteer their time and craft, with flexible formats and timings so more people can take part. New programs are added every week, so there&apos;s always a fresh place to start.</p>
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

      <div className="value-grid">
        <div className="value-card"><div className="value-icon">🎯</div><h3>Bite-sized, live</h3><p>60–90 minute sessions you can attend after work — no multi-week course commitment.</p></div>
        <div className="value-card"><div className="value-icon">🗂️</div><h3>Register once, join many</h3><p>Pick as many programs as you like in a single form — no repeating your details each time.</p></div>
        <div className="value-card"><div className="value-icon">🧑‍🏫</div><h3>Practitioners, not slides</h3><p>Trainers are working professionals teaching what they actually do, with real profiles you can review.</p></div>
        <div className="value-card"><div className="value-icon">🤝</div><h3>Community, not content</h3><p>Built around peer support and shared learning, not a funnel — everyone&apos;s welcome.</p></div>
      </div>

      <div className="section-head" style={{ marginTop: 12 }}>
        <h2>Upcoming programs</h2>
      </div>
      <ProgramGrid sessions={sessions} categories={categories} />

      <Footer />
    </>
  );
}
