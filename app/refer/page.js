import db from "@/lib/db";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import ReferForm from "../components/ReferForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refer a Trainer, Mentor, or Coach — Vidyam Learning Month" };

export default async function ReferPage() {
  const categories = await db.queryAll("SELECT * FROM categories ORDER BY name");

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 32 }}><h2>Refer a trainer, mentor, or coach</h2></div>
        <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28 }}>
          If you know someone who would be a great fit, we will send them a warm, personal invitation to apply. We never
          conduct cold outreach, and never without your permission.
        </p>
        <ReferForm categories={categories} />
      </div>
      <Footer />
    </>
  );
}
