"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AnalysisResult, ProgressEvent, AnalysisStep,
  getRDIColor, getRDILabel, DRIFT_TYPE_COLORS,
} from "@/lib/types";
import { getCompany, streamAnalysis } from "@/lib/api";
import { getPreloadedSlug, getPreloadedResult } from "@/lib/preloaded";

import RDIReveal from "@/components/rdi/RDIReveal";
import RDIBreakdown from "@/components/rdi/RDIBreakdown";
import DriftDNA from "@/components/dna/DriftDNA";
import FilingDiscrepancyCard from "@/components/filing/FilingDiscrepancyCard";
import DriftTimeline from "@/components/timeline/DriftTimeline";
import LiveAnalysisProgress from "@/components/search/LiveAnalysisProgress";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import ModeNav from "@/components/ui/ModeNav";
import RecommendedActions from "@/components/compliance/RecommendedActions";

const REGIONS = ["US", "DE", "IN", "BR", "SG"] as const;
const REGION_META: Record<string, { flag: string; label: string; icon: string; city: string }> = {
  US: { flag: "🇺🇸", label: "US Ops",     icon: "lan",         city: "Washington"  },
  DE: { flag: "🇩🇪", label: "EU Cluster", icon: "euro_symbol", city: "Berlin"      },
  IN: { flag: "🇮🇳", label: "IN Node",    icon: "hub",         city: "New Delhi"   },
  BR: { flag: "🇧🇷", label: "BR Sector",  icon: "public",      city: "Brasilia"    },
  SG: { flag: "🇸🇬", label: "SG Hub",     icon: "dns",         city: "Singapore"   },
};

export default function AnalyzePage() {
  const params  = useParams();
  const router  = useRouter();
  const companyParam = decodeURIComponent(params.company as string);

  const [result,         setResult]         = useState<AnalysisResult | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [currentStep,    setCurrentStep]    = useState<AnalysisStep | null>(null);
  const [progress,       setProgress]       = useState(0);
  const [isLive,         setIsLive]         = useState(false);
  const [activeRegion,   setActiveRegion]   = useState<string>("US");

  useEffect(() => { loadAnalysis(); }, [companyParam]);

  async function loadAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgressEvents([]);

    const slug = getPreloadedSlug(companyParam);
    if (slug) {
      try {
        const data = await getCompany(slug);
        setResult(data);
        setLoading(false);
        return;
      } catch {
        try {
          const staticData = await getPreloadedResult(slug);
          if (staticData) { setResult(staticData); setLoading(false); return; }
        } catch {}
      }
    }

    setIsLive(true);
    const cleanup = streamAnalysis(
      companyParam.startsWith("http") ? companyParam : `https://${companyParam}`,
      companyParam,
      (event) => {
        setProgressEvents((prev) => [...prev, event]);
        setCurrentStep(event.step);
        setProgress(event.progress);
        if (event.step === "done" && event.result) {
          setResult(event.result);
          setLoading(false);
        } else if (event.step === "error") {
          setError(event.error || "Analysis failed");
          setLoading(false);
        }
      },
      (err) => { setError(err.message); setLoading(false); },
    );
    return cleanup;
  }

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg glass-panel p-8 rounded-2xl">
            <div className="text-center mb-8">
              <div className="font-headline-md text-headline-md text-on-surface font-bold mb-1">
                {isLive ? "Running Live Analysis" : "Loading Intelligence File..."}
              </div>
              <div className="font-data-value text-data-value text-outline">{companyParam}</div>
            </div>
            {isLive ? (
              <LiveAnalysisProgress
                events={progressEvents}
                currentStep={currentStep}
                progress={progress}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="font-data-label text-data-label uppercase">Fetching...</span>
              </div>
            )}
          </div>
        </div>
        <StatusBar />
      </div>
    );
  }

  /* ── Error screen ── */
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-[64px] text-tertiary">warning</span>
            <div className="font-headline-md text-headline-md text-on-surface font-bold">Analysis Failed</div>
            <div className="font-data-value text-data-value text-outline max-w-sm">{error}</div>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-3 glass-panel rounded-xl font-data-label text-data-label uppercase text-primary hover:bg-primary/10 transition-all flex items-center gap-xs mx-auto"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Command Center
            </button>
          </div>
        </div>
        <StatusBar />
      </div>
    );
  }

  if (!result) return null;

  const driftColor = DRIFT_TYPE_COLORS[result.drift_dna.dominant_drift_type] ?? "#adc6ff";
  const rdiColor   = getRDIColor(result.rdi_score);

  /* ── Derive regional scan "percentages" from claim counts for visual effect ── */
  const regionScanPct: Record<string, number> = {};
  REGIONS.forEach((r) => {
    const claims = result.regional_pages[r]?.claims?.length ?? 0;
    regionScanPct[r] = Math.min(100, claims > 0 ? 40 + claims * 12 : 0);
  });

  /* ── Main dashboard ── */
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* ══════════════════════════════════════
            LEFT SIDEBAR — Fixed regional nav
            ══════════════════════════════════════ */}
        <aside className="w-64 flex-shrink-0 bg-surface-container-low/90 backdrop-blur-md border-r border-outline-variant/10 flex flex-col z-30">
          {/* Header */}
          <div className="p-margin-desktop border-b border-outline-variant/10">
            <h2 className="font-data-label text-data-label uppercase tracking-widest text-on-surface-variant mb-1">
              Regional Scan
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2">
                <div className="w-2 h-2 rounded-full bg-primary absolute ping-ring" />
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <span className="font-headline-md text-headline-sm text-on-surface font-semibold">
                SYSTEM ACTIVE
              </span>
            </div>
          </div>

          {/* Region nav */}
          <nav className="flex-1 overflow-y-auto py-2">
            {REGIONS.map((region) => {
              const meta  = REGION_META[region];
              const hasData = (result.regional_pages[region]?.claims?.length ?? 0) > 0;
              const isActive = activeRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-100 ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 border-l-4 border-transparent"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-data-label text-data-label uppercase">{meta.label}</div>
                  </div>
                  {!hasData && (
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant flex-shrink-0" />
                  )}
                  {hasData && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Deep scan button */}
          <div className="p-4">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-primary text-on-primary py-2.5 rounded-xl font-data-label text-data-label uppercase hover:brightness-110 active:scale-95 transition-all"
            >
              New Analysis
            </button>
          </div>

          {/* Bottom util links */}
          <div className="border-t border-outline-variant/10 p-2">
            <button
              onClick={() => router.push("/")}
              className="w-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 px-4 py-2 flex items-center gap-3 rounded transition-all text-left"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span className="font-data-label text-data-label uppercase">Command Center</span>
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════
            MAIN CONTENT — 12-col grid
            ══════════════════════════════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Mode switcher bar */}
          <div className="flex-shrink-0 bg-background/90 backdrop-blur-md border-b border-outline-variant/10 px-4 py-2 flex items-center justify-between z-20">
            <ModeNav company={companyParam} currentMode="outsider" />
            {result.is_preloaded && (
              <span className="demo-data-label font-data-label text-[9px] text-outline italic hidden sm:block">
                Demo data — pre-loaded for presentation
              </span>
            )}
          </div>

        <div className="flex-1 grid grid-cols-12 overflow-hidden">

          {/* ── LEFT PANE: Regional drift pings (col 1–3) ── */}
          <div className="col-span-3 border-r border-outline-variant/10 flex flex-col p-4 gap-3 bg-surface-container-lowest/30 overflow-y-auto pb-10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-data-label text-data-label uppercase text-on-surface-variant">
                Regional Drift Pings
              </h3>
              <span className="font-data-label text-[10px] text-primary/60 animate-pulse-drift">
                LIVE
              </span>
            </div>

            {/* Region items */}
            {REGIONS.map((region, i) => {
              const meta   = REGION_META[region];
              const pct    = regionScanPct[region];
              const hasData = pct > 0;
              const page   = result.regional_pages[region];
              const isAnomaly = (page?.claims?.length ?? 0) >= 3;
              return (
                <motion.div
                  key={region}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: hasData ? 1 : 0.4, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-panel p-3 rounded-xl flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-data-label text-[10px] uppercase ${isAnomaly ? "text-tertiary" : hasData ? "text-primary" : "text-on-surface-variant"}`}>
                      {meta.flag} {region} [{meta.city}]
                    </span>
                    <span className="font-data-value text-[10px] text-on-surface-variant">
                      {hasData ? `${pct}%` : page?.word_count ? "NO ESG CLAIMS" : "UNREACHABLE"}
                    </span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full progress-bar rounded-full"
                      style={{
                        "--progress": `${pct}%`,
                        background: isAnomaly
                          ? "rgb(var(--color-tertiary-container))"
                          : "rgb(var(--color-primary))",
                      } as React.CSSProperties}
                    />
                  </div>
                  {hasData && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(page?.claims?.length ?? 0, 5) }).map((_, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: j === 0 ? "rgb(var(--color-primary))" : "rgb(var(--color-primary) / 0.3)" }}
                        />
                      ))}
                      {isAnomaly && (
                        <span className="font-data-label text-[9px] text-tertiary uppercase ml-auto">ANOMALY</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Aggregate Drift score */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass-panel p-4 rounded-xl border-t-2 border-primary mt-2"
            >
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="font-data-label text-[10px] text-on-surface-variant uppercase">Aggregate Drift</p>
                  <p className="font-data-value text-[32px] leading-none text-primary tabular-nums">
                    {result.rdi_score}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-data-label text-[10px] text-on-surface-variant uppercase">Status</p>
                  <p className="font-data-label text-[10px] uppercase" style={{ color: rdiColor }}>
                    {getRDILabel(result.rdi_score)}
                  </p>
                </div>
              </div>
              {/* Mini sparkline */}
              <div className="h-10 flex items-end gap-0.5">
                {[20, 40, 90, 60, 30].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${h}%`,
                      background: i === 2
                        ? "rgb(var(--color-tertiary-container))"
                        : "rgb(var(--color-primary) / 0.3)",
                      boxShadow: i === 2 ? "0 0 8px rgb(var(--color-tertiary-container) / 0.4)" : undefined,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Data Sources */}
            {result.bright_data_usage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="glass-panel p-4 rounded-xl"
              >
                <h3 className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">
                  Data Sources
                </h3>
                <div className="space-y-2">
                  {[
                    result.bright_data_usage.residential_proxies,
                    result.bright_data_usage.web_unlocker,
                    result.bright_data_usage.serp_api,
                    result.bright_data_usage.scraping_browser,
                    result.bright_data_usage.web_scraper_api,
                  ].filter(Boolean).map((source, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="font-data-label text-[10px] text-on-surface-variant">{source!.product}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── CENTER PANE: Main analysis (col 4–9) ── */}
          <div className="col-span-6 flex flex-col p-6 overflow-y-auto pb-10">
            {/* Company header */}
            <motion.header
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-start mb-6"
            >
              <div>
                <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter leading-none mb-2">
                  {result.company.toUpperCase()}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded font-data-label text-[10px] uppercase border"
                    style={{
                      background: driftColor + "1a",
                      color: driftColor,
                      borderColor: driftColor + "40",
                    }}
                  >
                    Dominant Drift: {result.drift_dna.dominant_drift_type}
                  </span>
                  {result.is_preloaded && (
                    <span className="px-2 py-0.5 rounded font-data-label text-[10px] uppercase border border-outline-variant text-outline">
                      PRE-LOADED
                    </span>
                  )}
                  <span className="text-on-surface-variant/50 font-data-label text-[10px]">
                    ID: {result.analysis_id?.slice(0, 12)}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-data-label text-data-label text-on-surface-variant uppercase mb-1">Phase</p>
                <p className="font-headline-md text-primary font-semibold">Contradiction Mapping</p>
              </div>
            </motion.header>

            {/* ── RDI Score Hero panel ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="glass-panel rounded-2xl mb-6 relative overflow-hidden"
            >
              {/* Top progress accent */}
              <div className="absolute top-0 left-0 h-0.5 bg-primary/20 w-full" />

              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-data-label text-data-label text-on-surface-variant uppercase mb-2">
                    Regional Drift Index (RDI)
                  </p>
                  <RDIReveal score={result.rdi_score} animate />
                </div>
                <div className="w-48">
                  <RDIBreakdown components={result.rdi_components} />
                </div>
              </div>
            </motion.div>

            {/* ── Contradiction cards — 2-col like Stitch ── */}
            {result.contradictions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-2 gap-4 mb-6"
              >
                {result.contradictions.slice(0, 2).map((c, i) => (
                  <div
                    key={i}
                    className={`glass-panel p-5 rounded-xl border-l-2 ${
                      i === 0 ? "border-l-primary/60" : "border-l-tertiary/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-data-label text-[10px] uppercase ${i === 0 ? "text-primary" : "text-tertiary"}`}>
                        {c.region_source} Region
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        {i === 0 ? "verified_user" : "warning"}
                      </span>
                    </div>
                    <p className="text-body-base text-on-surface italic mb-3 text-[13px] leading-relaxed line-clamp-3">
                      &ldquo;{c.claim}&rdquo;
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-data-label text-[10px] text-on-surface-variant uppercase">
                        {c.evidence_source}
                      </span>
                      <span className={`font-data-label text-[10px] uppercase ${i === 0 ? "text-primary/70" : "text-tertiary/70"}`}>
                        {i === 0 ? "VERIFIED" : "CONTRADICTION"}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── More contradictions ── */}
            {result.contradictions.length > 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="glass-panel p-5 rounded-xl mb-6 space-y-3"
              >
                <h3 className="font-data-label text-data-label text-on-surface-variant uppercase">
                  All Contradictions ({result.contradictions.length})
                </h3>
                {result.contradictions.slice(2).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-t border-outline-variant/10">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 severity-${c.severity} font-data-label uppercase`}>
                      {c.severity}
                    </span>
                    <p className="text-[13px] text-on-surface-variant leading-snug">{c.claim}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── SEC Filing Discrepancy ── */}
            {result.sec_filing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <FilingDiscrepancyCard filing={result.sec_filing} />
              </motion.div>
            )}
          </div>

          {/* ── RIGHT PANE: AI Stream + DNA + Timeline (col 10–12) ── */}
          <div className="col-span-3 border-l border-outline-variant/10 flex flex-col p-4 bg-surface-container-lowest/30 overflow-y-auto pb-10">

            {/* AI Reasoning stream header */}
            <h3 className="font-data-label text-data-label uppercase text-on-surface-variant mb-4">
              AI Analysis Stream
            </h3>

            {/* Stream log — show contradictions as "detections" */}
            <div className="space-y-3 mb-6">
              {result.contradictions.slice(0, 4).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  className={`border-l-2 pl-3 py-1 ${
                    c.severity === "high"
                      ? "border-tertiary-container/60"
                      : c.severity === "medium"
                      ? "border-yellow-500/40"
                      : "border-primary/40"
                  }`}
                >
                  <div className="font-data-label text-[10px] text-on-surface-variant uppercase mb-0.5">
                    T+{String(i + 1).padStart(2, "0")} · {c.contradiction_type.replace("_", " ")}
                  </div>
                  <p className="font-data-value text-[11px] text-on-surface leading-snug line-clamp-2">
                    {c.claim.slice(0, 80)}{c.claim.length > 80 ? "…" : ""}
                  </p>
                  <div className="font-data-label text-[9px] text-outline uppercase mt-0.5">
                    {c.evidence_source}
                  </div>
                </motion.div>
              ))}

              {result.contradictions.length === 0 && (
                <div className="border-l-2 border-primary/40 pl-3 py-1">
                  <div className="font-data-label text-[10px] text-primary uppercase">SCAN COMPLETE</div>
                  <p className="font-data-value text-[11px] text-on-surface-variant">No contradictions found</p>
                </div>
              )}
            </div>

            {/* Drift DNA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-panel p-4 rounded-xl mb-4"
            >
              <h3 className="font-data-label text-data-label uppercase text-on-surface-variant mb-3">
                Drift DNA Fingerprint
              </h3>
              <DriftDNA dna={result.drift_dna} />
            </motion.div>

            {/* Timeline */}
            {result.temporal_history && result.temporal_history.length >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="glass-panel p-4 rounded-xl mb-4"
              >
                <DriftTimeline history={result.temporal_history} company={result.company} />
              </motion.div>
            )}

            {/* Glassdoor signals */}
            {result.glassdoor_signals && result.glassdoor_signals.esg_mention_count > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="glass-panel p-4 rounded-xl"
              >
                <h3 className="font-data-label text-data-label uppercase text-on-surface-variant mb-3">
                  Employee Sentiment
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <div className="font-data-value text-[28px] leading-none text-on-surface tabular-nums">
                      {result.glassdoor_signals.avg_rating ?? "—"}
                    </div>
                    <div className="font-data-label text-[10px] text-outline uppercase">Glassdoor</div>
                  </div>
                  <div>
                    <div className="font-data-value text-[28px] leading-none text-tertiary tabular-nums">
                      {Math.round(result.glassdoor_signals.negative_esg_ratio * 100)}%
                    </div>
                    <div className="font-data-label text-[10px] text-outline uppercase">Neg. ESG</div>
                  </div>
                </div>
                {result.glassdoor_signals.sample_reviews?.[0] && (
                  <blockquote className="text-[11px] text-on-surface-variant italic border-l-2 border-outline-variant pl-3 leading-relaxed line-clamp-3">
                    &ldquo;{result.glassdoor_signals.sample_reviews[0]}&rdquo;
                  </blockquote>
                )}
              </motion.div>
            )}
          </div>
        </div>

          {/* Recommended Actions — full width below grid */}
          <div className="flex-shrink-0 border-t border-outline-variant/10 px-4 py-4 bg-surface-container-lowest/30">
            <RecommendedActions result={result} mode="outsider" />
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
