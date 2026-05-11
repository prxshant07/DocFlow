"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/upload", label: "Upload", icon: "↑" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/" className="sidebar-logo-mark">
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

        {user && (
          <>
            <span className="nav-label">Account</span>
            <div className="nav-item flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 text-gray-600">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                <div className="text-xs text-gray-500">{user?.full_name || "No name"}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="nav-item flex items-center space-x-2 text-gray-500 hover:text-gray-900"
            >
              <span className="nav-icon">↳</span>
              <span>Logout</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0 · DocFlow</span>
      </div>
    </aside>
  );
}