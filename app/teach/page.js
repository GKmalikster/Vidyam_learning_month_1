import db from "@/lib/db";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import TeachForm from "../components/TeachForm";

export const dynamic = "force-dynamic";

export default async function TeachPage() {
  const categories = await db.queryAll("SELECT * FROM categories ORDER BY name");
  return (
    <>
      <SiteNav />
      <div className="section-head" style={{ marginTop: 32 }}><h2>Become a trainer or mentor</h2></div>
      <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28 }}>
        Share your expertise with the community — even one session makes a difference.
      </p>
      <TeachForm categories={categories} />
      <Footer />
    </>
  );
}
