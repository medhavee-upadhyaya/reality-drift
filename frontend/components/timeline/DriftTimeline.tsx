"use client";

import { motion } from "framer-motion";
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

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    const score = payload[0].value;
    const color = getRDIColor(score);
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <div className="text-white/50 mb-1">{label}</div>
        <div className="font-bold rdi-number" style={{ color }}>
          RDI: {score}
        </div>
      </div>
    );
  }
  return null;
}

export default function DriftTimeline({ history, company }: DriftTimelineProps) {
  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-white/20 text-sm">
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
  const trend = latestScore > firstScore ? "↑ Escalating" : "↓ Declining";
  const trendColor = latestScore > firstScore ? "#ef4444" : "#22c55e";

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
          <div className="text-xs text-white/40 uppercase tracking-widest">
            Historical Drift Timeline
          </div>
          <div className="text-sm text-white/60 mt-0.5">
            Powered by Cognee Memory
          </div>
        </div>
        <div
          className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{
            color: trendColor,
            background: `${trendColor}15`,
            border: `1px solid ${trendColor}30`,
          }}
        >
          {trend}
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="score"
              stroke={trendColor}
              strokeWidth={2}
              dot={{ fill: trendColor, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: trendColor, strokeWidth: 2, fill: "#050a18" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-white/25 italic">
        Every scan is institutional memory. You can see whether{" "}
        <span className="text-white/40">{company}</span> is getting more consistent —
        or more deceptive.
      </p>
    </motion.div>
  );
}
