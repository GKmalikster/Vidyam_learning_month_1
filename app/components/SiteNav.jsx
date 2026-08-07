"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Deliberately has NO link to /console anywhere. The Content Manager is a
// separate, unlinked URL — the only way in is knowing it exists and logging
// in. Public visitors have no path to it from this nav, unlike the old
// single-file prototype where the admin section shipped in the same page.
const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/trainers", label: "Trainers", icon: "🧑‍🏫" },
  { href: "/join", label: "Join as learner", icon: "🎓", tabLabel: "Join" },
  { href: "/teach", label: "Become a trainer", icon: "📣", tabLabel: "Teach" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="Vidyam" className="brand-logo" />
          <span>Vidyam</span>
        </Link>
        <div className="navlinks">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="tabbar">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span className="ic">{item.icon}</span>
            {item.tabLabel || item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
