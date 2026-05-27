"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DEMO_COMPANIES } from "@/lib/preloaded";
import DriftGlobe from "@/components/globe/DriftGlobe";

export default function LandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = encodeURIComponent(input.trim());
    router.push(`/analyze/${query}`);
  };

  const handleDemoClick = (slug: string) => {
    router.push(`/analyze/${slug}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Background grid — Stitch Technical Minimalism ── */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(173,198,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(173,198,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Globe background — top right ── */}
      <div className="absolute top-8 right-8 opacity-40 pointer-events-none hidden lg:block">
        <DriftGlobe rdiScore={84} activeRegions={["US", "DE", "IN", "BR", "SG"]} />
      </div>

      {/* ── Radial glow — primary blue (Intelligence layer) ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(77,142,255,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

        {/* ── Status badge ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
          style={{
            border: "1px solid var(--outline-variant)",
            background: "var(--surface-container-low)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full primary-pulse"
            style={{ backgroundColor: "var(--tertiary-container)" }}
          />
          <span
            className="text-xs tracking-[0.08em] uppercase"
            style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--on-surface-variant)" }}
          >
            AI Observability Infrastructure
          </span>
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
        >
          The Internet Shows{" "}
          <span style={{ color: "var(--tertiary)" }}>Different Truths</span>
          <br />
          to Different People.
        </motion.h1>

        {/* ── Subheadline ── */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg mb-12 max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Companies publish region-optimized ESG narratives — calibrated to regulatory
          pressure, consumer expectations, and legal exposure in each market.
          Reality Drift catches them doing it. Automatically. With receipts.
        </motion.p>

        {/* ── Analyze terminal ── */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          onSubmit={handleAnalyze}
          className="flex gap-3 max-w-xl mx-auto mb-16"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter company URL or name..."
            className="flex-1 px-4 py-3 text-sm intel-input"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 text-sm font-semibold btn-primary whitespace-nowrap"
          >
            Analyze
          </button>
        </motion.form>

        {/* ── Demo companies ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <p
            className="text-xs uppercase tracking-[0.12em] mb-4"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              color: "var(--outline)",
            }}
          >
            Demo Companies — Instant Results
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DEMO_COMPANIES.map((company, i) => (
              <motion.button
                key={company.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                onClick={() => handleDemoClick(company.slug)}
                className="group text-left p-4 transition-all cursor-pointer"
                style={{
                  borderRadius: "8px",
                  border: "1px solid var(--outline-variant)",
                  background: "var(--surface-container)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)";
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: "var(--on-surface)" }}
                  >
                    {company.name}
                  </span>
                  <span
                    className="text-2xl font-bold rdi-number"
                    style={{ color: company.color }}
                  >
                    {company.rdi}
                  </span>
                </div>
                <div
                  className="text-xs px-2 py-0.5 rounded inline-block mb-2"
                  style={{
                    background: company.color + "1a",
                    color: company.color,
                    border: `1px solid ${company.color}40`,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  {company.driftType}
                </div>
                <p
                  className="text-xs leading-snug"
                  style={{ color: "var(--outline)" }}
                >
                  {company.hook}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 text-xs"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            color: "var(--outline)",
            letterSpacing: "0.05em",
          }}
        >
          Powered by Bright Data · Claude · Cognee
        </motion.p>
      </div>
    </div>
  );
}
