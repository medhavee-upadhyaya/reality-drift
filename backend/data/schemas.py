"""
schemas.py — Single source of truth for all Reality Drift data models.
All Pydantic models used across backend AND mirrored as TypeScript types in frontend.
"""

from __future__ import annotations
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# ─── Enums ─────────────────────────────────────────────────────────────────────

class DriftType(str, Enum):
    REGULATORY_ARBITRAGE = "Regulatory Arbitrage"
    SUPPLY_CHAIN_OMISSION = "Supply Chain Omission"
    LEGAL_GREENWASHING = "Legal Greenwashing"
    SELECTIVE_DISCLOSURE = "Selective Disclosure"
    UNKNOWN = "Unknown"


class ContradictionSeverity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ContradictionType(str, Enum):
    QUANTITATIVE_DELTA = "quantitative_delta"   # Different numbers
    OMISSION = "omission"                        # Fact present in one place, absent in another
    TONE_REVERSAL = "tone_reversal"              # Same claim, opposite framing
    TEMPORAL_INCONSISTENCY = "temporal_inconsistency"  # Timeline contradictions


class AnalysisStep(str, Enum):
    GEO_FETCH = "geo_fetch"
    SEC_SCRAPE = "sec_scrape"
    NEWS_SCRAPE = "news_scrape"
    GLASSDOOR_SCRAPE = "glassdoor_scrape"
    CLAUDE_ANALYZE = "claude_analyze"
    SCORING = "scoring"
    COGNEE_STORE = "cognee_store"
    DONE = "done"
    ERROR = "error"


# ─── Sub-models ────────────────────────────────────────────────────────────────

class RegionalPage(BaseModel):
    region: str                          # "US" | "DE" | "IN" | "BR" | "SG"
    url: str
    raw_text_hash: Optional[str] = None  # SHA256 of page content (deduplication)
    claims: List[str] = Field(default_factory=list)
    tone: str = "neutral"                # "aspirational" | "regulatory" | "partnership" | etc.
    word_count: Optional[int] = None


class Contradiction(BaseModel):
    claim: str                           # The public-facing claim
    evidence_source: str                 # "SEC 20-F 2023" | "Reuters 2024-01-10" | etc.
    evidence_text: str                   # The contradicting text
    contradiction_type: ContradictionType = ContradictionType.OMISSION
    severity: ContradictionSeverity = ContradictionSeverity.MEDIUM
    region_source: str = "US"            # Which region the claim came from


class SECFiling(BaseModel):
    filing_type: str = "20-F"
    filing_date: str                     # "2024-03-15"
    public_claim: str                    # The company's public sustainability claim
    sec_language: str                    # Exact language from SEC filing
    delta_description: str               # Human-readable delta
    delta_numeric: Optional[float] = None  # Numeric delta (e.g. 10.0 for "10 percentage points")
    discrepancy_severity: ContradictionSeverity = ContradictionSeverity.HIGH
    filing_url: Optional[str] = None


class NewsViolation(BaseModel):
    headline: str
    source: str
    date: str
    region: str
    url: str
    summary: Optional[str] = None


class GlassdoorSignals(BaseModel):
    avg_rating: Optional[float] = None
    total_reviews_sampled: int = 0
    esg_mention_count: int = 0
    negative_esg_ratio: float = 0.0
    sample_reviews: List[str] = Field(default_factory=list)


class DriftDNA(BaseModel):
    regulatory_language_pct: int = Field(ge=0, le=100)      # Legal/regulatory hedging frequency
    commitment_specificity_pct: int = Field(ge=0, le=100)   # Specific (date/number) vs vague
    omission_pattern_pct: int = Field(ge=0, le=100)         # Known issues not mentioned
    tone_variation_pct: int = Field(ge=0, le=100)           # Sentiment variance across regions
    dominant_drift_type: DriftType = DriftType.UNKNOWN


class RDIComponent(BaseModel):
    score: int = Field(ge=0, le=100)
    weight: float
    weighted: float


class RDIComponents(BaseModel):
    geographic_drift: RDIComponent    # 30% weight
    claim_evidence: RDIComponent      # 35% weight
    temporal_drift: RDIComponent      # 20% weight
    disclosure_gap: RDIComponent      # 15% weight


class TemporalPoint(BaseModel):
    timestamp: str                    # ISO datetime string
    rdi_score: int
    analysis_id: str


class BrightDataUsage(BaseModel):
    residential_proxies: Optional[Dict[str, Any]] = None
    web_unlocker: Optional[Dict[str, Any]] = None
    serp_api: Optional[Dict[str, Any]] = None
    scraping_browser: Optional[Dict[str, Any]] = None
    web_scraper_api: Optional[Dict[str, Any]] = None


# ─── Main AnalysisResult ────────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    company: str
    url: str
    analysis_id: str
    timestamp: str                          # ISO datetime string
    is_preloaded: bool = False

    rdi_score: int = Field(ge=0, le=100)
    rdi_components: RDIComponents

    regional_pages: Dict[str, RegionalPage]  # keys: "US", "DE", "IN", "BR", "SG"
    contradictions: List[Contradiction] = Field(default_factory=list)

    sec_filing: Optional[SECFiling] = None
    news_violations: List[NewsViolation] = Field(default_factory=list)
    glassdoor_signals: Optional[GlassdoorSignals] = None

    drift_dna: DriftDNA
    temporal_history: List[TemporalPoint] = Field(default_factory=list)

    bright_data_usage: Optional[BrightDataUsage] = None


# ─── Request/Response models ────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    url: str
    company_name: str
    force_live: bool = False              # Override preloaded cache
    regional_urls: Optional[Dict[str, str]] = None  # e.g. {"DE": "nike.de", "IN": "nike.co.in"}


class CompanySummary(BaseModel):
    slug: str
    name: str
    url: str
    is_preloaded: bool
    last_rdi: int
    dominant_drift: DriftType
    description: Optional[str] = None


class CompaniesResponse(BaseModel):
    companies: List[CompanySummary]


class HistoryResponse(BaseModel):
    company: str
    history: List[TemporalPoint]


class ProgressEvent(BaseModel):
    step: AnalysisStep
    progress: int = Field(ge=0, le=100)
    message: str
    result: Optional[AnalysisResult] = None  # Only present when step == DONE
    error: Optional[str] = None              # Only present when step == ERROR


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    environment: str = "development"
