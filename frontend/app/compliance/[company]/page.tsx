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
import DriftTimeline from "@/components/timeline/DriftTimeline";
import FilingDiscrepancyCard from "@/components/filing/FilingDiscrepancyCard";
import LiveAnalysisProgress from "@/components/search/LiveAnalysisProgress";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import ModeNav from "@/components/ui/ModeNav";
import RegionalTeamBreakdown from "@/components/compliance/RegionalTeamBreakdown";
import PrePublishChecker from "@/components/compliance/PrePublishChecker";
import DriftAlertSettings from "@/components/compliance/DriftAlertSettings";
import RegulatoryReadiness from "@/components/compliance/RegulatoryReadiness";
import RecommendedActions from "@/components/compliance/RecommendedActions";

export default function CompliancePage() {
  const params       = useParams();
  const router       = useRouter();
  const companyParam = decodeURIComponent(params.company as string);

  const [result,         setResult]         = useState<AnalysisResult | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [currentStep,    setCurrentStep]    = useState<AnalysisStep | null>(null);
  const [progress,       setProgress]       = useState(0);
  const [isLive,         setIsLive]         = useState(false);

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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg glass-panel p-8 rounded-2xl">
            <div className="text-center mb-8">
              <div className="font-data-label text-[10px] text-primary uppercase tracking-widest mb-2">
                🏢 Internal Compliance Mode
              </div>
              <div className="font-headline-md text-headline-md text-on-surface font-bold mb-1">
                {isLive ? "Running Compliance Check" : "Loading Compliance File..."}
              </div>
              <div className="font-data-value text-data-value text-outline">{companyParam}</div>
            </div>
            {isLive ? (
              <LiveAnalysisProgress events={progressEvents} currentStep={currentStep} progress={progress} />
            ) : (
              <div className="flex items-center justify-center gap-3 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="font-data-label text-data-label uppercase">Fetching compliance data...</span>
              </div>
            )}
          </div>
        </div>
        <StatusBar />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-[64px] text-tertiary">warning</span>
            <div className="font-headline-md text-headline-md text-on-surface font-bold">Compliance Check Failed</div>
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

  const rdiColor   = getRDIColor(result.rdi_score);
  const rdiLabel   = getRDILabel(result.rdi_score);
  const scanTime   = new Date(result.timestamp).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const urgencyMsg = result.rdi_score >= 70
    ? "⚠️ HIGH — Action Required\nYour regional teams are publishing materially inconsistent sustainability claims. Recommended: Review flagged regions within 48 hours before external audit exposure."
    : result.rdi_score >= 50
    ? "🟡 MODERATE — Review Recommended\nSome regional inconsistencies detected. Schedule a review of flagged pages with your regional leads this week."
    : "✅ LOW — Looking Good\nNarrative consistency is within acceptable bounds. Maintain current review cadence.";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ══════════════════════════════════════
            LEFT SIDEBAR
            ══════════════════════════════════════ */}
        <aside className="w-64 flex-shrink-0 bg-surface-container-low/90 backdrop-blur-md border-r border-outline-variant/10 flex flex-col z-30">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/10">
            <div className="font-data-label text-[10px] text-primary uppercase tracking-widest mb-1">
              🏢 Internal Compliance
            </div>
            <div className="font-headline-md text-headline-sm text-on-surface font-bold">
              {result.company.toUpperCase()}
            </div>
            <div className="font-data-label text-[10px] text-on-surface-variant mt-1">
              Last scanned: {scanTime}
            </div>
          </div>

          {/* Quick nav */}
          <nav className="flex-1 overflow-y-auto py-2">
            {[
              { icon: "dashboard",     label: "Overview",          section: "section-overview"  },
              { icon: "table_chart",   label: "Regional Breakdown", section: "section-regional"  },
              { icon: "edit_note",     label: "Pre-Publish Check",  section: "section-checker"   },
              { icon: "shield",        label: "Reg. Readiness",     section: "section-readiness" },
              { icon: "notifications", label: "Alert Settings",     section: "section-alerts"    },
              { icon: "history",       label: "Drift History",      section: "section-history"   },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = document.getElementById(item.section);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span className="font-data-label text-data-label uppercase">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Re-scan + back */}
          <div className="p-4 space-y-2 border-t border-outline-variant/10">
            <button
              onClick={() => loadAnalysis()}
              className="w-full bg-primary text-on-primary py-2 rounded-xl font-data-label text-data-label uppercase hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Re-scan Now
            </button>
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
            MAIN CONTENT
            ══════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto pb-10">
          {/* Mode switcher bar */}
          <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-outline-variant/10 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ModeNav company={companyParam} currentMode="compliance" />
              <span className="font-data-label text-[10px] text-on-surface-variant uppercase hidden md:block">
                {result.company} — Compliance Dashboard
              </span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="glass-panel px-3 py-1.5 rounded-lg font-data-label text-[10px] uppercase text-on-surface-variant hover:text-primary transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Analysis
            </button>
          </div>

          {/* Demo label (hidden in presentation mode) */}
          {result.is_preloaded && (
            <div className="demo-data-label text-center py-1">
              <span className="font-data-label text-[9px] text-outline italic">
                Demo data — pre-loaded for presentation
              </span>
            </div>
          )}

          <div className="p-6 space-y-6 max-w-6xl mx-auto">

            {/* ── Panel 1: Narrative Consistency Overview ── */}
            <motion.div
              id="section-overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* RDI Score */}
                <div className="flex flex-col items-center justify-center py-4 border-r border-outline-variant/10">
                  <RDIReveal score={result.rdi_score} animate />
                </div>

                {/* Framing copy */}
                <div className="md:col-span-2 flex flex-col justify-center gap-3">
                  <div>
                    <div className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                      Internal Compliance Assessment
                    </div>
                    <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tighter">
                      {result.company}
                    </h1>
                  </div>

                  {/* Urgency message */}
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      borderColor: `${rdiColor}30`,
                      background: `${rdiColor}08`,
                    }}
                  >
                    {urgencyMsg.split("\n").map((line, i) => (
                      <p key={i} className={`font-data-label ${i === 0 ? "text-[13px] font-bold mb-1" : "text-[11px] text-on-surface-variant leading-relaxed"}`}
                        style={i === 0 ? { color: rdiColor } : {}}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Sub-score breakdown */}
                  <RDIBreakdown components={result.rdi_components} />
                </div>
              </div>
            </motion.div>

            {/* ── Panel 2: Regional Team Breakdown ── */}
            <motion.div
              id="section-regional"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RegionalTeamBreakdown result={result} />
            </motion.div>

            {/* ── Panel 3: Pre-Publish Checker (most important) ── */}
            <motion.div
              id="section-checker"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PrePublishChecker result={result} />
            </motion.div>

            {/* ── Two-col: Regulatory Readiness + Alert Settings ── */}
            <div id="section-readiness" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <RegulatoryReadiness result={result} />
              </motion.div>

              <motion.div
                id="section-alerts"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-4"
              >
                <DriftAlertSettings />

                {/* Drift DNA */}
                <div className="glass-panel p-4 rounded-xl">
                  <h3 className="font-data-label text-data-label uppercase text-on-surface-variant mb-3 tracking-widest">
                    Drift DNA Fingerprint
                  </h3>
                  <DriftDNA dna={result.drift_dna} />
                </div>
              </motion.div>
            </div>

            {/* ── Filing Discrepancy (if exists) ── */}
            {result.sec_filing && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="font-data-label text-data-label uppercase text-on-surface-variant mb-2 tracking-widest">
                  Regulatory Filing Discrepancy
                </div>
                <FilingDiscrepancyCard filing={result.sec_filing} />
              </motion.div>
            )}

            {/* ── Cognee Timeline (reframed) ── */}
            {result.temporal_history && result.temporal_history.length >= 2 && (
              <motion.div
                id="section-history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="glass-panel p-6 rounded-2xl"
              >
                <div className="font-data-label text-data-label uppercase text-on-surface-variant mb-1 tracking-widest">
                  Compliance History
                </div>
                <p className="font-data-label text-[11px] text-outline mb-4">
                  Every scan is stored as institutional memory. Full audit trail on demand.
                </p>
                <DriftTimeline history={result.temporal_history} company={result.company} />
              </motion.div>
            )}

            {/* ── Recommended Actions (internal mode) ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <RecommendedActions result={result} mode="compliance" />
            </motion.div>

          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
