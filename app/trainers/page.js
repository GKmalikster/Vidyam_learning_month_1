import db from "@/lib/db";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const trainers = await db.queryAll("SELECT * FROM trainers WHERE status='approved' ORDER BY name");

  return (
    <>
      <SiteNav />
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>Meet your trainers</h2>
      </div>
      <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28 }}>
        Working professionals who volunteer their time and craft to teach what they actually do.
      </p>
      <div className="trainer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18, marginBottom: 56 }}>
        {trainers.map((t) => (
          <div key={t.id} className="trainer-card" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
            <div className="trainer-photo" style={{ aspectRatio: "4/5", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {t.photo ? (
                <img src={t.photo} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 700, color: "var(--navy-soft)" }}>
                  {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, color: "var(--navy)" }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--navy-soft)", margin: "4px 0 8px" }}>{t.years ? `${t.years} yrs · ` : ""}{t.mode}</div>
              <p style={{ fontSize: 13, color: "var(--navy-soft)", lineHeight: 1.5, margin: 0 }}>{t.bio}</p>
            </div>
          </div>
        ))}
        {trainers.length === 0 && <div className="empty-note">No approved trainers yet.</div>}
      </div>
      <Footer />
    </>
  );
}
