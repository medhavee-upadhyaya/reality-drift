import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PresentationMode from "@/components/ui/PresentationMode";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reality-drift-rho.vercel.app"),
  title: {
    default: "Reality Drift — Narrative Drift Intelligence",
    template: "%s · Reality Drift",
  },
  description:
    "Detect regional contradictions in corporate ESG claims with an explainable Reality Drift Index and source-level receipts.",
  keywords: [
    "ESG",
    "greenwashing detection",
    "narrative drift",
    "corporate accountability",
    "OSINT",
    "compliance",
  ],
  authors: [{ name: "Medhavee Upadhyaya" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Reality Drift — The Internet Shows Different Truths to Different People",
    description: "Compare corporate claims across regions, filings, and evidence. See every contradiction and how it affects the score.",
    url: "/",
    siteName: "Reality Drift",
    images: [{ url: "/social-preview.jpg", width: 1280, height: 720, alt: "Reality Drift evidence dashboard" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reality Drift — Narrative Drift Intelligence",
    description: "Different claims, different regions, one evidence-first audit.",
    images: ["/social-preview.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Material Symbols — used throughout the Stitch design */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-body-base antialiased`}
      >
        {children}
        <PresentationMode />
      </body>
    </html>
  );
}
