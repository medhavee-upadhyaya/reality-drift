// types.ts — TypeScript interfaces mirroring backend Pydantic schemas
// Keep in sync with backend/data/schemas.py

export type DriftType =
  | "Regulatory Arbitrage"
  | "Supply Chain Omission"
  | "Legal Greenwashing"
  | "Selective Disclosure"
  | "Unknown";

export type ContradictionSeverity = "high" | "medium" | "low";
export type ContradictionType =
  | "quantitative_delta"
  | "omission"
  | "tone_reversal"
  | "temporal_inconsistency";

export type AnalysisStep =
  | "geo_fetch"
  | "sec_scrape"
  | "news_scrape"
  | "glassdoor_scrape"
  | "claude_analyze"
  | "scoring"
  | "cognee_store"
  | "done"
  | "error";

export interface RegionalPage {
  region: string;
  url: string;
  raw_text_hash?: string;
  claims: string[];
  tone: string;
  word_count?: number;
}

export interface Contradiction {
  claim: string;
  evidence_source: string;
  evidence_text: string;
  contradiction_type: ContradictionType;
  severity: ContradictionSeverity;
  region_source: string;
}

export interface SECFiling {
  filing_type: string;
  filing_date: string;
  public_claim: string;
  sec_language: string;
  delta_description: string;
  delta_numeric: number | null;
  discrepancy_severity: ContradictionSeverity;
  filing_url?: string;
}

export interface NewsViolation {
  headline: string;
  source: string;
  date: string;
  region: string;
  url: string;
  summary?: string;
}

export interface GlassdoorSignals {
  avg_rating: number | null;
  total_reviews_sampled: number;
  esg_mention_count: number;
  negative_esg_ratio: number;
  sample_reviews: string[];
}

export interface DriftDNA {
  regulatory_language_pct: number;
  commitment_specificity_pct: number;
  omission_pattern_pct: number;
  tone_variation_pct: number;
  dominant_drift_type: DriftType;
}

export interface RDIComponent {
  score: number;
  weight: number;
  weighted: number;
}

export interface RDIComponents {
  geographic_drift: RDIComponent;
  claim_evidence: RDIComponent;
  temporal_drift: RDIComponent;
  disclosure_gap: RDIComponent;
}

export interface TemporalPoint {
  timestamp: string;
  rdi_score: number;
  analysis_id: string;
}

export interface BrightDataUsage {
  residential_proxies?: { regions_fetched: number; product: string; requests: number };
  web_unlocker?: { pages_unlocked: number; product: string; target: string };
  serp_api?: { queries_run: number; product: string; targets: string[] };
  scraping_browser?: { sessions: number; product: string; target: string };
  web_scraper_api?: { datasets: number; product: string; target: string };
}

export interface AnalysisResult {
  company: string;
  url: string;
  analysis_id: string;
  timestamp: string;
  is_preloaded: boolean;
  rdi_score: number;
  rdi_components: RDIComponents;
  regional_pages: Record<string, RegionalPage>;
  contradictions: Contradiction[];
  sec_filing: SECFiling | null;
  news_violations: NewsViolation[];
  glassdoor_signals: GlassdoorSignals | null;
  drift_dna: DriftDNA;
  temporal_history: TemporalPoint[];
  bright_data_usage?: BrightDataUsage;
}

export interface CompanySummary {
  slug: string;
  name: string;
  url: string;
  is_preloaded: boolean;
  last_rdi: number;
  dominant_drift: DriftType;
  description?: string;
}

export interface ProgressEvent {
  step: AnalysisStep;
  progress: number;
  message: string;
  result?: AnalysisResult;
  error?: string;
}

// RDI color mapping
export function getRDIColor(score: number): string {
  if (score < 30) return "#22c55e"; // green
  if (score < 50) return "#eab308"; // yellow
  if (score < 70) return "#f97316"; // orange
  return "#ef4444"; // red
}

export function getRDILabel(score: number): string {
  if (score < 30) return "LOW DRIFT";
  if (score < 50) return "MODERATE";
  if (score < 70) return "HIGH DRIFT";
  return "CRITICAL";
}

export const DRIFT_TYPE_COLORS: Record<DriftType, string> = {
  "Regulatory Arbitrage": "#ef4444",
  "Supply Chain Omission": "#f97316",
  "Legal Greenwashing": "#a855f7",
  "Selective Disclosure": "#3b82f6",
  "Unknown": "#6b7280",
};

export const REGION_COORDS: Record<string, [number, number]> = {
  US: [39.8283, -98.5795],
  DE: [51.1657, 10.4515],
  IN: [20.5937, 78.9629],
  BR: [-14.2350, -51.9253],
  SG: [1.3521, 103.8198],
};
