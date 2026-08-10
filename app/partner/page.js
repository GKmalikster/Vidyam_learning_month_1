import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import PartnerForm from "../components/PartnerForm";

export const metadata = { title: "Partner With Us — Vidyam Learning Month" };

export default function PartnerPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="section-head" style={{ marginTop: 32 }}><h2>Partner with us</h2></div>
        <p className="section-sub" style={{ textAlign: "center", color: "var(--navy-soft)", marginBottom: 28 }}>
          Partnering with us extends well beyond referring learners — it is about building the ecosystem around Vidyam
          together, whether as a trainer bench, an institution, a company, a community, or in whichever capacity best suits you.
        </p>
        <PartnerForm />
      </div>
      <Footer />
    </>
  );
}
