"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProgressEvent, AnalysisStep } from "@/lib/types";

interface LiveAnalysisProgressProps {
  events: ProgressEvent[];
  currentStep: AnalysisStep | null;
  progress: number;
}

const STEP_CONFIG: Record<AnalysisStep, { label: string; icon: string }> = {
  geo_fetch: { label: "Fetching 5 regional pages", icon: "🌍" },
  sec_scrape: { label: "Retrieving SEC regulatory filing", icon: "📋" },
  news_scrape: { label: "Scanning violations & news", icon: "📰" },
  glassdoor_scrape: { label: "Analyzing employee sentiment", icon: "👥" },
  claude_analyze: { label: "Claude extracting claims & contradictions", icon: "🧠" },
  scoring: { label: "Computing Reality Drift Index", icon: "⚡" },
  cognee_store: { label: "Storing in institutional memory", icon: "🧬" },
  done: { label: "Analysis complete", icon: "✅" },
  error: { label: "Analysis failed", icon: "❌" },
};

const STEP_ORDER: AnalysisStep[] = [
  "geo_fetch",
  "sec_scrape",
  "news_scrape",
  "glassdoor_scrape",
  "claude_analyze",
  "scoring",
  "cognee_store",
  "done",
];

export default function LiveAnalysisProgress({
  events,
  currentStep,
  progress,
}: LiveAnalysisProgressProps) {
  const completedSteps = new Set(events.map((e) => e.step));

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/40">
          <span>Analyzing...</span>
          <span className="rdi-number">{progress}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEP_ORDER.filter(s => s !== "done").map((step, i) => {
          const config = STEP_CONFIG[step];
          const isCompleted = completedSteps.has(step);
          const isCurrent = currentStep === step;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                isCompleted
                  ? "text-white/70"
                  : isCurrent
                  ? "text-white"
                  : "text-white/20"
              }`}
            >
              <span className="text-base w-5 text-center">
                {isCompleted ? "✓" : isCurrent ? config.icon : "○"}
              </span>
              <span className={isCurrent ? "font-medium" : ""}>{config.label}</span>
              {isCurrent && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="ml-auto text-xs text-blue-400"
                >
                  Running...
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Latest message */}
      {events.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={events[events.length - 1].message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-white/30 italic"
          >
            {events[events.length - 1].message}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
