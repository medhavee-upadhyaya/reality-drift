// api.ts — Typed API client for Reality Drift backend
import {
  AnalysisResult,
  CompanySummary,
  TemporalPoint,
  ProgressEvent,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new APIError(`API Error ${res.status}: ${path}`, res.status, body);
  }
  return res.json();
}

// ─── Company endpoints ──────────────────────────────────────────────────────

export async function listCompanies(): Promise<CompanySummary[]> {
  const data = await apiGet<{ companies: CompanySummary[] }>("/api/companies");
  return data.companies;
}

export async function getCompany(slug: string): Promise<AnalysisResult> {
  return apiGet<AnalysisResult>(`/api/companies/${slug}`);
}

// ─── Analysis endpoints ─────────────────────────────────────────────────────

export async function analyzeCompany(
  url: string,
  companyName: string,
  forceLive = false
): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, company_name: companyName, force_live: forceLive }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new APIError(`Analysis failed: ${res.status}`, res.status, body);
  }
  return res.json();
}

// ─── SSE streaming analysis ──────────────────────────────────────────────────

export function streamAnalysis(
  url: string,
  companyName: string,
  onProgress: (event: ProgressEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const params = new URLSearchParams({
    url,
    company_name: companyName,
  });

  const eventSource = new EventSource(
    `${API_URL}/api/analyze/stream?${params.toString()}`
  );

  eventSource.onmessage = (event) => {
    try {
      const parsed: ProgressEvent = JSON.parse(event.data);
      onProgress(parsed);
      if (parsed.step === "done" || parsed.step === "error") {
        eventSource.close();
      }
    } catch (e) {
      console.error("Failed to parse SSE event:", e);
    }
  };

  eventSource.onerror = (error) => {
    eventSource.close();
    onError?.(new Error("SSE connection failed"));
  };

  // Return cleanup function
  return () => eventSource.close();
}

// ─── History endpoint ────────────────────────────────────────────────────────

export async function getCompanyHistory(
  company: string,
  limit = 20
): Promise<TemporalPoint[]> {
  const data = await apiGet<{ company: string; history: TemporalPoint[] }>(
    `/api/history/${encodeURIComponent(company)}?limit=${limit}`
  );
  return data.history;
}

// ─── Health check ────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    await apiGet<{ status: string }>("/health");
    return true;
  } catch {
    return false;
  }
}
