import type { Metadata } from "next";

import {
  DM_Sans,
  DM_Mono,
  Syne,
} from "next/font/google";

import "./globals.css";

import { Sidebar } from "@/components/ui/Sidebar";
import { AuthProvider } from "@/lib/auth-context";

const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title:
    "DocFlow — Intelligent Document Workspace",

  description:
    "Upload, process, extract, and manage structured document intelligence with AI-powered workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body
        style={{
          background:
            "radial-gradient(circle at top left, rgba(100,108,255,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(168,85,247,0.10), transparent 24%), #080810",
        }}
      >
        <AuthProvider>
          {/* Ambient background */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {/* Main glow */}
            <div
              style={{
                position: "absolute",
                top: "-180px",
                right: "-120px",
                width: "520px",
                height: "520px",
                borderRadius: "999px",
                background:
                  "rgba(100,108,255,0.10)",
                filter: "blur(120px)",
              }}
            />

            {/* Secondary glow */}
            <div
              style={{
                position: "absolute",
                bottom: "-180px",
                left: "-120px",
                width: "420px",
                height: "420px",
                borderRadius: "999px",
                background:
                  "rgba(168,85,247,0.08)",
                filter: "blur(100px)",
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
                  "radial-gradient(circle at center, black 30%, transparent 80%)",
                opacity: 0.45,
              }}
            />
          </div>

          {/* Main shell */}
          <div
            className="app-shell"
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Sidebar */}
            <Sidebar />

            {/* Content */}
            <main
              className="main-content"
              style={{
                position: "relative",
              }}
            >
              {/* Floating blur accent */}
              <div
                style={{
                  position: "absolute",
                  top: "10%",
                  right: "-80px",
                  width: "180px",
                  height: "180px",
                  borderRadius: "999px",
                  background:
                    "rgba(100,108,255,0.08)",
                  filter: "blur(80px)",
                  pointerEvents: "none",
                }}
              />

              {/* Inner content */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  animation:
                    "fadeUp 0.35s ease",
                }}
              >
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}