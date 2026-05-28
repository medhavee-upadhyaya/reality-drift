"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnalysisResult, AppMode, RecommendedActionsResult } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RecommendedActionsProps {
  result: AnalysisResult;
  mode: AppMode;
}

/* ── Static fallback copy ── */
const OUTSIDER_FALLBACK: RecommendedActionsResult = {
  urgent: [
    "Flag for ESG fund exclusion pending remediation of identified contradictions",
    "Request binding interim target disclosure from investor relations",
  ],
  this_week: [
    "Attach this Reality Drift report to due diligence file with contradictions highlighted",
    "Set 90-day re-scan alert to monitor if narrative drift escalates",
  ],
  next_quarter: [
    "Add ESG narrative consistency clause to supplier and partner contracts",
  ],
};

const INTERNAL_FALLBACK: RecommendedActionsResult = {
  urgent: [
    "Review flagged regional pages and remove or align claims that contradict SEC filing language",
    "Brief regional marketing teams on the identified narrative gaps within 48 hours",
  ],
  this_week: [
    "Align all interim target language across regional pages to match regulatory filing wording",
    "Set RDI threshold alert at 60 — receive notification if any region exceeds this drift level",
  ],
  next_quarter: [
    "Establish a global sustainability claims baseline document all regional teams must align to before publishing",
  ],
};

const TIER_CONFIG = {
  urgent:       { label: "🔴 Urgent — Act Within 48 Hours",  border: "border-tertiary/30", bg: "bg-tertiary/5"   },
  this_week:    { label: "🟡 This Week",                     border: "border-yellow-500/30", bg: "bg-yellow-500/5" },
  next_quarter: { label: "🟢 Next Quarter",                  border: "border-green-500/30", bg: "bg-green-500/5"  },
} as const;

export default function RecommendedActions({ result, mode }: RecommendedActionsProps) {
  const [actions, setActions] = useState<RecommendedActionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, [result.analysis_id, mode]);

  async function fetchActions() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/compliance/recommended-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: result.company,
          contradictions: result.contradictions.slice(0, 8).map((c) => ({
            claim: c.claim,
            evidence_source: c.evidence_source,
            severity: c.severity,
            region_source: c.region_source,
          })),
          mode,
          rdi_score: result.rdi_score,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: RecommendedActionsResult = await resp.json();
      // If all tiers empty, use fallback
      if (!data.urgent.length && !data.this_week.length && !data.next_quarter.length) {
        setActions(mode === "outsider" ? OUTSIDER_FALLBACK : INTERNAL_FALLBACK);
      } else {
        setActions(data);
      }
    } catch {
      setActions(mode === "outsider" ? OUTSIDER_FALLBACK : INTERNAL_FALLBACK);
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "outsider" ? "Recommended Actions" : "Priority Actions for Your Team";
  const icon = mode === "outsider" ? "assignment" : "task_alt";

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
        <span className={`material-symbols-outlined text-primary text-[18px]`}>{icon}</span>
        <h3 className="font-data-label text-data-label uppercase tracking-widest text-on-surface">
          {title}
        </h3>
        {mode === "outsider" && (
          <div className="ml-auto flex gap-2">
            {["ESG Fund Manager", "Enterprise Procurement", "Compliance / Audit"].map((role) => (
              <span key={role} className="font-data-label text-[9px] text-on-surface-variant/60 border border-outline-variant/20 rounded px-1.5 py-0.5">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-4 py-6 text-on-surface-variant">
          <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          <span className="font-data-label text-[11px] uppercase">Generating priority actions...</span>
        </div>
      ) : actions ? (
        <div className="divide-y divide-outline-variant/10">
          {(["urgent", "this_week", "next_quarter"] as const).map((tier) => {
            const items = actions[tier];
            if (!items.length) return null;
            const tcfg = TIER_CONFIG[tier];
            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: tier === "urgent" ? 0.1 : tier === "this_week" ? 0.2 : 0.3 }}
                className={`px-4 py-3 border-l-4 ${tcfg.border} ${tcfg.bg}`}
              >
                <div className="font-data-label text-[10px] uppercase tracking-widest text-on-surface mb-2">
                  {tcfg.label}
                </div>
                <div className="space-y-1.5">
                  {items.map((action, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-on-surface-variant font-data-label text-[12px] flex-shrink-0 mt-0.5">→</span>
                      <p className="font-data-label text-[12px] text-on-surface leading-snug">{action}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
