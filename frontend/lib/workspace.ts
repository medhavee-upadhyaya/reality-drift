import { AnalysisResult } from "./types";

export interface ArchiveEntry {
  company: string;
  slug: string;
  rdi: number;
  driftType: string;
  analyzedAt: string;
  source: "demo" | "live";
}

export interface AlertPreferences {
  threshold: number;
  channel: "email" | "slack";
  frequency: "daily" | "weekly" | "monthly";
  enabled: boolean;
}

export interface WorkspacePreferences {
  compactMode: boolean;
  showDemoLabels: boolean;
  defaultMode: "outsider" | "compliance";
}

const ARCHIVE_KEY = "rd-analysis-archive";
export const ALERTS_KEY = "rd-alert-settings";
export const WORKSPACE_KEY = "rd-workspace-settings";

export const DEFAULT_ALERTS: AlertPreferences = {
  threshold: 60,
  channel: "email",
  frequency: "weekly",
  enabled: true,
};

export const DEFAULT_WORKSPACE: WorkspacePreferences = {
  compactMode: false,
  showDemoLabels: true,
  defaultMode: "outsider",
};

export function saveAnalysisToArchive(result: AnalysisResult, slug: string) {
  if (typeof window === "undefined") return;
  const current = getArchive();
  const entry: ArchiveEntry = {
    company: result.company,
    slug,
    rdi: result.rdi_score,
    driftType: result.drift_dna.dominant_drift_type,
    analyzedAt: result.timestamp,
    source: result.is_preloaded ? "demo" : "live",
  };
  const deduped = current.filter((item) => !(item.slug === slug && item.analyzedAt === entry.analyzedAt));
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify([entry, ...deduped].slice(0, 100)));
}

export function getArchive(): ArchiveEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearArchive() {
  localStorage.removeItem(ARCHIVE_KEY);
}

export function getAlertPreferences(): AlertPreferences {
  if (typeof window === "undefined") return DEFAULT_ALERTS;
  try {
    return { ...DEFAULT_ALERTS, ...JSON.parse(localStorage.getItem(ALERTS_KEY) || "{}") };
  } catch {
    return DEFAULT_ALERTS;
  }
}

export function getWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE;
  try {
    return { ...DEFAULT_WORKSPACE, ...JSON.parse(localStorage.getItem(WORKSPACE_KEY) || "{}") };
  } catch {
    return DEFAULT_WORKSPACE;
  }
}
