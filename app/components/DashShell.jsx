"use client";

// Shared sidebar-dashboard shell for both the admin Content Manager
// (/console) and the Trainer Dashboard (/trainer/dashboard). Replacing the
// old pill-tab-row layout with a proper sidebar is the structural part of
// the visual overhaul: these two surfaces now read as a real internal tool
// rather than a bolted-on settings page, while the public site keeps its
// established Vidyam brand look untouched.
export default function DashShell({ title, subtitle, navItems, activeId, onSelect, userLabel, onLogout, stats, children }) {
  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <img src="/logo.png" alt="Vidyam" />
          <div>
            <b>{title}</b>
            {subtitle && <span>{subtitle}</span>}
          </div>
        </div>
        <nav className="dash-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeId === item.id ? "active" : ""}
              onClick={() => onSelect(item.id)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
              {typeof item.badge === "number" && item.badge > 0 && <span className="dash-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="dash-sidebar-foot">
          <div className="dash-user">{userLabel}</div>
          <button className="pill pill-ghost pill-sm dash-logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <main className="dash-main">
        {stats && stats.length > 0 && (
          <div className="dash-stat-row">
            {stats.map((s) => (
              <div className="dash-stat-tile" key={s.label}>
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
}
