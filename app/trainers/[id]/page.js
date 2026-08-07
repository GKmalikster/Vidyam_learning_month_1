import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";

export const dynamic = "force-dynamic";

export default async function TrainerProfile({ params }) {
  const { id } = await params;
  const t = await db.queryOne("SELECT * FROM trainers WHERE id = $1 AND status = 'approved'", [id]);
  if (!t) notFound();

  const availability = JSON.parse(t.availability || "[]");
  const sessions = await db.queryAll(
    `SELECT id, title, date, time, status FROM sessions
     WHERE trainer_id = $1 AND status IN ('approved','completed')
     ORDER BY date ASC`,
    [id]
  );
  const upcoming = sessions.filter((s) => s.status === "approved");
  const past = sessions.filter((s) => s.status === "completed");

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="detail-card" style={{ maxWidth: 760, margin: "40px auto", padding: 32 }}>
          <Link href="/trainers" className="back-link">← Back to all trainers</Link>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
            {t.photo ? (
              <img src={t.photo} alt={t.name} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--panel)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "var(--navy-soft)", flexShrink: 0 }}>
                {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 24, margin: "4px 0 4px", color: "var(--navy)" }}>{t.name}</h1>
              <div style={{ fontSize: 13.5, color: "var(--navy-soft)", marginBottom: 8 }}>{t.years ? `${t.years} yrs experience · ` : ""}{t.mode}</div>
              {availability.length > 0 && (
                <div className="chipline">
                  {availability.map((a) => <span key={a} className="mini">{a}</span>)}
                </div>
              )}
            </div>
          </div>

          {t.bio && <p style={{ color: "var(--navy-soft)", lineHeight: 1.7, marginTop: 18 }}>{t.bio}</p>}
          {t.topics && <div style={{ fontSize: 13.5, color: "var(--navy-soft)", marginBottom: 8 }}><b>Topics:</b> {t.topics}</div>}
          {t.linkedin && (
            <div style={{ marginBottom: 18 }}>
              <a href={t.linkedin} target="_blank" rel="noreferrer" className="pill pill-ghost pill-sm">LinkedIn profile</a>
            </div>
          )}

          {upcoming.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px" }}>Upcoming sessions</h3>
              <ul className="resource-list">
                {upcoming.map((s) => (
                  <li key={s.id}>📅 <Link href={`/programs/${s.id}`}>{s.title}</Link> — {s.date} {s.time}</li>
                ))}
              </ul>
            </div>
          )}

          {past.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px" }}>Past sessions</h3>
              <ul className="resource-list">
                {past.map((s) => (
                  <li key={s.id}>✅ <Link href={`/programs/${s.id}`}>{s.title}</Link></li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <Link href="/join" className="pill pill-grad">Join one of their programs</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
