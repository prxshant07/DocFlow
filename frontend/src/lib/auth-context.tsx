"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { motion } from "motion/react";

import { api } from "./api";

interface AuthContextType {
  user: {
    id: string;
    email: string;
    full_name?: string;
  } | null;

  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;

  register: (
    email: string,
    password: string,
    full_name?: string
  ) => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<{
      id: string;
      email: string;
      full_name?: string;
    } | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (token) {
      api
        .getMe()
        .then((user) =>
          setUser(user)
        )
        .catch(() => {
          localStorage.removeItem(
            "token"
          );
        })
        .finally(() =>
          setIsLoading(false)
        );
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ) => {
    try {
      const response =
        await api.login({
          email,
          password,
        });

      localStorage.setItem(
        "token",
        response.access_token
      );

      const user =
        await api.getMe();

      setUser(user);
    } catch (error) {
      throw new Error(
        "Login failed"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    setUser(null);
  };

  const register = async (
    email: string,
    password: string,
    full_name?: string
  ) => {
    try {
      const response =
        await api.register({
          email,
          password,
          full_name,
        });

      localStorage.setItem(
        "token",
        response.access_token
      );

      const user =
        await api.getMe();

      setUser(user);
    } catch (error) {
      throw new Error(
        "Registration failed"
      );
    }
  };

  // Loading screen only — logic unchanged
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          background:
            "radial-gradient(circle at top left, rgba(100,108,255,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(168,85,247,0.12), transparent 24%), #080810",

          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ambient glows */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            left: "-120px",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            background:
              "rgba(100,108,255,0.10)",
            filter: "blur(120px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "999px",
            background:
              "rgba(168,85,247,0.08)",
            filter: "blur(100px)",
          }}
        />

        {/* grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",

            backgroundSize:
              "40px 40px",

            opacity: 0.45,

            maskImage:
              "radial-gradient(circle at center, black 30%, transparent 80%)",
          }}
        />

        {/* Loader card */}
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.4,
          }}
          style={{
            position: "relative",
            zIndex: 2,

            width: "320px",

            padding:
              "2rem 1.8rem",

            borderRadius: "28px",

            background:
              "rgba(14,14,26,0.78)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            backdropFilter:
              "blur(24px)",

            boxShadow:
              "0 10px 60px rgba(0,0,0,0.45), 0 0 80px rgba(100,108,255,0.08)",

            display: "flex",
            flexDirection:
              "column",
            alignItems: "center",
            justifyContent:
              "center",
            gap: "1.2rem",
          }}
        >
          {/* logo */}
          <motion.div
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: "74px",
              height: "74px",

              borderRadius:
                "22px",

              background:
                "linear-gradient(135deg, rgba(100,108,255,0.18), rgba(168,85,247,0.16))",

              border:
                "1px solid rgba(255,255,255,0.08)",

              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",

              boxShadow:
                "0 0 40px rgba(100,108,255,0.18)",

              position:
                "relative",
            }}
          >
            {/* shimmer */}
            <motion.div
              animate={{
                x: [
                  "-120%",
                  "220%",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat:
                  Infinity,
                ease: "linear",
              }}
              style={{
                position:
                  "absolute",
                inset: 0,

                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",

                transform:
                  "skewX(-20deg)",

                borderRadius:
                  "22px",
              }}
            />

            <span
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "1.8rem",

                fontWeight: 800,

                color:
                  "#e3e5ff",

                letterSpacing:
                  "-0.05em",

                position:
                  "relative",
                zIndex: 2,
              }}
            >
              D
            </span>
          </motion.div>

          {/* text */}
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "1.35rem",

                fontWeight: 800,

                color:
                  "#f4f5ff",

                letterSpacing:
                  "-0.04em",

                marginBottom:
                  "0.35rem",
              }}
            >
              Loading Workspace
            </div>

            <div
              style={{
                fontSize:
                  "0.84rem",

                color:
                  "var(--text-secondary)",

                lineHeight:
                  1.7,
              }}
            >
              Initializing your
              secure AI document
              environment.
            </div>
          </div>

          {/* loader */}
          <div
            style={{
              width: "100%",
              marginTop: "0.3rem",
            }}
          >
            <div
              style={{
                height: "8px",

                borderRadius:
                  "999px",

                overflow:
                  "hidden",

                background:
                  "rgba(255,255,255,0.04)",

                border:
                  "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <motion.div
                animate={{
                  x: [
                    "-100%",
                    "250%",
                  ],
                }}
                transition={{
                  duration: 1.4,
                  repeat:
                    Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  width: "40%",

                  height: "100%",

                  borderRadius:
                    "999px",

                  background:
                    "linear-gradient(90deg, #646cff 0%, #8b5cf6 100%)",

                  boxShadow:
                    "0 0 20px rgba(100,108,255,0.35)",
                }}
              />
            </div>
          </div>

          {/* status */}
          <motion.div
            animate={{
              opacity: [
                0.45, 1,
                0.45,
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",

              marginTop: "0.2rem",

              fontSize:
                "0.72rem",

              color:
                "var(--text-muted)",

              fontFamily:
                "var(--font-mono)",

              letterSpacing:
                "0.08em",

              textTransform:
                "uppercase",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius:
                  "999px",

                background:
                  "#646cff",

                boxShadow:
                  "0 0 12px #646cff",
              }}
            />

            Authenticating Session
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}