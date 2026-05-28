"use client";

import { motion } from "framer-motion";
import { DriftDNA as DriftDNAType, DRIFT_TYPE_COLORS } from "@/lib/types";

interface DriftDNAProps {
  dna: DriftDNAType;
}

const DNA_BARS = [
  { key: "regulatory_language_pct" as const, label: "Regulatory Language" },
  { key: "commitment_specificity_pct" as const, label: "Commitment Specificity" },
  { key: "omission_pattern_pct" as const, label: "Omission Pattern" },
  { key: "tone_variation_pct" as const, label: "Tone Variation" },
];

export default function DriftDNA({ dna }: DriftDNAProps) {
  const driftColor = DRIFT_TYPE_COLORS[dna.dominant_drift_type] || "#6b7280";

  return (
    <div className="space-y-4">
      {/* Dominant drift type badge */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: driftColor, boxShadow: `0 0 8px ${driftColor}` }}
        />
        <div>
          <div className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest">
            Dominant Drift Type
          </div>
          <div className="font-data-label text-data-label font-semibold" style={{ color: driftColor }}>
            {dna.dominant_drift_type}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-outline-variant/20 mb-4" />

      {/* DNA bars */}
      <div className="space-y-3">
        {DNA_BARS.map(({ key, label }, i) => {
          const value = dna[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 + 0.3 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-data-label text-data-label text-on-surface-variant">{label}</span>
                <span className="rdi-number font-data-value text-data-value text-on-surface tabular-nums">{value}%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ delay: i * 0.12 + 0.5, duration: 1.0, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${driftColor}80, ${driftColor})`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
