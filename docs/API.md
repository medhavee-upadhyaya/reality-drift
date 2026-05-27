# API Contract — Reality Drift

## Base URL

- **Local:** `http://localhost:8000`
- **Production:** `https://reality-drift-backend.railway.app` (set after deploy)
- **Frontend env var:** `NEXT_PUBLIC_API_URL`

---

## Endpoints

### `GET /health`
Returns server status.
```json
{"status": "ok", "version": "1.0.0", "environment": "development"}
```

---

### `GET /api/companies`
Returns list of pre-loaded demo companies.
```json
{
  "companies": [
    {
      "slug": "shell",
      "name": "Shell",
      "url": "https://www.shell.com/sustainability",
      "is_preloaded": true,
      "last_rdi": 84,
      "dominant_drift": "Regulatory Arbitrage"
    },
    ...
  ]
}
```

---

### `GET /api/companies/{slug}`
Returns full `AnalysisResult` for a pre-loaded company. **Instant, no computation.**

Valid slugs: `shell`, `nike`, `hm`

---

### `POST /api/analyze`
Run full analysis pipeline. For pre-loaded companies, returns instantly.

**Request:**
```json
{
  "url": "https://apple.com/environment",
  "company_name": "Apple",
  "force_live": false
}
```

**Response:** Full `AnalysisResult` (see schema below)

---

### `GET /api/analyze/stream?url=...&company_name=...&force_live=false`
Server-Sent Events stream. Emits `ProgressEvent` JSON objects.

**Pre-loaded companies:** Emits fake progress with 300ms delays, then `done` with result.  
**Live analysis:** Emits real progress as each layer completes.

**SSE Events:**
```
data: {"step":"geo_fetch","progress":10,"message":"Fetching page from 5 geographic regions..."}
data: {"step":"geo_fetch","progress":20,"message":"Retrieved 5 regional pages"}
data: {"step":"sec_scrape","progress":25,"message":"Searching SEC EDGAR..."}
data: {"step":"sec_scrape","progress":35,"message":"Retrieved regulatory filing data"}
data: {"step":"news_scrape","progress":38,"message":"Scanning for violations..."}
data: {"step":"news_scrape","progress":45,"message":"Found 8 news items"}
data: {"step":"glassdoor_scrape","progress":47,"message":"Analyzing employee sentiment..."}
data: {"step":"glassdoor_scrape","progress":52,"message":"Glassdoor analysis complete"}
data: {"step":"claude_analyze","progress":55,"message":"Extracting claims from regional pages..."}
data: {"step":"claude_analyze","progress":62,"message":"Detecting contradictions..."}
data: {"step":"claude_analyze","progress":70,"message":"Classifying drift type..."}
data: {"step":"claude_analyze","progress":77,"message":"Comparing public claims vs SEC filings..."}
data: {"step":"claude_analyze","progress":83,"message":"AI analysis complete"}
data: {"step":"scoring","progress":85,"message":"Computing Reality Drift Index..."}
data: {"step":"scoring","progress":90,"message":"Reality Drift Index computed"}
data: {"step":"cognee_store","progress":93,"message":"Storing analysis in memory..."}
data: {"step":"done","progress":100,"message":"","result":{...AnalysisResult...}}
```

**Error event:**
```
data: {"step":"error","progress":0,"message":"","error":"Connection refused"}
```

---

### `GET /api/history/{company}`
Returns Cognee temporal history for a company.
```json
{
  "company": "Shell",
  "history": [
    {"timestamp": "2026-03-01T00:00:00Z", "rdi_score": 72, "analysis_id": "shell-2026-03"},
    {"timestamp": "2026-04-01T00:00:00Z", "rdi_score": 76, "analysis_id": "shell-2026-04"},
    {"timestamp": "2026-05-01T00:00:00Z", "rdi_score": 80, "analysis_id": "shell-2026-05"},
    {"timestamp": "2026-05-26T00:00:00Z", "rdi_score": 84, "analysis_id": "shell-2026-05-26"}
  ]
}
```

---

## Pydantic Schemas (`backend/data/schemas.py`)

### `AnalysisResult` (main response object)
```python
class AnalysisResult(BaseModel):
    company: str
    url: str
    analysis_id: str                         # UUID or "{company}-{date}"
    timestamp: str                           # ISO datetime
    is_preloaded: bool = False

    rdi_score: int                           # 0-100
    rdi_components: RDIComponents

    regional_pages: Dict[str, RegionalPage]  # keys: "US","DE","IN","BR","SG"
    contradictions: List[Contradiction]
    sec_filing: Optional[SECFiling]
    news_violations: List[NewsViolation]
    glassdoor_signals: Optional[GlassdoorSignals]
    drift_dna: DriftDNA
    temporal_history: List[TemporalPoint]
    bright_data_usage: Optional[BrightDataUsage]
```

### `RDIComponents`
```python
class RDIComponents(BaseModel):
    geographic_drift: RDIComponent   # score, weight=0.30, weighted
    claim_evidence:   RDIComponent   # score, weight=0.35, weighted
    temporal_drift:   RDIComponent   # score, weight=0.20, weighted
    disclosure_gap:   RDIComponent   # score, weight=0.15, weighted
```

### `Contradiction`
```python
class Contradiction(BaseModel):
    claim: str                # Public-facing claim
    evidence_source: str      # "SEC 20-F 2023" | "Reuters 2024-01-10"
    evidence_text: str        # Contradicting text
    contradiction_type: ContradictionType   # QUANTITATIVE_DELTA|OMISSION|TONE_REVERSAL|TEMPORAL_INCONSISTENCY
    severity: ContradictionSeverity         # high|medium|low
    region_source: str = "US"
```

### `SECFiling` (the key demo moment)
```python
class SECFiling(BaseModel):
    filing_type: str = "20-F"
    filing_date: str                         # "2024-03-15"
    public_claim: str                        # "30% reduction by 2035"
    sec_language: str                        # "20% subject to market conditions"
    delta_description: str                   # "10 percentage points lower in SEC filing"
    delta_numeric: Optional[float]           # 10.0 for Shell
    discrepancy_severity: ContradictionSeverity  # high for Shell
    filing_url: Optional[str]
```

### `DriftDNA`
```python
class DriftDNA(BaseModel):
    regulatory_language_pct: int    # 0-100: how much legal hedging
    commitment_specificity_pct: int # 0-100: specific numbers vs vague
    omission_pattern_pct: int       # 0-100: known issues not mentioned
    tone_variation_pct: int         # 0-100: sentiment variance across regions
    dominant_drift_type: DriftType  # "Regulatory Arbitrage" | "Supply Chain Omission" | etc.
```

### `ProgressEvent` (SSE)
```python
class ProgressEvent(BaseModel):
    step: AnalysisStep          # geo_fetch|sec_scrape|news_scrape|glassdoor_scrape|
                                # claude_analyze|scoring|cognee_store|done|error
    progress: int               # 0-100
    message: str
    result: Optional[AnalysisResult]  # Only when step=="done"
    error: Optional[str]              # Only when step=="error"
```

### `BrightDataUsage` (shown in Data Sources panel)
```python
class BrightDataUsage(BaseModel):
    residential_proxies: Optional[Dict]  # {"regions_fetched": 5, "product": "Residential Proxies"}
    web_unlocker: Optional[Dict]         # {"pages_unlocked": 1, "product": "Web Unlocker"}
    serp_api: Optional[Dict]             # {"queries_run": 2, "product": "SERP API"}
    scraping_browser: Optional[Dict]     # {"sessions": 1, "product": "Scraping Browser"}
    web_scraper_api: Optional[Dict]      # {"datasets": 1, "product": "Web Scraper API"}
```

---

## CORS Configuration

Allowed origins set via `ALLOWED_ORIGINS` env var:
```
ALLOWED_ORIGINS=https://reality-drift.vercel.app,http://localhost:3000
```

Default (no env var): allows both localhost:3000 and localhost:3001.

---

## Preloaded Intercept Logic

In `backend/api/routes/analyze.py`:
```python
PRELOADED_URLS = {
    "https://www.shell.com/sustainability": "shell",
    "shell": "shell",
    "https://www.nike.com/sustainability": "nike",
    "nike": "nike",
    "https://www2.hm.com/en_us/sustainability": "hm",
    "h&m": "hm",
    "hm": "hm",
}
```

If the URL or company name matches → return preloaded JSON instantly, never touch Bright Data or Claude.
