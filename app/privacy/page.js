import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";

export const metadata = { title: "Privacy Policy — Vidyam Learning Month" };

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <div className="detail-card" style={{ maxWidth: 820, margin: "36px auto 56px" }}>
          <h1>Privacy Policy</h1>
          <p style={{ color: "var(--navy-soft)", fontSize: 13, marginBottom: 28 }}>Last updated: August 9, 2026</p>

          <p>
            This Privacy Policy explains how Vidyam Learning Month (&ldquo;Vidyam,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;) collects, uses, shares, and protects your personal data when you register for a session,
            apply to teach, refer someone, or otherwise use our website. It also sets out the rights you have over your
            data under India&apos;s Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;).
          </p>

          <h2>1. Who We Are — the Data Fiduciary</h2>
          <p>
            Vidyam Learning Month is operated by GK Consulting. For the purposes of the DPDP Act, GK Consulting is the
            Data Fiduciary responsible for your personal data collected through this website. You can reach us at{" "}
            <a href="mailto:contactus@gkconsulting.in">contactus@gkconsulting.in</a>.
          </p>

          <h2>2. What Personal Data We Collect</h2>
          <p>We only collect what we need to run Vidyam Learning Month. Depending on how you use the platform, this may include:</p>
          <ul>
            <li>
              <strong>If you register as a learner:</strong> name, email, phone number, city, age group, occupation or
              role, education, industry, experience level, areas of interest, LinkedIn profile, preferred session format
              and language, timing preference, whether you&apos;re a returning learner, your learning goal, how you heard
              about us, and your consent to these Terms.
            </li>
            <li>
              <strong>If you apply to teach:</strong> name, email, years of experience, bio, topics and areas of
              expertise, teaching mode, availability, LinkedIn profile, your motivation for volunteering, an optional
              photo, and a password (stored as a secure one-way hash — we never store or see your actual password).
            </li>
            <li>
              <strong>If you refer a trainer, mentor, or coach:</strong> your name and email, and the referred person&apos;s
              name, contact details, and area of expertise.
            </li>
            <li>
              <strong>If you sign in to a trainer or admin account:</strong> a session cookie that keeps you signed in.
              This cookie is functional only — Vidyam does not use third-party advertising or tracking cookies.
            </li>
            <li>
              <strong>Feedback you choose to submit</strong> after a session, including a rating and optional comments.
            </li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We use your personal data only to:</p>
          <ul>
            <li>Register you for the session(s) you choose and send you confirmation and reminder emails;</li>
            <li>Review and process trainer applications, including referrals;</li>
            <li>Route you to programs and content relevant to your stated interests and goals;</li>
            <li>Share aggregate (never individual) participation summaries with an institution, employer, or community coordinator who brought you in as part of a group, where applicable;</li>
            <li>Operate session waitlists, attendance tracking, and feedback collection;</li>
            <li>Improve Vidyam Learning Month based on how the platform is used.</li>
          </ul>
          <p>We do not sell your personal data, and we do not use it for unrelated marketing without asking you first.</p>

          <h2>4. Our Basis for Processing Your Data</h2>
          <p>
            Under the DPDP Act, we process your personal data on the basis of your consent. You give this consent when
            you tick the consent checkbox on our registration or referral forms, or when you submit a trainer
            application. You may withdraw your consent at any time as described in Section 7 below, though this may mean
            we can no longer keep you registered for an upcoming session.
          </p>

          <h2>5. Who We Share Your Data With</h2>
          <p>
            We do not sell or rent your personal data. We share it only with the following categories of service
            providers, who process it solely on our instructions and only for the purposes described in this policy:
          </p>
          <ul>
            <li>Our email delivery provider, to send session confirmations, reminders, and trainer-approval emails;</li>
            <li>Our database and website hosting providers, to store and serve the platform securely;</li>
            <li>An institution, employer, or community coordinator, but only as an aggregate summary, never your individual record, and only if you joined through that group.</li>
          </ul>
          <p>We do not transfer your personal data outside India except where our hosting or email providers process it as part of their standard infrastructure, under contractual confidentiality obligations.</p>

          <h2>6. How Long We Keep Your Data</h2>
          <p>
            We keep learner and trainer records for as long as needed to run Vidyam Learning Month and maintain a record
            of past programs, or until you ask us to delete it. Referral details for a person who does not go on to
            apply as a trainer are kept only briefly (around 30 days) before being deleted.
          </p>

          <h2>7. Your Rights as a Data Principal</h2>
          <p>Under the DPDP Act, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> a summary of the personal data we hold about you;</li>
            <li><strong>Correct or update</strong> inaccurate or incomplete personal data;</li>
            <li><strong>Erase</strong> your personal data once it is no longer needed for the purpose it was collected, subject to any legal retention requirements;</li>
            <li><strong>Withdraw consent</strong> at any time, as easily as you gave it;</li>
            <li><strong>Nominate</strong> another individual to exercise these rights on your behalf in the event of your death or incapacity;</li>
            <li><strong>Grievance redressal</strong> — raise a complaint about how your data has been handled, as described below.</li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a href="mailto:contactus@gkconsulting.in">contactus@gkconsulting.in</a> from the email address you registered
            with. We aim to respond within 7 business days.
          </p>

          <h2>8. Children&apos;s Data</h2>
          <p>
            If you are under 18, a parent or legal guardian must register or apply on your behalf, or provide their
            consent for you to do so. We do not knowingly collect personal data from a child without such consent, and
            we will delete any such data if we become aware it was collected without it.
          </p>

          <h2>9. How We Protect Your Data</h2>
          <p>
            We use reasonable technical and organizational measures to protect your personal data, including encrypted
            connections (HTTPS), one-way password hashing for account credentials, and access-controlled admin systems.
            No method of transmission or storage is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2>10. Grievance Officer</h2>
          <p>
            For any grievance regarding the processing of your personal data, please contact:
            <br />
            <strong>Vidyam Learning Month Team</strong>
            <br />
            Email: <a href="mailto:contactus@gkconsulting.in">contactus@gkconsulting.in</a>
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy as Vidyam grows or as data protection requirements evolve. We will post
            the updated policy here with a new &ldquo;Last updated&rdquo; date.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            For anything else about this policy or our <Link href="/terms">Terms &amp; Conditions</Link>, write to{" "}
            <a href="mailto:contactus@gkconsulting.in">contactus@gkconsulting.in</a>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
