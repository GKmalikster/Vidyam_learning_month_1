import db from "@/lib/db";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import JoinForm from "../components/JoinForm";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const sessions = await db.queryAll(`
    SELECT s.id, s.title, s.category_id, c.color as category_color
    FROM sessions s LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.status = 'approved' ORDER BY s.date ASC
  `);
  const categories = await db.queryAll("SELECT * FROM categories ORDER BY name");

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 32 }}><h2>Join as a learner</h2></div>
        <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28 }}>
          Please select as many free programs as you would like to join, using a single form and profile.
        </p>
        <JoinForm sessions={sessions} categories={categories} />
      </div>
      <Footer />
    </>
  );
}
