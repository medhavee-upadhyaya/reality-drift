"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getRDIColor, getRDILabel } from "@/lib/types";

interface RDIRevealProps {
  score: number;
  animate?: boolean;
}

export default function RDIReveal({ score, animate = true }: RDIRevealProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [revealed, setRevealed] = useState(!animate);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const color = getRDIColor(score);
  const label = getRDILabel(score);

  useEffect(() => {
    if (!animate) return;

    // Delay then count up
    const startDelay = setTimeout(() => {
      setRevealed(true);
      let current = 0;
      const duration = 1800; // ms
      const steps = 60;
      const increment = score / steps;
      const interval = duration / steps;

      timerRef.current = setInterval(() => {
        current += increment;
        if (current >= score) {
          setDisplayScore(score);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setDisplayScore(Math.floor(current));
        }
      }, interval);
    }, 400);

    return () => {
      clearTimeout(startDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [score, animate]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label above */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ delay: 0.2 }}
        className="text-xs uppercase tracking-[0.2em] text-white/40"
      >
        Reality Drift Index
      </motion.div>

      {/* Main score number */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: revealed ? 1 : 0.5, opacity: revealed ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
        className="relative"
      >
        <span
          className="rdi-number text-8xl font-bold leading-none"
          style={{
            color,
            textShadow: `0 0 40px ${color}80`,
          }}
        >
          {displayScore}
        </span>
        <span className="rdi-number text-3xl text-white/30 ml-1">/100</span>
      </motion.div>

      {/* Severity label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 8 }}
        transition={{ delay: 0.8 }}
        className="px-3 py-1 rounded-full text-xs font-semibold tracking-widest"
        style={{
          background: `${color}20`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </motion.div>

      {/* Glow ring */}
      {revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}
