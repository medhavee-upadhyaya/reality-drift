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
      className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-red-500/20 bg-red-500/8">
        <span className="text-red-400 text-lg">⚠</span>
        <div>
          <div className="text-xs text-red-400 font-semibold uppercase tracking-widest">
            Regulatory Filing Discrepancy
          </div>
          <div className="text-xs text-white/40">
            {filing.filing_type} filed {filing.filing_date}
          </div>
        </div>
        {filing.delta_numeric !== null && filing.delta_numeric !== undefined && (
          <div className="ml-auto text-right">
            <div className="text-red-400 font-bold rdi-number text-lg">
              +{filing.delta_numeric}pp
            </div>
            <div className="text-xs text-white/30">delta</div>
          </div>
        )}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 divide-x divide-white/5">
        <div className="p-4">
          <div className="text-xs text-white/30 uppercase tracking-wider mb-2">
            Public Claim
          </div>
          <p className="text-sm text-white leading-relaxed">
            &ldquo;{filing.public_claim}&rdquo;
          </p>
        </div>
        <div className="p-4">
          <div className="text-xs text-red-400/70 uppercase tracking-wider mb-2">
            {filing.filing_type} Filed
          </div>
          <p className="text-sm text-red-300/80 leading-relaxed">
            &ldquo;{filing.sec_language}&rdquo;
          </p>
        </div>
      </div>

      {/* Delta description */}
      {filing.delta_description && (
        <div className="px-4 py-3 border-t border-red-500/15 bg-red-500/5">
          <p className="text-xs text-white/50">{filing.delta_description}</p>
        </div>
      )}
    </motion.div>
  );
}
