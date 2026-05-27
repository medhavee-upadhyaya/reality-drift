"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("rd-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved !== null ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.className = dark ? "dark" : "light";
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.className = next ? "dark" : "light";
    localStorage.setItem("rd-theme", next ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <button className="w-9 h-9 flex items-center justify-center opacity-0">
        <span className="material-symbols-outlined text-[20px]">light_mode</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all duration-150"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
