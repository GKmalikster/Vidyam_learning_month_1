import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";

export const metadata = { title: "Terms & Conditions — Vidyam Learning Month" };

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="detail-card" style={{ maxWidth: 820, margin: "36px auto 56px" }}>
          <h1>Terms &amp; Conditions</h1>
          <p style={{ color: "var(--navy-soft)", fontSize: 13, marginBottom: 28 }}>Last updated: August 9, 2026</p>

          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of Vidyam Learning Month, including our
            website, session registrations, trainer applications, and related communications (together, &ldquo;Vidyam&rdquo;
            or &ldquo;the platform&rdquo;). By registering for a session, applying to teach, or otherwise using Vidyam, you
            agree to these Terms. If you do not agree, please do not use the platform.
          </p>

          <h2>1. About Vidyam Learning Month</h2>
          <p>
            Vidyam Learning Month is a free, community-led learning initiative. Sessions are led by volunteer trainers and
            mentors who donate their time; Vidyam does not charge learners or trainers for participation, and no part of
            the platform requires payment to access.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            Vidyam is open to anyone who wants to learn or teach, regardless of background or prior experience. If you are
            under 18 years of age, you may only register or apply with the involvement and consent of a parent or legal
            guardian, who is responsible for your participation.
          </p>

          <h2>3. Registration &amp; Accounts</h2>
          <p>
            Learners register per session through the public Join form; this does not create a persistent account.
            Approved trainers and platform administrators sign in through a password-protected account. You are
            responsible for keeping any login credentials confidential and for all activity under your account. Notify us
            immediately if you suspect unauthorized use.
          </p>

          <h2>4. Free of Cost</h2>
          <p>
            Participation in Vidyam Learning Month sessions is, and will remain, 100% free to learners. No learner is ever
            required to pay, and no organization or individual can purchase priority access, a guaranteed session slot, or
            a trainer placement — including when a learner is brought in through an institution, employer, or community
            partner.
          </p>

          <h2>5. Volunteer Trainers &amp; Mentors</h2>
          <p>
            Trainers and mentors on Vidyam are independent volunteers, not employees, agents, or representatives of
            Vidyam. Sessions reflect the views and expertise of the individual trainer, not Vidyam. We review trainer
            applications in good faith but do not guarantee the accuracy, completeness, or outcome of any session, advice,
            or content shared by a trainer.
          </p>

          <h2>6. Community Conduct</h2>
          <p>You agree to treat other learners, trainers, and Vidyam team members with respect. In particular, you will not:</p>
          <ul>
            <li>Harass, discriminate against, or abuse any participant;</li>
            <li>Share another person&apos;s contact details or session recordings without their consent;</li>
            <li>Disrupt a session or misuse it for unrelated advertising or solicitation;</li>
            <li>Misrepresent your identity, qualifications, or affiliation when registering or applying to teach.</li>
          </ul>
          <p>
            We may decline an application, remove a participant from a session, or restrict access to the platform if
            these Terms or our community expectations are not met.
          </p>

          <h2>7. Session Materials &amp; Recordings</h2>
          <p>
            Trainers retain ownership of the materials and content they create for their sessions, and grant Vidyam a
            non-exclusive license to host and share that content with session registrants through the platform. Some
            sessions may be recorded and made available to registrants; by joining such a session, you consent to being
            included in that recording. Please do not redistribute session materials or recordings outside the platform
            without the trainer&apos;s permission.
          </p>

          <h2>8. Referrals</h2>
          <p>
            If you refer someone as a potential trainer, mentor, or coach, you confirm that you have their permission to
            share their contact details with us for the sole purpose of inviting them to apply. Vidyam will not add a
            referred person to any mailing list or create a trainer record without their own consent and application.
          </p>

          <h2>9. No Professional Advice</h2>
          <p>
            Vidyam sessions are educational and informational in nature. Nothing shared in a session — including on
            topics like careers, finance, wellness, or technology — constitutes professional, financial, medical, or
            legal advice. You should seek advice from a qualified professional before making decisions based on anything
            discussed in a session.
          </p>

          <h2>10. Third-Party Services</h2>
          <p>
            Vidyam uses trusted third-party service providers to operate the platform, including for website hosting,
            database storage, and sending session-related emails. These providers act only on our instructions and only
            for the purposes described in our{" "}
            <Link href="/privacy">Privacy Policy</Link>. We are not responsible for the content or practices of any
            external website or service you may reach through a link shared in a session.
          </p>

          <h2>11. Disclaimer &amp; Limitation of Liability</h2>
          <p>
            Vidyam is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any
            kind, express or implied. To the fullest extent permitted by law, Vidyam and its volunteers, trainers, and
            team members will not be liable for any indirect, incidental, or consequential loss arising from your use of
            the platform or participation in a session.
          </p>

          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time as Vidyam grows. We will post the updated Terms here with a new
            &ldquo;Last updated&rdquo; date. Continued use of the platform after an update means you accept the revised
            Terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India, and any disputes will be subject to the exclusive jurisdiction
            of the competent courts in India.
          </p>

          <h2>14. Contact Us</h2>
          <p>
            Questions about these Terms can be sent to{" "}
            <a href="mailto:contactus@gkconsulting.in">contactus@gkconsulting.in</a>. For how we handle your personal
            data, see our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
