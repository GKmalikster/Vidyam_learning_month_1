"use client";

import { useState, useRef, useEffect } from "react";
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
  { href: "/partner", label: "Partner with us", icon: "🤝", tabLabel: "Partner" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [signinOpen, setSigninOpen] = useState(false);
  const signinRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (signinRef.current && !signinRef.current.contains(e.target)) setSigninOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
          <div className="signin-dropdown" ref={signinRef}>
            <button type="button" className={signinOpen ? "active" : ""} onClick={() => setSigninOpen((o) => !o)}>
              Sign in ▾
            </button>
            {signinOpen && (
              <div className="signin-menu">
                <Link href="/learner/login" onClick={() => setSigninOpen(false)}>Learner sign in</Link>
                <Link href="/trainer/login" onClick={() => setSigninOpen(false)}>Trainer sign in</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="tabbar">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span className="ic">{item.icon}</span>
            {item.tabLabel || item.label}
          </Link>
        ))}
        <Link href="/learner/login" className={pathname === "/learner/login" ? "active" : ""}>
          <span className="ic">🔑</span>
          Sign in
        </Link>
      </div>
    </>
  );
}
