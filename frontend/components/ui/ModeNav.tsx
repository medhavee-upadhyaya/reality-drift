"use client";

import { useRouter, usePathname } from "next/navigation";
import { AppMode } from "@/lib/types";

interface ModeNavProps {
  company: string;  // the company slug or param to switch between modes
  currentMode: AppMode;
}

export default function ModeNav({ company, currentMode }: ModeNavProps) {
  const router = useRouter();

  const switchTo = (mode: AppMode) => {
    if (mode === "outsider") {
      router.push(`/analyze/${encodeURIComponent(company)}`);
    } else {
      router.push(`/compliance/${encodeURIComponent(company)}`);
    }
  };

  return (
    <div className="flex items-center gap-1 glass-panel rounded-lg p-0.5">
      <button
        onClick={() => switchTo("outsider")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-data-label text-[10px] uppercase tracking-widest transition-all duration-150 ${
          currentMode === "outsider"
            ? "bg-primary text-on-primary"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span>🌍</span>
        <span>Outsider View</span>
      </button>
      <button
        onClick={() => switchTo("compliance")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-data-label text-[10px] uppercase tracking-widest transition-all duration-150 ${
          currentMode === "compliance"
            ? "bg-primary text-on-primary"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span>🏢</span>
        <span>Internal Compliance</span>
      </button>
    </div>
  );
}
