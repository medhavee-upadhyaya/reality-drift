"use client";

import { motion } from "framer-motion";

const REGION_META: Record<string, { flag: string; left: string; top: string; label: string }> = {
  US: { flag: "🇺🇸", left: "28%", top: "40%", label: "United States" },
  DE: { flag: "🇩🇪", left: "62%", top: "32%", label: "Germany / EU" },
  IN: { flag: "🇮🇳", left: "79%", top: "49%", label: "India" },
  BR: { flag: "🇧🇷", left: "43%", top: "68%", label: "Brazil" },
  SG: { flag: "🇸🇬", left: "84%", top: "61%", label: "Singapore" },
};

interface DriftGlobeProps {
  activeRegions?: string[];
  rdiScore?: number;
}

export default function DriftGlobe({ activeRegions, rdiScore }: DriftGlobeProps) {
  const regions = activeRegions ?? Object.keys(REGION_META);
  const driftColor =
    !rdiScore || rdiScore < 30
      ? "#22c55e"
      : rdiScore < 50
      ? "#eab308"
      : rdiScore < 70
      ? "#f97316"
      : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-[440px] aspect-square isolate"
      >
        <div
          className="absolute inset-[4%] rounded-full blur-3xl opacity-25"
          style={{ background: driftColor }}
        />

        {/* The project Earth asset is a 1024px photorealistic planetary render. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/globe.png"
          alt="Photorealistic Earth showing the monitored global regions"
          className="absolute inset-0 w-full h-full object-contain rounded-full select-none"
          draggable={false}
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M28 40 Q45 18 62 32" fill="none" stroke={driftColor} strokeWidth="0.35" strokeDasharray="1.2 1.2" opacity="0.55" />
          <path d="M62 32 Q73 32 79 49" fill="none" stroke={driftColor} strokeWidth="0.35" strokeDasharray="1.2 1.2" opacity="0.55" />
          <path d="M79 49 Q84 53 84 61" fill="none" stroke={driftColor} strokeWidth="0.35" strokeDasharray="1.2 1.2" opacity="0.55" />
          <path d="M43 68 Q30 56 28 40" fill="none" stroke={driftColor} strokeWidth="0.35" strokeDasharray="1.2 1.2" opacity="0.55" />
        </svg>

        {Object.entries(REGION_META).map(([region, meta], index) => {
          const active = regions.includes(region);
          return (
            <motion.div
              key={region}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: active ? 1 : 0.2, scale: active ? 1 : 0.75 }}
              transition={{ delay: 0.18 + index * 0.08 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: meta.left, top: meta.top }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: driftColor, opacity: 0.38 }}
                />
              )}
              <span
                className="relative flex h-4 w-4 rounded-full border-2 border-white shadow-lg"
                style={{ background: active ? driftColor : "#64748b", boxShadow: active ? `0 0 18px ${driftColor}` : undefined }}
              />
              <span className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap rounded bg-background/90 border border-outline-variant/30 px-2 py-1 font-data-label text-[9px] text-on-surface opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {region} · {meta.label}
              </span>
            </motion.div>
          );
        })}

        <div className="absolute inset-[7%] rounded-full border border-primary/15 pointer-events-none" />
      </motion.div>

      <div className="flex gap-3 flex-wrap justify-center">
        {Object.entries(REGION_META).map(([region, meta]) => {
          const active = regions.includes(region);
          return (
            <div key={region} className={`flex items-center gap-1.5 transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? driftColor : "#64748b" }} />
              <span className="font-data-label text-[10px] text-on-surface-variant">{region}</span>
              <span className="text-xs">{meta.flag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
