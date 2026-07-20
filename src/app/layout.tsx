import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AnthroTest — study room for Claude certifications",
  description:
    "Practice questions, mock exams, study notes, and an AI tutor for the Claude Certified Architect (CCA-F) exam. Independent study resource.",
  metadataBase: new URL("https://anthrotest.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="max-w-3xl mx-auto px-4 py-6 min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mt-10 pt-4 text-xs" style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}>
            AnthroTest is an independent study resource. Not affiliated with, endorsed by, or connected to Anthropic, PBC.
            Practice questions are original material written to publicly published exam outlines. &ldquo;Claude&rdquo; is a
            trademark of Anthropic, PBC.
          </footer>
        </div>
      </body>
    </html>
  );
}
