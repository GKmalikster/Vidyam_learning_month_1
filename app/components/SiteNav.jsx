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
  const [mobileSigninOpen, setMobileSigninOpen] = useState(false);
  const signinRef = useRef(null);
  const mobileSigninRef = useRef(null);

  // A visitor who already has a valid learner or trainer session cookie
  // gets a direct "My dashboard" link instead of a generic "Sign in" —
  // without this check the nav had no way to tell a returning, already
  // signed-in learner apart from a first-time guest.
  const [session, setSession] = useState(null); // { type: 'learner'|'trainer', name } | null

  useEffect(() => {
    Promise.all([
      fetch("/api/learner-auth/me").then((r) => r.json()).catch(() => ({ learner: null })),
      fetch("/api/trainer-auth/me").then((r) => r.json()).catch(() => ({ trainer: null })),
    ]).then(([learnerBody, trainerBody]) => {
      if (trainerBody.trainer) setSession({ type: "trainer", name: trainerBody.trainer.name });
      else if (learnerBody.learner) setSession({ type: "learner", name: learnerBody.learner.name });
      else setSession(null);
    });
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (signinRef.current && !signinRef.current.contains(e.target)) setSigninOpen(false);
      if (mobileSigninRef.current && !mobileSigninRef.current.contains(e.target)) setMobileSigninOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const dashboardHref = session?.type === "trainer" ? "/trainer/dashboard" : "/learner/dashboard";

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
          {session ? (
            <Link href={dashboardHref} className={pathname === dashboardHref ? "active" : ""}>
              {session.name} · Dashboard
            </Link>
          ) : (
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
          )}
        </div>
      </nav>
      <div className="tabbar">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span className="ic">{item.icon}</span>
            {item.tabLabel || item.label}
          </Link>
        ))}
        {session ? (
          <Link href={dashboardHref} className={pathname === dashboardHref ? "active" : ""}>
            <span className="ic">{session.type === "trainer" ? "🧑‍🏫" : "🎓"}</span>
            Dashboard
          </Link>
        ) : (
          <div className="signin-dropdown mobile-signin" ref={mobileSigninRef}>
            <button type="button" className={mobileSigninOpen ? "active" : ""} onClick={() => setMobileSigninOpen((o) => !o)}>
              <span className="ic">🔑</span>
              Sign in
            </button>
            {mobileSigninOpen && (
              <div className="signin-menu signin-menu-up">
                <Link href="/learner/login" onClick={() => setMobileSigninOpen(false)}>Learner sign in</Link>
                <Link href="/trainer/login" onClick={() => setMobileSigninOpen(false)}>Trainer sign in</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
