import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import FeedbackForm from "../../components/FeedbackForm";

export const dynamic = "force-dynamic";

function formatDate(d) {
  if (!d) return "Date to be confirmed";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function ProgramDetail({ params }) {
  const { id } = await params;
  const s = await db.queryOne(
    `SELECT s.*, c.name as category_name, c.color as category_color,
            co.title as course_title,
            t.id as trainer_id, t.name as trainer_name, t.bio as trainer_bio,
            t.topics as trainer_topics, t.years as trainer_years, t.mode as trainer_mode,
            t.linkedin as trainer_linkedin, t.photo as trainer_photo,
            (SELECT COUNT(*)::int FROM registrations r WHERE r.session_id = s.id AND r.waitlisted = false) as registered_count
     FROM sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN courses co ON co.id = s.course_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     WHERE s.id = $1 AND s.status IN ('approved','completed')`,
    [id]
  );

  if (!s) notFound();

  const materials = await db.queryAll("SELECT id, title, url FROM session_materials WHERE session_id = $1 ORDER BY created_at ASC", [id]);
  const feedback = await db.queryAll("SELECT id, name, rating, comment, created_at FROM session_feedback WHERE session_id = $1 ORDER BY created_at DESC", [id]);
  const avgRating = feedback.length ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : null;
  const isCompleted = s.status === "completed";
  const isFull = s.capacity && s.registered_count >= s.capacity;

  return (
    <>
      <SiteNav />
      <div style={{ maxWidth: 760, margin: "40px auto 0" }}>
        <Link href="/" className="back-link" style={{ display: "inline-block", textDecoration: "none" }}>← All programs</Link>
      </div>
      <div className="detail-card" style={{ maxWidth: 760, margin: "12px auto 40px", padding: 32, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20 }}>
        {s.course_title && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", marginBottom: 8 }}>
            📚 Part of the course: {s.course_title}
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, color: s.category_color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          {s.category_name || "General"} {isCompleted && "· Completed"}
        </div>
        <h1 style={{ fontSize: 28, color: "var(--navy)", margin: "0 0 14px" }}>{s.title}</h1>
        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 18 }}>
          {formatDate(s.date)} {s.time ? `· ${s.time}` : ""} · <span style={{ color: "var(--orange-deep)" }}>FREE</span>
          {avgRating && <span style={{ marginLeft: 12, color: "var(--orange)", fontWeight: 700 }}>★ {avgRating} ({feedback.length})</span>}
        </div>
        {s.capacity && !isCompleted && (
          <div className="hint" style={{ display: "block", marginBottom: 18 }}>
            {isFull ? "This session has reached capacity; new registrations will be added to a waitlist." : `${s.registered_count} of ${s.capacity} spots have been filled.`}
          </div>
        )}
        <p style={{ color: "var(--navy-soft)", lineHeight: 1.7, marginBottom: 28 }}>{s.brief}</p>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginBottom: 22 }}>
          <h3 style={{ margin: "0 0 12px" }}>Your trainer</h3>
          {s.trainer_id ? (
            <div style={{ display: "flex", gap: 16 }}>
              {s.trainer_photo ? (
                <img src={s.trainer_photo} alt={s.trainer_name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                  {s.trainer_name?.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, color: "var(--navy)" }}>
                  <Link href={`/trainers/${s.trainer_id}`} style={{ color: "inherit", textDecoration: "none" }}>{s.trainer_name}</Link>
                </div>
                <div style={{ fontSize: 13, color: "var(--navy-soft)", margin: "4px 0" }}>{s.trainer_years ? `${s.trainer_years} yrs experience · ` : ""}{s.trainer_mode}</div>
                {s.trainer_bio && <p className="trainer-bio-clamp" style={{ fontSize: 14, color: "var(--navy-soft)", lineHeight: 1.6, margin: "0 0 4px" }}>{s.trainer_bio}</p>}
                <Link href={`/trainers/${s.trainer_id}`} className="read-more-link" style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)", textDecoration: "none" }}>Read more →</Link>
                {s.trainer_topics && <div style={{ fontSize: 13, color: "var(--navy-soft)", marginTop: 8 }}><b>Topics:</b> {s.trainer_topics}</div>}
              </div>
            </div>
          ) : (
            <div className="empty-note">Trainer to be confirmed.</div>
          )}
        </div>

        {(materials.length > 0 || s.recording_url) && (
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginBottom: 22 }}>
            <h3 style={{ margin: "0 0 12px" }}>Materials &amp; recording</h3>
            {s.recording_url && (
              <div style={{ marginBottom: 12 }}>
                <a className="pill pill-ghost pill-sm" href={s.recording_url} target="_blank" rel="noreferrer">▶ Watch the recording</a>
              </div>
            )}
            {materials.length > 0 && (
              <ul className="resource-list">
                {materials.map((m) => (
                  <li key={m.id}>📄 <a href={m.url} target="_blank" rel="noreferrer">{m.title}</a></li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginBottom: 22 }}>
          <h3 style={{ margin: "0 0 12px" }}>Feedback {feedback.length > 0 && `(${feedback.length})`}</h3>
          {feedback.length === 0 && <div className="empty-note" style={{ marginBottom: 16 }}>No feedback has been submitted yet. We would welcome yours.</div>}
          {feedback.slice(0, 5).map((f) => (
            <div key={f.id} className="feedback-item">
              <div className="stars-mini">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</div>
              <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 13 }}>{f.name || "Anonymous learner"}</div>
              {f.comment && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--navy-soft)" }}>{f.comment}</p>}
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <FeedbackForm sessionId={s.id} />
          </div>
        </div>

        {!isCompleted && (
          <div style={{ marginTop: 8 }}>
            <Link href={`/join?session=${s.id}`} className="pill pill-grad">{isFull ? "Join the waitlist" : "Register for this program"}</Link>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
