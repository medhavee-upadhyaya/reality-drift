// preloaded.ts — Detect pre-loaded companies and serve their data directly
// from the static JSON files in /public/preloaded/ as a fallback
// when the backend is unavailable.

import { AnalysisResult } from "./types";

// Map of URLs and names → slugs for pre-loaded companies
const PRELOADED_MAP: Record<string, string> = {
  // URL-based detection
  "shell.com": "shell",
  "shell": "shell",
  "nike.com": "nike",
  "nike": "nike",
  "hmgroup.com": "hm",
  "h&m": "hm",
  "hm": "hm",
};

export function getPreloadedSlug(urlOrName: string): string | null {
  const normalized = urlOrName.toLowerCase().trim();
  for (const [key, slug] of Object.entries(PRELOADED_MAP)) {
    if (normalized.includes(key)) {
      return slug;
    }
  }
  return null;
}

export async function getPreloadedResult(slug: string): Promise<AnalysisResult | null> {
  try {
    const res = await fetch(`/preloaded/${slug}.json`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const DEMO_COMPANIES = [
  {
    slug: "shell",
    name: "Shell",
    rdi: 84,
    driftType: "Regulatory Arbitrage",
    color: "#ef4444",
    hook: "Tells regulators one number, consumers another",
  },
  {
    slug: "nike",
    name: "Nike",
    rdi: 71,
    driftType: "Supply Chain Omission",
    color: "#f97316",
    hook: "Supplier violations absent from all public claims",
  },
  {
    slug: "hm",
    name: "H&M",
    rdi: 78,
    driftType: "Legal Greenwashing",
    color: "#a855f7",
    hook: "Guilty in Norway, messaging identically globally",
  },
];
