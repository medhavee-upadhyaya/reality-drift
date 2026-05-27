"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisResult, ProgressEvent, AnalysisStep, getRDIColor } from "@/lib/types";
import { getCompany, streamAnalysis } from "@/lib/api";
import { getPreloadedSlug, getPreloadedResult } from "@/lib/preloaded";

import RDIReveal from "@/components/rdi/RDIReveal";
import RDIBreakdown from "@/components/rdi/RDIBreakdown";
import DriftDNA from "@/components/dna/DriftDNA";
import FilingDiscrepancyCard from "@/components/filing/FilingDiscrepancyCard";
import DriftTimeline from "@/components/timeline/DriftTimeline";
import LiveAnalysisProgress from "@/components/search/LiveAnalysisProgress";
import DriftGlobe from "@/components/globe/DriftGlobe";

const REGIONS = ["US", "DE", "IN", "BR", "SG"] as const;
const REGION_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  DE: "🇩🇪",
  IN: "🇮🇳",
  BR: "🇧🇷",
  SG: "🇸🇬",
};

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const companyParam = decodeURIComponent(params.company as string);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<AnalysisStep | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [companyParam]);

  async function loadAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgressEvents([]);

    // Check if it's a preloaded company
    const slug = getPreloadedSlug(companyParam);

    if (slug) {
      // Try backend first (instant)
      try {
        const data = await getCompany(slug);
        setResult(data);
        setLoading(false);
        return;
      } catch {
        // Backend unavailable — use static fallback
        try {
          const staticData = await getPreloadedResult(slug);
          if (staticData) {
            setResult(staticData);
            setLoading(false);
            return;
          }
        } catch {}
      }
    }

    // Live analysis via SSE
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
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return cleanup;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="w-full max-w-lg glass-card p-8">
          <div className="text-center mb-8">
            <div
              className="text-lg font-semibold mb-1"
              style={{ color: "var(--on-surface)" }}
            >
              {isLive ? "Running Live Analysis" : "Loading..."}
            </div>
            <div
              className="text-sm rdi-number"
              style={{ color: "var(--outline)" }}
            >
              {companyParam}
            </div>
          </div>
          {isLive && (
            <LiveAnalysisProgress
              events={progressEvents}
              currentStep={currentStep}
              progress={progress}
            />
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center space-y-4">
          <div className="text-4xl" style={{ color: "var(--tertiary)" }}>⚠</div>
          <div className="font-medium" style={{ color: "var(--on-surface)" }}>
            Analysis Failed
          </div>
          <div className="text-sm" style={{ color: "var(--outline)" }}>
            {error}
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm rounded transition-all"
            style={{
              background: "var(--surface-container)",
              border: "1px solid var(--outline-variant)",
              color: "var(--on-surface-variant)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)";
              (e.currentTarget as HTMLElement).style.color = "var(--on-surface)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-container)";
              (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
            }}
          >
            ← Back to search
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const rdiColor = getRDIColor(result.rdi_score);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>

      {/* ── Top nav ── */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-xs flex items-center gap-1 transition-colors"
          style={{ color: "var(--outline)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--outline)")}
        >
          ← Reality Drift
        </button>
        <div
          className="text-xs rdi-number"
          style={{ color: "var(--outline)" }}
        >
          {result.analysis_id}
        </div>
        {result.is_preloaded && (
          <div
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: "var(--surface-container)",
              border: "1px solid var(--outline-variant)",
              color: "var(--outline)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              letterSpacing: "0.05em",
            }}
          >
            PRE-LOADED DEMO
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Company header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
          >
            {result.company}
          </h1>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors"
            style={{ color: "var(--outline)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--outline)")}
          >
            {result.url}
          </a>
        </motion.div>

        {/* ── Main 3-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Regions ── */}
          <div className="space-y-4">

            {/* Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="glass-card p-4 flex justify-center"
            >
              <DriftGlobe
                rdiScore={result.rdi_score}
                activeRegions={REGIONS.filter(
                  (r) =>
                    result.regional_pages[r] &&
                    result.regional_pages[r].claims?.length > 0
                )}
              />
            </motion.div>

            {/* Regional coverage */}
            <div className="glass-card p-4">
              <h3 className="data-label mb-4">Regional Coverage</h3>
              <div className="space-y-3">
                {REGIONS.map((region, i) => {
                  const page = result.regional_pages[region];
                  const hasClaims = page && page.claims && page.claims.length > 0;
                  return (
                    <motion.div
                      key={region}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: hasClaims ? 1 : 0.3, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex items-center gap-2 w-16 flex-shrink-0">
                        <span>{REGION_FLAGS[region]}</span>
                        <span
                          className="text-xs rdi-number"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {region}
                        </span>
                      </div>
                      <div className="flex-1">
                        {hasClaims ? (
                          <ul className="space-y-1">
                            {page.claims.slice(0, 2).map((claim, j) => (
                              <li
                                key={j}
                                className="text-xs leading-snug"
                                style={{ color: "var(--on-surface-variant)" }}
                              >
                                • {claim}
                              </li>
                            ))}
                            {page.claims.length > 2 && (
                              <li
                                className="text-xs"
                                style={{ color: "var(--outline)" }}
                              >
                                +{page.claims.length - 2} more claims
                              </li>
                            )}
                          </ul>
                        ) : (
                          <span
                            className="text-xs italic"
                            style={{ color: "var(--outline-variant)" }}
                          >
                            No data
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Data Sources */}
            {result.bright_data_usage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="glass-card p-4"
              >
                <h3 className="data-label mb-3">Data Sources</h3>
                <div className="space-y-2">
                  {[
                    result.bright_data_usage.residential_proxies,
                    result.bright_data_usage.web_unlocker,
                    result.bright_data_usage.serp_api,
                    result.bright_data_usage.scraping_browser,
                    result.bright_data_usage.web_scraper_api,
                  ]
                    .filter(Boolean)
                    .map((source, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: "var(--green, #22c55e)" }}
                        />
                        <span style={{ color: "var(--on-surface-variant)" }}>
                          {source!.product}
                        </span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── CENTER: RDI + Contradictions ── */}
          <div className="space-y-6">

            {/* RDI Score */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center relative"
            >
              <RDIReveal score={result.rdi_score} animate={true} />
            </motion.div>

            {/* RDI Breakdown */}
            <div className="glass-card p-5">
              <RDIBreakdown components={result.rdi_components} />
            </div>

            {/* Contradictions */}
            {result.contradictions.length > 0 && (
              <div className="glass-card p-5 space-y-3">
                <h3 className="data-label">
                  Contradictions Found ({result.contradictions.length})
                </h3>
                {result.contradictions.slice(0, 3).map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 + 0.5 }}
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: "1px solid var(--outline-variant)",
                      background: "var(--surface-container-lowest)",
                    }}
                  >
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 severity-${c.severity}`}>
                          {c.severity.toUpperCase()}
                        </span>
                        <span
                          className="text-xs leading-snug"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {c.claim}
                        </span>
                      </div>
                      <div
                        className="pl-2"
                        style={{ borderLeft: "2px solid rgba(255,84,81,0.35)" }}
                      >
                        <div
                          className="text-xs mb-0.5"
                          style={{ color: "var(--tertiary)" }}
                        >
                          {c.evidence_source}
                        </div>
                        <div
                          className="text-xs leading-snug"
                          style={{ color: "rgba(255,179,173,0.6)" }}
                        >
                          {c.evidence_text.slice(0, 150)}
                          {c.evidence_text.length > 150 ? "..." : ""}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: DNA + Filing + Timeline ── */}
          <div className="space-y-6">

            {/* Drift DNA */}
            <div className="glass-card p-5">
              <h3 className="data-label mb-4">Drift DNA Fingerprint</h3>
              <DriftDNA dna={result.drift_dna} />
            </div>

            {/* SEC Filing Discrepancy */}
            {result.sec_filing && (
              <FilingDiscrepancyCard filing={result.sec_filing} />
            )}

            {/* Temporal Timeline */}
            {result.temporal_history && result.temporal_history.length >= 2 && (
              <div className="glass-card p-5">
                <DriftTimeline
                  history={result.temporal_history}
                  company={result.company}
                />
              </div>
            )}

            {/* Glassdoor signals */}
            {result.glassdoor_signals && result.glassdoor_signals.esg_mention_count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="glass-card p-5 space-y-3"
              >
                <h3 className="data-label">Employee Sentiment</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <div
                      className="rdi-number text-2xl"
                      style={{ color: "var(--on-surface)" }}
                    >
                      {result.glassdoor_signals.avg_rating ?? "—"}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--outline)" }}
                    >
                      Glassdoor
                    </div>
                  </div>
                  <div>
                    <div
                      className="rdi-number text-2xl"
                      style={{ color: "var(--tertiary)" }}
                    >
                      {Math.round(result.glassdoor_signals.negative_esg_ratio * 100)}%
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--outline)" }}
                    >
                      Negative ESG
                    </div>
                  </div>
                </div>
                {result.glassdoor_signals.sample_reviews?.[0] && (
                  <blockquote
                    className="text-xs italic leading-relaxed pl-3"
                    style={{
                      borderLeft: "2px solid var(--outline-variant)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    &ldquo;{result.glassdoor_signals.sample_reviews[0]}&rdquo;
                  </blockquote>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
