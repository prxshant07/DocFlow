"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { useAuth } from "@/lib/auth-context";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",

    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <rect
          x="1"
          y="1"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />

        <rect
          x="9"
          y="1"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />

        <rect
          x="1"
          y="9"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />

        <rect
          x="9"
          y="9"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    ),
  },

  {
    href: "/upload",
    label: "Upload",

    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M8 11V3M8 3L5 6M8 3L11 6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M2 13h12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

// Logo
function LogoMark() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* glow */}
      <defs>
        <filter
          id="glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation="2.8"
            result="coloredBlur"
          />

          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* bg */}
      <rect
        width="34"
        height="34"
        rx="10"
        fill="#646cff"
        fillOpacity="0.10"
      />

      <rect
        width="34"
        height="34"
        rx="10"
        stroke="#646cff"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* doc stack */}
      <rect
        x="9"
        y="7"
        width="13"
        height="16"
        rx="2"
        fill="none"
        stroke="#646cff"
        strokeWidth="1.5"
      />

      <rect
        x="12"
        y="10"
        width="14"
        height="16"
        rx="2"
        fill="#0e0e1a"
        stroke="#646cff"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* lines */}
      <line
        x1="14"
        y1="14"
        x2="20"
        y2="14"
        stroke="#646cff"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      <line
        x1="14"
        y1="17"
        x2="22"
        y2="17"
        stroke="#646cff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      <line
        x1="14"
        y1="20"
        x2="19"
        y2="20"
        stroke="#646cff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />

      {/* status */}
      <circle
        cx="25"
        cy="25"
        r="5"
        fill="#646cff"
        filter="url(#glow)"
      />

      <path
        d="M23 25l1.5 1.5L27 23.5"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
    >
      <path
        d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-3-3-3M13 7.5H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const { user, logout } =
    useAuth();

  return (
    <aside
      className="sidebar"
      style={{
        position: "relative",
        overflow: "hidden",

        background:
          "linear-gradient(180deg, rgba(12,12,22,0.92), rgba(10,10,18,0.94))",

        backdropFilter: "blur(22px)",

        borderRight:
          "1px solid rgba(255,255,255,0.06)",

        boxShadow:
          "0 0 40px rgba(0,0,0,0.28)",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "220px",
          height: "220px",
          borderRadius: "999px",
          background:
            "rgba(100,108,255,0.10)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* Inner */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Logo */}
        <div
          className="sidebar-logo"
          style={{
            paddingBottom: "1.2rem",
            borderBottom:
              "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Link
            href="/"
            className="sidebar-logo-mark"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
              textDecoration: "none",
            }}
          >
            <motion.div
              whileHover={{
                rotate: -3,
                scale: 1.04,
              }}
              transition={{
                duration: 0.2,
              }}
              className="logo-svg-wrap"
              style={{
                position: "relative",
              }}
            >
              <div
                style={{
                  position:
                    "absolute",
                  inset: "-8px",
                  borderRadius:
                    "18px",
                  background:
                    "rgba(100,108,255,0.12)",
                  filter:
                    "blur(18px)",
                }}
              />

              <div
                style={{
                  position:
                    "relative",
                }}
              >
                <LogoMark />
              </div>
            </motion.div>

            <div>
              <div
                className="logo-text"
                style={{
                  fontFamily:
                    "var(--font-display)",
                  fontSize:
                    "1.2rem",
                  fontWeight: 800,
                  letterSpacing:
                    "-0.04em",
                  color: "#f3f4ff",
                }}
              >
                DocFlow
              </div>

              <div
                className="logo-sub"
                style={{
                  color:
                    "#8b93ff",
                  fontSize:
                    "0.7rem",
                  letterSpacing:
                    "0.14em",
                  textTransform:
                    "uppercase",
                  fontFamily:
                    "var(--font-mono)",
                }}
              >
                AI Workspace
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav
          className="sidebar-nav"
          style={{
            marginTop: "1.5rem",
            flex: 1,
          }}
        >
          <span
            className="nav-section-label"
            style={{
              color:
                "var(--text-muted)",
              fontSize: "0.68rem",
              letterSpacing:
                "0.14em",
              textTransform:
                "uppercase",
              marginBottom:
                "0.9rem",
              display: "block",
              paddingInline:
                "0.3rem",
            }}
          >
            Workspace
          </span>

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: "0.35rem",
            }}
          >
            {navItems.map((item) => {
              const active =
                pathname.startsWith(
                  item.href
                );

              return (
                <motion.div
                  key={item.href}
                  whileHover={{
                    x: 2,
                  }}
                  whileTap={{
                    scale: 0.99,
                  }}
                >
                  <Link
                    href={item.href}
                    className={`nav-item ${
                      active
                        ? "active"
                        : ""
                    }`}
                    style={{
                      position:
                        "relative",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap: "0.8rem",

                      padding:
                        "0.9rem 1rem",

                      borderRadius:
                        "16px",

                      textDecoration:
                        "none",

                      overflow:
                        "hidden",

                      background:
                        active
                          ? "linear-gradient(135deg, rgba(100,108,255,0.18), rgba(168,85,247,0.10))"
                          : "transparent",

                      border: active
                        ? "1px solid rgba(100,108,255,0.20)"
                        : "1px solid transparent",

                      color: active
                        ? "#f3f4ff"
                        : "var(--text-secondary)",

                      transition:
                        "all 0.22s ease",
                    }}
                  >
                    {/* glow */}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        style={{
                          position:
                            "absolute",
                          inset: 0,
                          borderRadius:
                            "16px",
                          background:
                            "linear-gradient(135deg, rgba(100,108,255,0.08), transparent)",
                          pointerEvents:
                            "none",
                        }}
                      />
                    )}

                    {/* active line */}
                    {active && (
                      <div
                        style={{
                          position:
                            "absolute",
                          left: 0,
                          top: "18%",
                          bottom:
                            "18%",
                          width: "3px",
                          borderRadius:
                            "999px",
                          background:
                            "linear-gradient(180deg, #646cff, #8b5cf6)",
                          boxShadow:
                            "0 0 14px rgba(100,108,255,0.55)",
                        }}
                      />
                    )}

                    <span
                      className="nav-icon"
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",

                        width: "34px",
                        height:
                          "34px",

                        borderRadius:
                          "12px",

                        background:
                          active
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0.02)",

                        border:
                          "1px solid rgba(255,255,255,0.04)",

                        color: active
                          ? "#cfd3ff"
                          : "var(--text-muted)",

                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>

                    <span
                      style={{
                        position:
                          "relative",
                        zIndex: 2,
                        fontWeight: active
                          ? 700
                          : 500,
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        {user && (
          <div
            className="sidebar-user"
            style={{
              marginTop: "auto",
              paddingTop: "1.2rem",
              borderTop:
                "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* User card */}
            <motion.div
              whileHover={{
                y: -2,
              }}
              className="user-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",

                padding:
                  "0.9rem",

                borderRadius:
                  "18px",

                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",

                border:
                  "1px solid rgba(255,255,255,0.06)",

                backdropFilter:
                  "blur(12px)",

                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.16)",
              }}
            >
              {/* Avatar */}
              <div
                className="user-avatar"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius:
                    "14px",

                  background:
                    "linear-gradient(135deg, #646cff 0%, #8b5cf6 100%)",

                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",

                  fontWeight: 700,
                  color: "#fff",

                  boxShadow:
                    "0 0 24px rgba(100,108,255,0.28)",

                  flexShrink: 0,
                }}
              >
                {user.email?.[0]?.toUpperCase() ??
                  "?"}
              </div>

              {/* Info */}
              <div
                className="user-info"
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  className="user-name"
                  style={{
                    fontSize:
                      "0.84rem",
                    color:
                      "#f3f4ff",
                    fontWeight: 600,
                    marginBottom:
                      "0.15rem",
                  }}
                >
                  {user.full_name ||
                    "User"}
                </div>

                <div
                  className="user-email truncate"
                  style={{
                    fontSize:
                      "0.72rem",
                    color:
                      "var(--text-muted)",
                    fontFamily:
                      "var(--font-mono)",
                  }}
                >
                  {user.email}
                </div>
              </div>
            </motion.div>

            {/* Logout */}
            <motion.button
              whileHover={{
                x: 2,
              }}
              whileTap={{
                scale: 0.99,
              }}
              onClick={logout}
              className="nav-item"
              style={{
                marginTop: "0.7rem",

                width: "100%",

                display: "flex",
                alignItems:
                  "center",
                gap: "0.8rem",

                padding:
                  "0.85rem 1rem",

                borderRadius:
                  "16px",

                background:
                  "transparent",

                border:
                  "1px solid rgba(255,255,255,0.05)",

                color:
                  "var(--text-secondary)",

                cursor: "pointer",

                transition:
                  "all 0.2s ease",
              }}
            >
              <span
                className="nav-icon"
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",

                  width: "34px",
                  height: "34px",

                  borderRadius:
                    "12px",

                  background:
                    "rgba(255,255,255,0.03)",

                  border:
                    "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <LogoutIcon />
              </span>

              Sign out
            </motion.button>

            {/* Footer */}
            <div
              className="sidebar-version"
              style={{
                marginTop: "1rem",
                textAlign: "center",
                fontSize: "0.68rem",
                color:
                  "var(--text-muted)",
                fontFamily:
                  "var(--font-mono)",
                letterSpacing:
                  "0.08em",
              }}
            >
              DOCFLOW v1.0.0
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}