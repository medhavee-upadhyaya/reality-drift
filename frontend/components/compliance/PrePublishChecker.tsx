"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisResult, ComplianceCheckResult, ComplianceVerdict } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PrePublishCheckerProps {
  result: AnalysisResult;
}

const REGIONS = ["US", "DE", "IN", "BR", "SG", "ALL"];

const VERDICT_CONFIG: Record<ComplianceVerdict, {
  icon: string;
  label: string;
  color: string;
  bg: string;
}> = {
  CLEAR: {
    icon: "check_circle",
    label: "CLEAR — Safe to publish",
    color: "text-green-400",
    bg: "border-green-500/30 bg-green-500/5",
  },
  MINOR_DRIFT: {
    icon: "warning",
    label: "MINOR DRIFT — Review recommended",
    color: "text-yellow-400",
    bg: "border-yellow-500/30 bg-yellow-500/5",
  },
  CONFLICT: {
    icon: "dangerous",
    label: "CONFLICT DETECTED — Do not publish",
    color: "text-tertiary",
    bg: "border-tertiary/30 bg-tertiary/5",
  },
};

export default function PrePublishChecker({ result }: PrePublishCheckerProps) {
  const [draftClaim, setDraftClaim] = useState("");
  const [targetRegion, setTargetRegion] = useState("ALL");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<ComplianceCheckResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleCheck = async () => {
    if (!draftClaim.trim()) return;
    setChecking(true);
    setCheckResult(null);

    // Build existing claims from analysis result
    const existingClaims: Record<string, string[]> = {};
    for (const [region, page] of Object.entries(result.regional_pages)) {
      if (page.claims?.length) existingClaims[region] = page.claims.slice(0, 5);
    }

    try {
      const resp = await fetch(`${API_BASE}/api/compliance/check-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: result.company,
          draft_claim: draftClaim,
          target_region: targetRegion,
          existing_claims: existingClaims,
          sec_language: result.sec_filing?.sec_language ?? "",
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: ComplianceCheckResult = await resp.json();
      setCheckResult(data);
      setExpanded(false);
    } catch (err) {
      console.error("Compliance check failed:", err);
      setCheckResult({
        verdict: "MINOR_DRIFT",
        risk_level: "MODERATE",
        conflicts: [],
        recommendation: "Check service unavailable — please review manually.",
      });
    } finally {
      setChecking(false);
    }
  };

  const cfg = checkResult ? VERDICT_CONFIG[checkResult.verdict] : null;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[18px]">edit_note</span>
        <div>
          <h3 className="font-data-label text-data-label uppercase tracking-widest text-on-surface">
            Pre-Publish Compliance Check
          </h3>
          <p className="font-data-label text-[10px] text-on-surface-variant">
            Before your team publishes a new sustainability claim, check it here first.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Textarea */}
        <textarea
          value={draftClaim}
          onChange={(e) => setDraftClaim(e.target.value)}
          placeholder="Paste your draft claim here..."
          rows={4}
          className="w-full bg-surface-container/40 border border-outline-variant/20 rounded-xl p-3 font-data-label text-[12px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
        />

        {/* Region selector + button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-data-label text-[10px] text-on-surface-variant uppercase mr-1">Region:</span>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setTargetRegion(r)}
                className={`px-2 py-1 rounded-md font-data-label text-[10px] uppercase transition-all ${
                  targetRegion === r
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleCheck}
            disabled={!draftClaim.trim() || checking}
            className="ml-auto bg-primary text-on-primary px-4 py-2 rounded-xl font-data-label text-data-label uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center gap-2"
          >
            {checking ? (
              <>
                <div className="w-3 h-3 border-2 border-on-primary/50 border-t-on-primary rounded-full animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">policy</span>
                Check Compliance
              </>
            )}
          </button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {checkResult && cfg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl border overflow-hidden ${cfg.bg}`}
            >
              {/* Verdict header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${cfg.color}`}>
                    {cfg.icon}
                  </span>
                  <span className={`font-data-label text-data-label uppercase tracking-widest font-bold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                {checkResult.conflicts.length > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="font-data-label text-[10px] text-on-surface-variant uppercase flex items-center gap-1"
                  >
                    {checkResult.conflicts.length} conflict{checkResult.conflicts.length !== 1 ? "s" : ""}
                    <span className="material-symbols-outlined text-[14px]">
                      {expanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                )}
              </div>

              {/* Recommendation */}
              <div className="px-4 pb-3">
                <p className="font-data-label text-[11px] text-on-surface-variant">
                  → {checkResult.recommendation}
                </p>
              </div>

              {/* Expanded conflicts */}
              <AnimatePresence>
                {expanded && checkResult.conflicts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-outline-variant/20"
                  >
                    <div className="px-4 py-3 space-y-3">
                      {checkResult.conflicts.map((conflict, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-data-label text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${cfg.color} bg-current/10`}>
                              {conflict.type.replace("_", " ")}
                            </span>
                            <span className="font-data-label text-[10px] text-on-surface-variant">
                              vs. {conflict.conflicting_source}
                            </span>
                          </div>
                          <p className="font-data-label text-[11px] text-on-surface leading-snug">
                            {conflict.description}
                          </p>
                          {conflict.specific_text && (
                            <p className="font-data-label text-[10px] text-outline italic border-l border-outline-variant/30 pl-2">
                              &ldquo;{conflict.specific_text.slice(0, 120)}{conflict.specific_text.length > 120 ? "…" : ""}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
