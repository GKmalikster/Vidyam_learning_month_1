"use client";

import { useState } from "react";
import Link from "next/link";

function formatDate(d) {
  if (!d) return "Date TBC";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProgramGrid({ sessions, categories }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = activeCategory ? sessions.filter((s) => s.category_id === activeCategory) : sessions;

  return (
    <>
      <div className="filter-row">
        <div
          className="filter-chip"
          style={activeCategory === null ? { background: "var(--navy)", color: "#fff", borderColor: "var(--navy)" } : {}}
          onClick={() => setActiveCategory(null)}
        >
          All programs
        </div>
        {categories.map((c) => (
          <div
            key={c.id}
            className="filter-chip"
            style={activeCategory === c.id ? { background: c.color, color: "#fff", borderColor: c.color } : {}}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.name}
          </div>
        ))}
      </div>

      <div className="home-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, marginBottom: 56 }}>
        {filtered.length === 0 && <div className="empty-note">No programs in this category yet — check back soon.</div>}
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/programs/${s.id}`}
            className="program-card"
            style={{ "--cat-color": s.category_color, textDecoration: "none", display: "block", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: "20px 18px", borderTop: `4px solid ${s.category_color || "var(--navy)"}` }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: s.category_color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              {s.category_name || "General"}
            </div>
            <h3 style={{ fontSize: 17, margin: "0 0 10px", color: "var(--navy)" }}>{s.title}</h3>
            <div style={{ fontSize: 13, color: "var(--navy-soft)", marginBottom: 12 }}>
              {formatDate(s.date)} · {s.time || "Time TBC"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
              {s.trainer_photo ? (
                <img src={s.trainer_photo} alt={s.trainer_name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--panel)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                  {initials(s.trainer_name)}
                </span>
              )}
              {s.trainer_name || "Trainer TBC"}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
