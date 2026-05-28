"use client";

import { motion } from "framer-motion";
import { SECFiling } from "@/lib/types";

interface FilingDiscrepancyCardProps {
  filing: SECFiling;
}

export default function FilingDiscrepancyCard({ filing }: FilingDiscrepancyCardProps) {
  if (!filing || !filing.public_claim) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-xl border border-tertiary/30 bg-tertiary/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-tertiary/20 bg-tertiary/5">
        <span className="material-symbols-outlined text-tertiary text-[18px]">warning</span>
        <div>
          <div className="font-data-label text-data-label text-tertiary uppercase tracking-widest">
            Regulatory Filing Discrepancy
          </div>
          <div className="font-data-label text-[10px] text-on-surface-variant">
            {filing.filing_type} filed {filing.filing_date}
          </div>
        </div>
        {filing.delta_numeric !== null && filing.delta_numeric !== undefined && (
          <div className="ml-auto text-right">
            <div className="text-tertiary font-bold rdi-number font-data-value text-[18px] tabular-nums">
              +{filing.delta_numeric}pp
            </div>
            <div className="font-data-label text-[10px] text-outline">delta</div>
          </div>
        )}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 divide-x divide-outline-variant/20">
        <div className="p-4">
          <div className="font-data-label text-[10px] text-outline uppercase tracking-wider mb-2">
            Public Claim
          </div>
          <p className="font-data-label text-[12px] text-on-surface leading-relaxed">
            &ldquo;{filing.public_claim}&rdquo;
          </p>
        </div>
        <div className="p-4">
          <div className="font-data-label text-[10px] text-tertiary/70 uppercase tracking-wider mb-2">
            {filing.filing_type} Filed
          </div>
          <p className="font-data-label text-[12px] text-tertiary/80 leading-relaxed">
            &ldquo;{filing.sec_language}&rdquo;
          </p>
        </div>
      </div>

      {/* Delta description */}
      {filing.delta_description && (
        <div className="px-4 py-3 border-t border-tertiary/15 bg-tertiary/5">
          <p className="font-data-label text-[11px] text-on-surface-variant">{filing.delta_description}</p>
        </div>
      )}
    </motion.div>
  );
}
