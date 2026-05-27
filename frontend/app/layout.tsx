import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// ── Stitch Design System fonts ────────────────────────────────────
// Inter: UI chrome, headlines, body (Stitch spec: display-lg / headline-md / body-base)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// JetBrains Mono: all data points, timestamps, drift %, coordinates
// (Stitch spec: data-label / data-value / caption)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Reality Drift — The Internet Shows Different Truths to Different People",
  description:
    "AI observability infrastructure for detecting regional narrative drift in corporate ESG claims.",
  openGraph: {
    title: "Reality Drift",
    description: "The Internet Shows Different Truths to Different People",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
        style={{ backgroundColor: "var(--background)", color: "var(--on-surface)" }}
      >
        {children}
      </body>
    </html>
  );
}
