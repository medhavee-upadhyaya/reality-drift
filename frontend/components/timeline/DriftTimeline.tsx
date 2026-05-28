"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TemporalPoint, getRDIColor } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DriftTimelineProps {
  history: TemporalPoint[];
  company: string;
}

/** Read a CSS variable (RGB triplet like "173 198 255") and return it as rgba(...) */
function cssRgba(varName: string, alpha = 1): string {
  if (typeof window === "undefined") return `rgba(130,140,160,${alpha})`;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  if (!val) return `rgba(130,140,160,${alpha})`;
  return `rgba(${val.split(" ").join(",")},${alpha})`;
}

interface ChartTheme {
  grid: string;
  tick: string;
  activeDotFill: string;
  refLine: string;
  escalatingColor: string;
  decliningColor: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    const score = payload[0].value;
    const color = getRDIColor(score);
    return (
      <div className="glass-panel px-3 py-2">
        <div className="font-data-label text-[10px] text-on-surface-variant mb-1">{label}</div>
        <div className="font-data-value tabular-nums font-bold rdi-number" style={{ color }}>
          RDI: {score}
        </div>
      </div>
    );
  }
  return null;
}

export default function DriftTimeline({ history, company }: DriftTimelineProps) {
  const [chartTheme, setChartTheme] = useState<ChartTheme>({
    grid: "rgba(100,120,160,0.1)",
    tick: "rgba(120,140,180,0.5)",
    activeDotFill: "#050b1a",
    refLine: "rgba(239,68,68,0.2)",
    escalatingColor: "#ef4444",
    decliningColor: "#22c55e",
  });

  useEffect(() => {
    setChartTheme({
      grid: cssRgba("--color-outline-variant", 0.15),
      tick: cssRgba("--color-on-surface-variant", 0.6),
      activeDotFill: cssRgba("--color-background", 1),
      refLine: cssRgba("--color-tertiary", 0.2),
      escalatingColor: cssRgba("--color-tertiary", 1),
      decliningColor: "#22c55e",
    });
  }, []);

  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 font-data-label text-data-label text-outline">
        Insufficient history for timeline (need 2+ scans)
      </div>
    );
  }

  const data = history.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: point.rdi_score,
    analysis_id: point.analysis_id,
  }));

  const latestScore = data[data.length - 1].score;
  const firstScore = data[0].score;
  const isEscalating = latestScore > firstScore;
  const trend = isEscalating ? "↑ Escalating" : "↓ Declining";
  const trendColor = isEscalating ? chartTheme.escalatingColor : chartTheme.decliningColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest">
            Historical Drift Timeline
          </div>
          <div className="font-data-label text-[11px] text-outline mt-0.5">
            Powered by Cognee Memory
          </div>
        </div>
        <div
          className="font-data-label text-data-label px-2 py-1 rounded-full"
          style={{
            color: trendColor,
            background: `${trendColor.replace("rgba(", "rgba(").replace(/,[^,)]+\)$/, ",0.12)")}`,
            border: `1px solid ${trendColor.replace(/,[^,)]+\)$/, ",0.3)")}`,
          }}
        >
          {trend}
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis
              dataKey="date"
              tick={{ fill: chartTheme.tick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: chartTheme.tick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke={chartTheme.refLine} strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="score"
              stroke={trendColor}
              strokeWidth={2}
              dot={{ fill: trendColor, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: trendColor, strokeWidth: 2, fill: chartTheme.activeDotFill }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="font-data-label text-[11px] text-outline italic">
        Every scan is institutional memory. You can see whether{" "}
        <span className="text-on-surface-variant">{company}</span> is getting more consistent —
        or more deceptive.
      </p>
    </motion.div>
  );
}
