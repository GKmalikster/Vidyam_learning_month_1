import { Suspense } from "react";
import Link from "next/link";
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
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 32 }}><h2>Become a trainer or mentor</h2></div>
        <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 8 }}>
          We invite you to share your expertise with the community — even a single session can make a meaningful difference.{" "}
          If you know someone who may be a better fit, you are welcome to <Link href="/refer">refer them instead</Link>.
        </p>
        <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28, fontSize: 14 }}>
          Already applied? You may <Link href="/trainer/login">sign in to your trainer dashboard</Link>.
        </p>
        <Suspense fallback={null}>
          <TeachForm categories={categories} />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
