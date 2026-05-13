"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    href: "/upload",
    label: "Upload",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 11V3M8 3L5 6M8 3L11 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 13h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// DocFlow SVG logo mark
function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background rect */}
      <rect width="34" height="34" rx="8" fill="#646cff" fillOpacity="0.12"/>
      <rect width="34" height="34" rx="8" stroke="#646cff" strokeOpacity="0.35" strokeWidth="1"/>
      {/* Document stack */}
      <rect x="9" y="7" width="13" height="16" rx="2" fill="none" stroke="#646cff" strokeWidth="1.5"/>
      <rect x="12" y="10" width="14" height="16" rx="2" fill="#0e0e1a" stroke="#646cff" strokeWidth="1.5" strokeOpacity="0.5"/>
      {/* Lines on doc */}
      <line x1="14" y1="14" x2="20" y2="14" stroke="#646cff" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.9"/>
      <line x1="14" y1="17" x2="22" y2="17" stroke="#646cff" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6"/>
      <line x1="14" y1="20" x2="19" y2="20" stroke="#646cff" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4"/>
      {/* Arrow/flow indicator */}
      <circle cx="25" cy="25" r="5" fill="#646cff"/>
      <path d="M23 25l1.5 1.5L27 23.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-3-3-3M13 7.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/" className="sidebar-logo-mark">
          <div className="logo-svg-wrap">
            <LogoMark />
          </div>
          <div>
            <div className="logo-text">DocFlow</div>
            <div className="logo-sub">AI · Extract</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Workspace</span>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      {user && (
        <div className="sidebar-user">
          <div className="user-card">
            <div className="user-avatar">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="user-info">
              <div className="user-email">{user.email}</div>
              <div className="user-name">{user.full_name || "User"}</div>
            </div>
          </div>
          <button onClick={logout} className="nav-item" style={{ marginTop: "0.15rem" }}>
            <span className="nav-icon"><LogoutIcon /></span>
            Sign out
          </button>
          <div className="sidebar-version">DocFlow v1.0.0</div>
        </div>
      )}
    </aside>
  );
}