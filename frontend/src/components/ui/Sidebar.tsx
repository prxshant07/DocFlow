"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/upload", label: "Upload", icon: "↑" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/dashboard" className="sidebar-logo-mark">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">DocFlow</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Workspace</span>
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

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0 · DocFlow</span>
      </div>
    </aside>
  );
}
