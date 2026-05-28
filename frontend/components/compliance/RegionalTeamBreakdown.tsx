"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisResult, Contradiction } from "@/lib/types";

interface RegionalTeamBreakdownProps {
  result: AnalysisResult;
}

const REGION_META: Record<string, { flag: string; label: string }> = {
  US: { flag: "🇺🇸", label: "US HQ" },
  DE: { flag: "🇩🇪", label: "Germany" },
  IN: { flag: "🇮🇳", label: "India" },
  BR: { flag: "🇧🇷", label: "Brazil" },
  SG: { flag: "🇸🇬", label: "Singapore" },
};

function getDriftScore(region: string, result: AnalysisResult): number {
  // Score = how much this region drifts from US HQ baseline
  // US = 0 (baseline), others based on claim count and contradiction involvement
  if (region === "US") return 0;
  const page = result.regional_pages[region];
  if (!page) return 0;
  const claimCount = page.claims?.length ?? 0;
  const regionContradictions = result.contradictions.filter(
    (c) => c.region_source === region
  ).length;
  // Rough formula: contradictions drive score up, claims without issues drive it down
  const base = Math.min(100, regionContradictions * 25 + claimCount * 8);
  return Math.min(100, base);
}

function getStatusLabel(score: number): { label: string; color: string; dot: string } {
  if (score >= 70) return { label: "HIGH", color: "text-tertiary", dot: "bg-tertiary" };
  if (score >= 35) return { label: "MOD", color: "text-yellow-400", dot: "bg-yellow-400" };
  return { label: "LOW", color: "text-green-400", dot: "bg-green-400" };
}

export default function RegionalTeamBreakdown({ result }: RegionalTeamBreakdownProps) {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const regions = Object.keys(REGION_META);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
        <div>
          <h3 className="font-data-label text-data-label uppercase tracking-widest text-on-surface">
            Regional Team Consistency
          </h3>
          <p className="font-data-label text-[10px] text-on-surface-variant mt-0.5">
            Drift measured against US HQ baseline
          </p>
        </div>
        <span className="font-data-label text-[10px] text-primary/60 uppercase animate-pulse-drift">
          LIVE
        </span>
      </div>

      {/* Table */}
      <div>
        {/* Header row */}
        <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-outline-variant/10 font-data-label text-[9px] uppercase text-outline tracking-widest">
          <span>Region</span>
          <span>Domain</span>
          <span>Score</span>
          <span>Status</span>
        </div>

        {/* Data rows */}
        {regions.map((region, i) => {
          const meta = REGION_META[region];
          const page = result.regional_pages[region];
          const domain = page?.url ? new URL(page.url).hostname.replace("www.", "") : `${result.url.replace(/https?:\/\//, "").split("/")[0]}`;
          const isUS = region === "US";
          const score = getDriftScore(region, result);
          const status = getStatusLabel(score);
          const regionContradictions = result.contradictions.filter(c => c.region_source === region);
          const isExpanded = expandedRegion === region;

          return (
            <div key={region}>
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setExpandedRegion(isExpanded ? null : region)}
                className="w-full grid grid-cols-4 gap-2 px-4 py-3 hover:bg-surface-container/30 transition-colors text-left border-b border-outline-variant/5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{meta.flag}</span>
                  <span className="font-data-label text-[11px] text-on-surface-variant">{meta.label}</span>
                </div>
                <div className="font-data-value text-[11px] text-on-surface truncate">{domain}</div>
                <div className="font-data-value tabular-nums text-[11px]">
                  {isUS ? (
                    <span className="text-primary">Baseline</span>
                  ) : (
                    <span style={{ color: status.dot.replace("bg-", "") === "bg-tertiary" ? "rgb(var(--color-tertiary))" : status.dot.replace("bg-", "") === "bg-yellow-400" ? "#facc15" : "#4ade80" }}>
                      {score}/100
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                  <span className={`font-data-label text-[10px] uppercase ${status.color}`}>
                    {isUS ? "Base" : status.label}
                  </span>
                  {regionContradictions.length > 0 && !isUS && (
                    <span className="material-symbols-outlined text-[12px] text-tertiary ml-auto">expand_more</span>
                  )}
                </div>
              </motion.button>

              {/* Expanded contradictions for this region */}
              <AnimatePresence>
                {isExpanded && regionContradictions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-surface-container/20 border-b border-outline-variant/10"
                  >
                    <div className="px-4 py-3 space-y-2">
                      <p className="font-data-label text-[10px] text-on-surface-variant uppercase mb-2">
                        Contradictions in {meta.label}
                      </p>
                      {regionContradictions.map((c, j) => (
                        <div
                          key={j}
                          className={`border-l-2 pl-3 py-1 ${
                            c.severity === "high" ? "border-tertiary/60" : "border-yellow-500/40"
                          }`}
                        >
                          <div className={`font-data-label text-[9px] uppercase mb-0.5 ${
                            c.severity === "high" ? "text-tertiary" : "text-yellow-400"
                          }`}>
                            {c.severity.toUpperCase()} · {c.contradiction_type.replace("_", " ")}
                          </div>
                          <p className="font-data-label text-[11px] text-on-surface leading-snug">
                            {c.claim.slice(0, 120)}{c.claim.length > 120 ? "…" : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {isExpanded && regionContradictions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-surface-container/20 border-b border-outline-variant/10"
                  >
                    <div className="px-4 py-3">
                      <p className="font-data-label text-[11px] text-green-400">
                        ✓ No contradictions detected for this region
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
