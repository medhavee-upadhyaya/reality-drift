"use client";

import { AppMode } from "@/lib/types";

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center glass-panel rounded-xl p-1 w-fit">
      <button
        onClick={() => onChange("outsider")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-data-label text-data-label uppercase tracking-widest transition-all duration-200 ${
          mode === "outsider"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span className="text-[16px]">🌍</span>
        <span>Outsider View</span>
      </button>
      <button
        onClick={() => onChange("compliance")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-data-label text-data-label uppercase tracking-widest transition-all duration-200 ${
          mode === "compliance"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span className="text-[16px]">🏢</span>
        <span>Internal Compliance</span>
      </button>
    </div>
  );
}
