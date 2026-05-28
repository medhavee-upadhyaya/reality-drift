"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DriftAlertSettings() {
  const [threshold, setThreshold] = useState(60);
  const [channel, setChannel] = useState<"email" | "slack">("email");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-[18px]">notifications</span>
        <h3 className="font-data-label text-data-label uppercase tracking-widest text-on-surface">
          Drift Alert Settings
        </h3>
      </div>

      <div className="space-y-4">
        {/* Threshold */}
        <div>
          <label className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
            Alert when any region exceeds RDI:
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={20}
              max={90}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="font-data-value tabular-nums text-primary text-[18px] w-8 text-right">
              {threshold}
            </span>
          </div>
        </div>

        {/* Channel */}
        <div>
          <label className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
            Alert channel:
          </label>
          <div className="flex gap-2">
            {(["email", "slack"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`px-3 py-1.5 rounded-lg font-data-label text-[11px] uppercase tracking-wide transition-all ${
                  channel === ch
                    ? "bg-primary text-on-primary"
                    : "glass-panel text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {ch === "email" ? "📧 Email" : "💬 Slack Webhook"}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="font-data-label text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
            Scan frequency:
          </label>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-3 py-1.5 rounded-lg font-data-label text-[11px] uppercase tracking-wide transition-all ${
                  frequency === f
                    ? "bg-primary text-on-primary"
                    : "glass-panel text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-xl bg-primary text-on-primary font-data-label text-data-label uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        >
          Save Settings
        </button>

        {/* Toast */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-data-label text-[11px] text-green-400"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Alert settings saved. You will be notified when drift exceeds {threshold}.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
