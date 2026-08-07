import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";

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
            t.id as trainer_id, t.name as trainer_name, t.bio as trainer_bio,
            t.topics as trainer_topics, t.years as trainer_years, t.mode as trainer_mode,
            t.linkedin as trainer_linkedin, t.photo as trainer_photo
     FROM sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     WHERE s.id = $1 AND s.status = 'approved'`,
    [id]
  );

  if (!s) notFound();

  return (
    <>
      <SiteNav />
      <div className="detail-card" style={{ maxWidth: 760, margin: "40px auto", padding: 32, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.category_color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          {s.category_name || "General"}
        </div>
        <h1 style={{ fontSize: 28, color: "var(--navy)", margin: "0 0 14px" }}>{s.title}</h1>
        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 18 }}>
          {formatDate(s.date)} {s.time ? `· ${s.time}` : ""} · <span style={{ color: "var(--orange-deep)" }}>FREE</span>
        </div>
        <p style={{ color: "var(--navy-soft)", lineHeight: 1.7, marginBottom: 28 }}>{s.brief}</p>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22 }}>
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
                <div style={{ fontWeight: 700, color: "var(--navy)" }}>{s.trainer_name}</div>
                <div style={{ fontSize: 13, color: "var(--navy-soft)", margin: "4px 0" }}>{s.trainer_years ? `${s.trainer_years} yrs experience · ` : ""}{s.trainer_mode}</div>
                <p style={{ fontSize: 14, color: "var(--navy-soft)", lineHeight: 1.6 }}>{s.trainer_bio}</p>
                {s.trainer_topics && <div style={{ fontSize: 13, color: "var(--navy-soft)" }}><b>Topics:</b> {s.trainer_topics}</div>}
              </div>
            </div>
          ) : (
            <div className="empty-note">Trainer to be confirmed.</div>
          )}
        </div>

        <div style={{ marginTop: 28 }}>
          <Link href="/join" className="pill pill-grad">Register for this program</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
