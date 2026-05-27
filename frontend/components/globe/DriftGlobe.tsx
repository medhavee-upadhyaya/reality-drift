"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { REGION_COORDS } from "@/lib/types";

const REGION_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  DE: "🇩🇪",
  IN: "🇮🇳",
  BR: "🇧🇷",
  SG: "🇸🇬",
};

interface DriftGlobeProps {
  activeRegions?: string[];
  rdiScore?: number;
}

// Canvas-based fallback globe for SSR safety
function GlobeCanvas({ activeRegions, rdiScore }: DriftGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);

  // Color based on RDI score
  const driftColor =
    !rdiScore || rdiScore < 30
      ? "#22c55e"
      : rdiScore < 50
      ? "#eab308"
      : rdiScore < 70
      ? "#f97316"
      : "#ef4444";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = ctx; // non-null alias for use inside closure

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38;

    // Project lat/lng to 3D sphere, then to 2D with rotation
    function project(lat: number, lng: number, rotation: number) {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + rotation) * Math.PI) / 180;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = -R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x, y: cy + y, z };
    }

    function drawFrame() {
      draw.clearRect(0, 0, W, H);
      rotationRef.current += 0.15;
      const rot = rotationRef.current;

      // Outer glow
      const grd = draw.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.4);
      grd.addColorStop(0, "rgba(30, 58, 138, 0.08)");
      grd.addColorStop(1, "transparent");
      draw.beginPath();
      draw.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
      draw.fillStyle = grd;
      draw.fill();

      // Globe body
      const sphereGrd = draw.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
      sphereGrd.addColorStop(0, "rgba(15, 35, 80, 0.95)");
      sphereGrd.addColorStop(1, "rgba(5, 10, 24, 0.98)");
      draw.beginPath();
      draw.arc(cx, cy, R, 0, Math.PI * 2);
      draw.fillStyle = sphereGrd;
      draw.fill();

      // Globe border
      draw.beginPath();
      draw.arc(cx, cy, R, 0, Math.PI * 2);
      draw.strokeStyle = "rgba(255, 255, 255, 0.08)";
      draw.lineWidth = 1;
      draw.stroke();

      // Latitude lines
      draw.save();
      draw.beginPath();
      draw.arc(cx, cy, R, 0, Math.PI * 2);
      draw.clip();
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = cy - R * Math.sin((lat * Math.PI) / 180);
        const r = R * Math.cos((lat * Math.PI) / 180);
        draw.beginPath();
        draw.ellipse(cx, y, r, r * 0.25, 0, 0, Math.PI * 2);
        draw.strokeStyle = "rgba(255, 255, 255, 0.04)";
        draw.lineWidth = 0.5;
        draw.stroke();
      }
      // Longitude lines
      for (let lng = 0; lng < 180; lng += 30) {
        const pts: { x: number; y: number }[] = [];
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lng + rot, 0);
          if (p.z >= 0) pts.push({ x: p.x, y: p.y });
        }
        if (pts.length > 1) {
          draw.beginPath();
          draw.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) draw.lineTo(pts[i].x, pts[i].y);
          draw.strokeStyle = "rgba(255, 255, 255, 0.03)";
          draw.lineWidth = 0.5;
          draw.stroke();
        }
        const pts2: { x: number; y: number }[] = [];
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lng + 90 + rot, 0);
          if (p.z >= 0) pts2.push({ x: p.x, y: p.y });
        }
        if (pts2.length > 1) {
          draw.beginPath();
          draw.moveTo(pts2[0].x, pts2[0].y);
          for (let i = 1; i < pts2.length; i++) draw.lineTo(pts2[i].x, pts2[i].y);
          draw.strokeStyle = "rgba(255, 255, 255, 0.03)";
          draw.lineWidth = 0.5;
          draw.stroke();
        }
      }
      draw.restore();

      // Draw arcs between visible pins
      const visiblePins = Object.entries(REGION_COORDS)
        .map(([region, [lat, lng]]) => ({
          region,
          ...project(lat, lng, rot),
          lat,
          lng,
          active: !activeRegions || activeRegions.includes(region),
        }))
        .filter((p) => p.z > -R * 0.2);

      // Draw arcs between active pins
      const activePins = visiblePins.filter((p) => p.active);
      if (activePins.length > 1) {
        for (let i = 0; i < activePins.length - 1; i++) {
          const a = activePins[i];
          const b = activePins[(i + 1) % activePins.length];
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2 - 20;

          draw.beginPath();
          draw.moveTo(a.x, a.y);
          draw.quadraticCurveTo(midX, midY, b.x, b.y);
          draw.strokeStyle = driftColor + "30";
          draw.lineWidth = 0.8;
          draw.stroke();
        }
      }

      // Draw region pins
      for (const pin of visiblePins) {
        const isActive = !activeRegions || activeRegions.includes(pin.region);
        const depth = (pin.z + R) / (2 * R); // 0-1 depth
        const alpha = 0.4 + depth * 0.6;

        if (isActive) {
          // Glow ring
          const glowGrd = draw.createRadialGradient(pin.x, pin.y, 2, pin.x, pin.y, 14);
          glowGrd.addColorStop(0, driftColor + "60");
          glowGrd.addColorStop(1, "transparent");
          draw.beginPath();
          draw.arc(pin.x, pin.y, 14, 0, Math.PI * 2);
          draw.fillStyle = glowGrd;
          draw.fill();
        }

        // Pin dot
        draw.beginPath();
        draw.arc(pin.x, pin.y, isActive ? 5 : 3, 0, Math.PI * 2);
        draw.fillStyle = isActive
          ? driftColor + Math.round(alpha * 255).toString(16).padStart(2, "0")
          : `rgba(255,255,255,${alpha * 0.2})`;
        draw.fill();

        // Region label
        if (isActive && depth > 0.4) {
          draw.font = "bold 10px monospace";
          draw.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
          draw.textAlign = "center";
          draw.fillText(pin.region, pin.x, pin.y - 10);
        }
      }

      animRef.current = requestAnimationFrame(drawFrame);
    }

    animRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animRef.current);
  }, [activeRegions, driftColor]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="w-full h-full"
      style={{ maxWidth: 320, maxHeight: 320 }}
    />
  );
}

export default function DriftGlobe({ activeRegions, rdiScore }: DriftGlobeProps) {
  const [mounted, setMounted] = useState(false);
  const regions = activeRegions ?? ["US", "DE", "IN", "BR", "SG"];

  useEffect(() => {
    setMounted(true);
  }, []);

  const driftColor =
    !rdiScore || rdiScore < 30
      ? "#22c55e"
      : rdiScore < 50
      ? "#eab308"
      : rdiScore < 70
      ? "#f97316"
      : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex items-center justify-center"
        style={{ width: 280, height: 280 }}
      >
        {mounted ? (
          <GlobeCanvas activeRegions={regions} rdiScore={rdiScore} />
        ) : (
          // SSR placeholder
          <div
            className="rounded-full border border-white/8"
            style={{ width: 220, height: 220, background: "rgba(5,10,24,0.95)" }}
          />
        )}
      </motion.div>

      {/* Region pins legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 flex-wrap justify-center"
      >
        {Object.entries(REGION_FLAGS).map(([region, flag], i) => {
          const isActive = regions.includes(region);
          return (
            <motion.div
              key={region}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center gap-1.5 text-xs"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: isActive ? driftColor : "rgba(255,255,255,0.2)" }}
              />
              <span className="text-white/60 font-mono">{region}</span>
              <span className="text-white/30">{flag}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
