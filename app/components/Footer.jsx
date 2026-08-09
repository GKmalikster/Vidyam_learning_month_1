import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "28px 24px", textAlign: "center", color: "var(--navy-soft)", fontSize: 13 }}>
      <div>Vidyam Learning Month — 100% free, community-first, and always growing.</div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        <Link href="/terms" style={{ color: "var(--navy-soft)" }}>Terms &amp; Conditions</Link>
        <Link href="/privacy" style={{ color: "var(--navy-soft)" }}>Privacy Policy</Link>
        <a href="mailto:contactus@gkconsulting.in" style={{ color: "var(--navy-soft)" }}>Contact</a>
      </div>
    </footer>
  );
}
