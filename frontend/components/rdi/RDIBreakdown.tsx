"use client";

import { motion } from "framer-motion";
import { RDIComponents, getRDIColor } from "@/lib/types";

interface RDIBreakdownProps {
  components: RDIComponents;
}

const COMPONENT_LABELS = {
  geographic_drift: { label: "Geographic Drift", weight: "30%", desc: "Variance across regions" },
  claim_evidence: { label: "Claim vs Evidence", weight: "35%", desc: "Contradicted claims ratio" },
  temporal_drift: { label: "Temporal Drift", weight: "20%", desc: "Change over time" },
  disclosure_gap: { label: "Disclosure Gap", weight: "15%", desc: "Public vs regulatory filing" },
};

export default function RDIBreakdown({ components }: RDIBreakdownProps) {
  const entries = Object.entries(components) as [keyof typeof COMPONENT_LABELS, { score: number; weight: number; weighted: number }][];

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">
        Score Breakdown
      </h3>
      {entries.map(([key, component], i) => {
        const meta = COMPONENT_LABELS[key];
        const color = getRDIColor(component.score);
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.5 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">{meta.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white/30">{meta.weight}</span>
                <span className="rdi-number font-medium" style={{ color }}>
                  {component.score}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${component.score}%` }}
                transition={{ delay: i * 0.1 + 0.7, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
