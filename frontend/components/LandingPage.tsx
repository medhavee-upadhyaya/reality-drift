"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DEMO_COMPANIES } from "@/lib/preloaded";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";

export default function LandingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/analyze/${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-8">
      <Navbar />

      {/* ── Background: Stitch radial dot grid ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: "radial-gradient(rgb(var(--color-sc-high)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-xl px-gutter">

        {/* ── Hero headline ── */}
        <motion.div
          className="text-center max-w-4xl mb-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="font-display-lg text-display-lg text-on-surface mb-sm tracking-tighter leading-tight">
            The Internet Shows Different <br />
            <span className="text-primary italic">Truths</span> to Different People.
          </h1>
          <p className="font-data-label text-data-label text-on-surface-variant uppercase tracking-[0.2em]">
            Neural Narrative Detection&nbsp;•&nbsp;Cross-Regional Drift Analysis
          </p>
        </motion.div>

        {/* ── Cinematic Globe Centerpiece ── */}
        <motion.div
          className="relative w-full max-w-3xl flex items-center justify-center mb-xl"
          style={{ aspectRatio: "1/0.6" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Atmospheric glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] animate-pulse-slow pointer-events-none" />

          {/* Globe ring — outer slow spin */}
          <div className="absolute inset-[10%] border border-primary/20 rounded-full animate-spin-slow pointer-events-none" />
          {/* Globe ring — inner reverse spin */}
          <div className="absolute inset-[20%] border border-on-surface-variant/10 rounded-full animate-spin-slow-rev pointer-events-none" />

          {/* Globe core */}
          <div className="relative w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full overflow-hidden border border-outline-variant/20 shadow-2xl bg-sc-lowest">
            {/* Scan line */}
            <div className="scan-line" />

            {/* Globe fill — gradient that evokes a world map */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at 30% 40%, rgb(var(--color-primary) / 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, rgb(var(--color-tertiary-container) / 0.1) 0%, transparent 40%),
                  radial-gradient(circle at 50% 50%, rgb(var(--color-sc-low)) 0%, rgb(var(--color-background)) 100%)
                `,
              }}
            />

            {/* SVG animated drift pings */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
              {/* US ping — primary */}
              <circle cx="28" cy="38" r="1.2" fill="rgb(var(--color-primary))" />
              <circle cx="28" cy="38" r="1.2" fill="rgb(var(--color-primary))" opacity="0.8">
                <animate attributeName="r" from="0" to="8" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* EU anomaly ping — tertiary */}
              <circle cx="52" cy="30" r="1.2" fill="rgb(var(--color-tertiary))" />
              <circle cx="52" cy="30" r="1.2" fill="rgb(var(--color-tertiary))" opacity="0.8">
                <animate attributeName="r" from="0" to="10" dur="4s" repeatCount="indefinite" begin="1s" />
                <animate attributeName="opacity" from="0.8" to="0" dur="4s" repeatCount="indefinite" begin="1s" />
              </circle>

              {/* IN ping — primary */}
              <circle cx="67" cy="45" r="1.2" fill="rgb(var(--color-primary))" />
              <circle cx="67" cy="45" r="1.2" fill="rgb(var(--color-primary))" opacity="0.6">
                <animate attributeName="r" from="0" to="6" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
              </circle>

              {/* BR ping */}
              <circle cx="35" cy="65" r="1.2" fill="rgb(var(--color-primary))" />
              <circle cx="35" cy="65" r="1.2" fill="rgb(var(--color-primary))" opacity="0.5">
                <animate attributeName="r" from="0" to="7" dur="3.5s" repeatCount="indefinite" begin="2s" />
                <animate attributeName="opacity" from="0.5" to="0" dur="3.5s" repeatCount="indefinite" begin="2s" />
              </circle>

              {/* SG ping */}
              <circle cx="73" cy="60" r="1.2" fill="rgb(var(--color-tertiary))" />
              <circle cx="73" cy="60" r="1.2" fill="rgb(var(--color-tertiary))" opacity="0.6">
                <animate attributeName="r" from="0" to="9" dur="4.5s" repeatCount="indefinite" begin="1.5s" />
                <animate attributeName="opacity" from="0.6" to="0" dur="4.5s" repeatCount="indefinite" begin="1.5s" />
              </circle>

              {/* Grid lines — latitude */}
              <ellipse cx="50" cy="50" rx="48" ry="15" fill="none" stroke="rgb(var(--color-primary))" strokeWidth="0.15" opacity="0.2" />
              <ellipse cx="50" cy="50" rx="48" ry="30" fill="none" stroke="rgb(var(--color-primary))" strokeWidth="0.15" opacity="0.15" />
              {/* Grid lines — longitude */}
              <line x1="50" y1="2" x2="50" y2="98" stroke="rgb(var(--color-primary))" strokeWidth="0.15" opacity="0.2" />
              <line x1="20" y1="10" x2="20" y2="90" stroke="rgb(var(--color-primary))" strokeWidth="0.1" opacity="0.1" />
              <line x1="80" y1="10" x2="80" y2="90" stroke="rgb(var(--color-primary))" strokeWidth="0.1" opacity="0.1" />
            </svg>
          </div>

          {/* Float card — left: EU cluster */}
          <div className="absolute left-0 top-1/4 glass-panel p-sm rounded-xl w-48 border-l-2 border-primary hidden lg:block">
            <p className="font-data-label text-[10px] text-primary uppercase mb-base">Live Feed</p>
            <div className="flex items-center gap-xs mb-xs">
              <div className="relative w-2 h-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary absolute ping-ring" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary relative" />
              </div>
              <span className="font-data-value text-data-value text-on-surface">EU_NORTH_CLUSTER</span>
            </div>
            <div className="font-data-label text-[10px] text-on-surface-variant">DRIFT COEFF: 0.124</div>
          </div>

          {/* Float card — right: anomaly */}
          <div className="absolute right-0 bottom-1/4 glass-panel p-sm rounded-xl w-56 border-r-2 border-tertiary hidden lg:block">
            <p className="font-data-label text-[10px] text-tertiary uppercase mb-base">
              <span className="material-symbols-outlined text-[12px] align-middle mr-1">warning</span>
              Anomalous Spike
            </p>
            <div className="font-data-value text-data-value text-on-surface mb-xs">APAC_SURGE_EVENT</div>
            <div className="font-data-label text-[10px] text-on-surface-variant">VARIANCE: 78.4% N/A</div>
          </div>
        </motion.div>

        {/* ── Command bar / search ── */}
        <motion.div
          className="w-full max-w-2xl z-30 -mt-8 md:-mt-16 mb-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <form
            onSubmit={handleAnalyze}
            className="glass-panel rounded-xl flex items-center group focus-within:ring-2 focus-within:ring-primary/40 transition-all duration-300"
          >
            <div className="flex items-center px-sm text-on-surface-variant group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter company URL or name to analyze drift..."
              className="flex-1 bg-transparent border-none text-on-surface placeholder:text-outline focus:ring-0 focus:outline-none font-data-value text-[16px] py-4"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-primary text-on-primary px-lg py-4 rounded-xl font-data-label text-data-label uppercase tracking-widest hover:bg-primary-fixed disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-xs"
            >
              Analyze
              <span className="material-symbols-outlined text-[18px]">terminal</span>
            </button>
          </form>

          {/* Recent suggestions */}
          <div className="flex justify-center gap-md mt-sm">
            <span className="font-data-label text-[10px] text-on-surface-variant uppercase">Recent:</span>
            {["tesla.com", "google.ai", "reuters.com"].map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/analyze/${encodeURIComponent(s)}`)}
                className="font-data-label text-[10px] text-primary/70 hover:text-primary transition-colors underline decoration-primary/30"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Demo targets — Stitch glass-panel cards ── */}
        <motion.section
          className="w-full max-w-5xl px-margin-desktop mb-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <p className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest mb-md text-center">
            Demo Targets — Instant Analysis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
            {DEMO_COMPANIES.map((company, i) => (
              <motion.button
                key={company.slug}
                onClick={() => router.push(`/analyze/${company.slug}`)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel p-md rounded-xl text-left group cursor-pointer transition-all hover:border-primary/30"
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-sm">
                  <div>
                    <div className="font-headline-md text-headline-md text-on-surface font-bold tracking-tighter">
                      {company.name.toUpperCase()}
                    </div>
                    <div
                      className="font-data-label text-[10px] uppercase tracking-widest px-2 py-0.5 rounded inline-block mt-1"
                      style={{
                        background: company.color + "1a",
                        color: company.color,
                        border: `1px solid ${company.color}40`,
                      }}
                    >
                      {company.driftType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-[48px] leading-none font-data-value tabular-nums"
                      style={{ color: company.color }}
                    >
                      {company.rdi}
                    </div>
                    <div className="font-data-label text-[10px] text-on-surface-variant uppercase">RDI</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden mb-sm">
                  <div
                    className="h-full progress-bar rounded-full"
                    style={{
                      "--progress": `${company.rdi}%`,
                      background: company.color,
                    } as React.CSSProperties}
                  />
                </div>

                <p className="font-data-label text-[11px] text-on-surface-variant leading-snug">
                  {company.hook}
                </p>

                <div className="mt-sm flex items-center gap-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-data-label text-[10px] uppercase">Analyze</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── Stats bento ── */}
        <motion.section
          className="w-full max-w-5xl px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-gutter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          {/* Narrative variance sparkline */}
          <div className="glass-panel p-md rounded-xl col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-data-label text-data-label text-primary uppercase tracking-widest mb-xs">
                Narrative Variance
              </h3>
              <p className="text-body-base text-on-surface-variant mb-md text-[13px]">
                Aggregate drift across 142 geo-zones in real-time.
              </p>
            </div>
            <div className="h-12 flex items-end gap-1">
              {[30, 45, 40, 60, 85, 55, 40].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    background: i === 4
                      ? `rgb(var(--color-tertiary-container))`
                      : `rgb(var(--color-primary) / 0.25)`,
                    animation: i === 4 ? "pulse-slow 2s ease-in-out infinite" : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 14M nodes */}
          <div className="glass-panel p-md rounded-xl flex flex-col items-center justify-center text-center">
            <div className="font-data-value text-[40px] leading-none text-on-surface tabular-nums">14M+</div>
            <div className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
              Data Nodes Scanned
            </div>
          </div>

          {/* 0.02s latency */}
          <div className="glass-panel p-md rounded-xl flex flex-col items-center justify-center text-center border-t-2 border-primary">
            <div className="font-data-value text-[40px] leading-none text-primary tabular-nums">0.02s</div>
            <div className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
              Inference Latency
            </div>
          </div>
        </motion.section>
      </main>

      <StatusBar />
    </div>
  );
}
