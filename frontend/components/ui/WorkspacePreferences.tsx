"use client";

import { useEffect } from "react";
import { getWorkspacePreferences } from "@/lib/workspace";

export default function WorkspacePreferences() {
  useEffect(() => {
    const apply = () => {
      const preferences = getWorkspacePreferences();
      document.documentElement.classList.toggle("compact-mode", preferences.compactMode);
    };
    apply();
    window.addEventListener("rd-workspace-change", apply);
    return () => window.removeEventListener("rd-workspace-change", apply);
  }, []);
  return null;
}
