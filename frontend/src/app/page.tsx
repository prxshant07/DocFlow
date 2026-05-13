"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",

        background:
          "radial-gradient(circle at top left, rgba(100,108,255,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(168,85,247,0.12), transparent 24%), #080810",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "2rem",
      }}
    >
      {/* Ambient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {/* Main glow */}
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: "-180px",
            left: "-120px",
            width: "520px",
            height: "520px",
            borderRadius: "999px",
            background:
              "rgba(100,108,255,0.14)",
            filter: "blur(120px)",
          }}
        />

        {/* Secondary glow */}
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            bottom: "-160px",
            right: "-100px",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            background:
              "rgba(168,85,247,0.10)",
            filter: "blur(110px)",
          }}
        />

        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,

            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",

            backgroundSize:
              "44px 44px",

            opacity: 0.45,

            maskImage:
              "radial-gradient(circle at center, black 35%, transparent 85%)",
          }}
        />
      </div>

      {/* Hero */}
      <div
        style={{
          position: "relative",
          zIndex: 2,

          width: "100%",
          maxWidth: "1180px",

          display: "grid",
          gridTemplateColumns:
            "1.1fr 0.9fr",

          gap: "4rem",

          alignItems: "center",
        }}
      >
        {/* Left */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.7rem",

              padding:
                "0.55rem 0.95rem",

              borderRadius:
                "999px",

              background:
                "rgba(255,255,255,0.04)",

              border:
                "1px solid rgba(255,255,255,0.06)",

              backdropFilter:
                "blur(12px)",

              marginBottom:
                "1.6rem",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius:
                  "999px",

                background:
                  "#22d46e",

                boxShadow:
                  "0 0 14px #22d46e",
              }}
            />

            <span
              style={{
                fontFamily:
                  "var(--font-mono)",

                fontSize:
                  "0.72rem",

                letterSpacing:
                  "0.14em",

                textTransform:
                  "uppercase",

                color:
                  "#d8dcff",
              }}
            >
              AI Document Intelligence
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
            }}
            style={{
              fontFamily:
                "var(--font-display)",

              fontSize:
                "clamp(3.8rem, 7vw, 6.4rem)",

              lineHeight: 0.9,

              fontWeight: 800,

              letterSpacing:
                "-0.08em",

              color: "#f4f5ff",

              marginBottom:
                "1.5rem",

              maxWidth: "720px",
            }}
          >
            Intelligent
            <br />
            Document
            <br />
            Processing
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.22,
            }}
            style={{
              fontSize:
                "1rem",

              lineHeight:
                1.9,

              color:
                "var(--text-secondary)",

              maxWidth:
                "620px",

              marginBottom:
                "2rem",
            }}
          >
            Upload, extract,
            process, and organize
            structured data from
            documents using
            intelligent asynchronous
            AI workflows designed
            for modern teams.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <motion.div
              whileHover={{
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.985,
              }}
            >
              <Link
                href="/dashboard"
                style={{
                  height: "56px",

                  padding:
                    "0 1.5rem",

                  borderRadius:
                    "18px",

                  display: "inline-flex",

                  alignItems:
                    "center",

                  gap: "0.75rem",

                  background:
                    "linear-gradient(135deg, #646cff 0%, #7c5cff 45%, #8b5cf6 100%)",

                  color: "#fff",

                  textDecoration:
                    "none",

                  fontWeight: 700,

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  boxShadow:
                    "0 12px 30px rgba(100,108,255,0.32)",
                }}
              >
                Open Workspace

                <span
                  style={{
                    fontSize:
                      "1rem",
                  }}
                >
                  →
                </span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.985,
              }}
            >
              <Link
                href="/upload"
                style={{
                  height: "56px",

                  padding:
                    "0 1.4rem",

                  borderRadius:
                    "18px",

                  display: "inline-flex",

                  alignItems:
                    "center",

                  gap: "0.7rem",

                  background:
                    "rgba(255,255,255,0.04)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  color:
                    "#d9ddff",

                  textDecoration:
                    "none",

                  fontWeight: 600,

                  backdropFilter:
                    "blur(12px)",
                }}
              >
                Upload Documents
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.38,
            }}
            style={{
              display: "flex",
              gap: "2rem",

              marginTop:
                "3rem",

              flexWrap: "wrap",
            }}
          >
            {[
              [
                "AI Extraction",
                "Smart parsing & structured insights",
              ],

              [
                "Async Pipeline",
                "Realtime progress tracking",
              ],

              [
                "Secure Workspace",
                "Token-based protected access",
              ],
            ].map(([title, desc]) => (
              <div
                key={title}
                style={{
                  maxWidth:
                    "190px",
                }}
              >
                <div
                  style={{
                    color:
                      "#f3f4ff",

                    fontWeight: 700,

                    marginBottom:
                      "0.45rem",
                  }}
                >
                  {title}
                </div>

                <div
                  style={{
                    fontSize:
                      "0.82rem",

                    lineHeight:
                      1.7,

                    color:
                      "var(--text-muted)",
                  }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right panel */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.94,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            delay: 0.18,
            duration: 0.5,
          }}
          style={{
            position: "relative",
          }}
        >
          {/* floating glow */}
          <div
            style={{
              position: "absolute",
              inset: "-40px",

              borderRadius:
                "40px",

              background:
                "rgba(100,108,255,0.08)",

              filter: "blur(60px)",
            }}
          />

          {/* Main card */}
          <div
            style={{
              position: "relative",

              borderRadius:
                "32px",

              overflow: "hidden",

              background:
                "rgba(14,14,26,0.78)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              backdropFilter:
                "blur(24px)",

              boxShadow:
                "0 12px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* top */}
            <div
              style={{
                padding:
                  "1.1rem 1.2rem",

                borderBottom:
                  "1px solid rgba(255,255,255,0.06)",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "0.55rem",
                }}
              >
                {[
                  "#ef4444",
                  "#f59e0b",
                  "#22d46e",
                ].map((c) => (
                  <div
                    key={c}
                    style={{
                      width:
                        "10px",

                      height:
                        "10px",

                      borderRadius:
                        "999px",

                      background:
                        c,
                    }}
                  />
                ))}
              </div>

              <span
                style={{
                  fontFamily:
                    "var(--font-mono)",

                  fontSize:
                    "0.7rem",

                  color:
                    "var(--text-muted)",

                  letterSpacing:
                    "0.12em",
                }}
              >
                LIVE WORKFLOW
              </span>
            </div>

            {/* content */}
            <div
              style={{
                padding:
                  "1.5rem",
              }}
            >
              {/* top card */}
              <motion.div
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 4,
                  repeat:
                    Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  padding:
                    "1.3rem",

                  borderRadius:
                    "22px",

                  background:
                    "linear-gradient(135deg, rgba(100,108,255,0.14), rgba(168,85,247,0.08))",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  marginBottom:
                    "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",

                    marginBottom:
                      "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color:
                          "#f4f5ff",

                        marginBottom:
                          "0.3rem",
                      }}
                    >
                      contract.pdf
                    </div>

                    <div
                      style={{
                        fontSize:
                          "0.75rem",

                        color:
                          "var(--text-muted)",
                      }}
                    >
                      Processing extraction
                    </div>
                  </div>

                  <div
                    style={{
                      padding:
                        "0.45rem 0.7rem",

                      borderRadius:
                        "999px",

                      background:
                        "rgba(100,108,255,0.12)",

                      border:
                        "1px solid rgba(100,108,255,0.16)",

                      color:
                        "#cfd3ff",

                      fontSize:
                        "0.72rem",

                      fontWeight: 700,
                    }}
                  >
                    82%
                  </div>
                </div>

                {/* progress */}
                <div
                  style={{
                    height: "10px",

                    borderRadius:
                      "999px",

                    overflow:
                      "hidden",

                    background:
                      "rgba(255,255,255,0.05)",
                  }}
                >
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width: "82%",
                    }}
                    transition={{
                      duration: 1.4,
                    }}
                    style={{
                      height: "100%",

                      borderRadius:
                        "999px",

                      background:
                        "linear-gradient(90deg, #646cff 0%, #8b5cf6 100%)",

                      boxShadow:
                        "0 0 24px rgba(100,108,255,0.4)",
                    }}
                  />
                </div>
              </motion.div>

              {/* log cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: "0.8rem",
                }}
              >
                {[
                  "Parsing uploaded document",
                  "Extracting structured fields",
                  "Generating AI summary",
                ].map(
                  (item, i) => (
                    <motion.div
                      key={item}
                      initial={{
                        opacity: 0,
                        x: 20,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          0.3 +
                          i * 0.1,
                      }}
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap: "0.9rem",

                        padding:
                          "0.95rem 1rem",

                        borderRadius:
                          "18px",

                        background:
                          "rgba(255,255,255,0.03)",

                        border:
                          "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        style={{
                          width:
                            "10px",

                          height:
                            "10px",

                          borderRadius:
                            "999px",

                          background:
                            "#646cff",

                          boxShadow:
                            "0 0 12px #646cff",
                        }}
                      />

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            color:
                              "#f4f5ff",

                            fontWeight: 600,

                            fontSize:
                              "0.84rem",
                          }}
                        >
                          {item}
                        </div>

                        <div
                          style={{
                            fontSize:
                              "0.72rem",

                            color:
                              "var(--text-muted)",

                            marginTop:
                              "0.18rem",
                          }}
                        >
                          Async AI
                          workflow
                          event
                        </div>
                      </div>

                      <div
                        style={{
                          color:
                            "#22d46e",

                          fontSize:
                            "0.72rem",

                          fontWeight: 700,
                        }}
                      >
                        ACTIVE
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}