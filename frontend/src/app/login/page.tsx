"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(100,108,255,0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(168,85,247,0.14), transparent 30%), var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background blobs */}
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "999px",
          background: "rgba(100,108,255,0.18)",
          filter: "blur(100px)",
          top: "-180px",
          left: "-140px",
        }}
      />

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          width: "420px",
          height: "420px",
          borderRadius: "999px",
          background: "rgba(168,85,247,0.14)",
          filter: "blur(90px)",
          bottom: "-140px",
          right: "-100px",
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(circle at center, black 30%, transparent 85%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Glow ring */}
        <div
          style={{
            position: "absolute",
            inset: "-1px",
            borderRadius: "30px",
            background:
              "linear-gradient(135deg, rgba(100,108,255,0.5), rgba(168,85,247,0.35), rgba(56,189,248,0.25))",
            filter: "blur(0px)",
            opacity: 0.9,
          }}
        />

        {/* Main card */}
        <div
          style={{
            position: "relative",
            borderRadius: "30px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(14,14,26,0.82)",
            backdropFilter: "blur(22px)",
            boxShadow:
              "0 10px 60px rgba(0,0,0,0.55), 0 0 80px rgba(100,108,255,0.12)",
          }}
        >
          {/* top accent */}
          <div
            style={{
              height: "4px",
              background:
                "linear-gradient(90deg, #646cff 0%, #8b5cf6 45%, #38bdf8 100%)",
            }}
          />

          <div
            style={{
              padding: "2.4rem",
            }}
          >
            {/* Header */}
            <div
              style={{
                marginBottom: "2rem",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "64px",
                  height: "64px",
                  borderRadius: "22px",
                  background:
                    "linear-gradient(135deg, rgba(100,108,255,0.22), rgba(168,85,247,0.18))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "1.4rem",
                  position: "relative",
                  boxShadow: "0 0 40px rgba(100,108,255,0.18)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "22px",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.12), transparent)",
                  }}
                />

                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#dfe3ff",
                    letterSpacing: "-0.04em",
                  }}
                >
                  D
                </span>
              </motion.div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.55rem",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.55rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#8b93ff",
                    }}
                  >
                    Secure Workspace
                  </span>

                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "999px",
                      background: "#22d46e",
                      boxShadow: "0 0 10px #22d46e",
                    }}
                  />
                </div>

                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2.5rem",
                    lineHeight: 0.95,
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    color: "#f4f5ff",
                  }}
                >
                  Welcome
                  <br />
                  Back
                </h1>

                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.92rem",
                    maxWidth: "320px",
                    lineHeight: 1.7,
                  }}
                >
                  Sign in to continue managing your documents, workflows,
                  uploads, and team operations.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="alert alert-danger"
                style={{
                  marginBottom: "1rem",
                  backdropFilter: "blur(10px)",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Email */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label
                  htmlFor="email"
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Email Address
                </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    style={{
                      height: "52px",
                      paddingLeft: "1rem",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    htmlFor="password"
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#8b93ff",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  style={{
                    height: "52px",
                    paddingLeft: "1rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(8px)",
                  }}
                />
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{
                  scale: 1.015,
                }}
                whileTap={{
                  scale: 0.985,
                }}
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "0.6rem",
                  height: "54px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(135deg, #646cff 0%, #7c5cff 45%, #8b5cf6 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  letterSpacing: "-0.01em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.65rem",
                  cursor: "pointer",
                  boxShadow:
                    "0 10px 30px rgba(100,108,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Access Workspace
                    <span style={{ fontSize: "1rem" }}>→</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div
              style={{
                marginTop: "1.8rem",
                paddingTop: "1.4rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "0.84rem",
              }}
            >
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                style={{
                  color: "#a5adff",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}