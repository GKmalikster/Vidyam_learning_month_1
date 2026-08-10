import Link from "next/link";
import db from "@/lib/db";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const trainers = await db.queryAll("SELECT * FROM trainers WHERE status='approved' ORDER BY name");

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 32 }}>
          <h2>Meet your trainers</h2>
        </div>
        <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28 }}>
          Working professionals who generously volunteer their time and expertise to teach what they do in practice.
        </p>
        <div className="trainer-grid" style={{ marginBottom: 56 }}>
          {trainers.map((t) => (
            <Link key={t.id} href={`/trainers/${t.id}`} className="trainer-card" style={{ textDecoration: "none", display: "block" }}>
              <div className={`trainer-photo ${t.photo ? "trainer-photo-filled" : ""}`}>
                {t.photo ? (
                  <img src={t.photo} alt={t.name} />
                ) : (
                  <span className="ph-icon">🧑‍🏫</span>
                )}
              </div>
              <div className="trainer-info">
                <h4>{t.name}</h4>
                <div className="role">{t.years ? `${t.years} yrs · ` : ""}{t.mode}</div>
                <p style={{ fontSize: 13, color: "var(--navy-soft)", lineHeight: 1.5, margin: "6px 0 0" }}>{t.bio}</p>
              </div>
            </Link>
          ))}
          {trainers.length === 0 && <div className="empty-note">No approved trainers yet.</div>}
        </div>
      </div>
      <Footer />
    </>
  );
}
