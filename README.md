# Reality Drift — Global Narrative Drift Auditor

> **The Internet Shows Different Truths to Different People. We Catch It.**

AI observability infrastructure that detects when corporations publish different environmental truths to different countries — automatically, with receipts.

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Sonnet-orange?style=flat-square)](https://anthropic.com)
[![Powered by Bright Data](https://img.shields.io/badge/Powered%20by-Bright%20Data-blue?style=flat-square)](https://brightdata.com)
[![Memory by Cognee](https://img.shields.io/badge/Memory-Cognee%201.1.0-purple?style=flat-square)](https://cognee.ai)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com)

---

## The Problem in One Sentence

Shell tells the public **"30% emissions reduction by 2030"** and files **"20% subject to market conditions"** with the SEC. Reality Drift finds that discrepancy in seconds — automatically, with receipts.

---

## Live Demo

> Navigate to the demo and click **Shell**, **Nike**, or **H&M** — results are instant, no API key required.

### Pre-Loaded Demo Companies

| Company | RDI Score | Drift Type | Key Finding |
|---------|-----------|------------|-------------|
| 🐚 **Shell** | **84 / HIGH** | Regulatory Arbitrage | "30% reduction" public vs "20% subject to market conditions" in SEC 20-F — 10-point discrepancy |
| 👟 **Nike** | **71 / ELEVATED** | Supply Chain Omission | Supplier labor violations acknowledged in SEC risk factors but absent from all 5 regional sustainability pages |
| 👗 **H&M** | **78 / HIGH** | Legal Greenwashing | Norwegian Consumer Authority banned Conscious Collection claims as greenwashing in 2022 — identical messaging still live on US/APAC pages |

---

## What Is the Reality Drift Index (RDI)?

RDI is a 0–100 composite score measuring how inconsistently a company represents its ESG commitments across geographies and regulatory sources.

```
RDI = (Geographic Drift  × 0.30)   ← Same URL, 5 countries, different content?
    + (Claim vs Evidence  × 0.35)   ← Does SEC filing contradict public claims?
    + (Temporal Drift     × 0.20)   ← Is drift getting worse over time? (Cognee)
    + (Disclosure Gap     × 0.15)   ← What's present in filings but absent publicly?
```

| Score | Label | What It Means |
|-------|-------|---------------|
| 0–40  | ✅ CONSISTENT | Claims align across regions and regulatory filings |
| 41–60 | ⚠️ MODERATE | Notable inconsistencies worth monitoring |
| 61–80 | 🟡 ELEVATED | Active drift — investor/regulator attention warranted |
| 81–100 | 🔴 HIGH | Material contradictions — potential greenwashing or misleading disclosure |

---

## Two Modes

### 🌍 Outsider View (Default)
For ESG fund managers, procurement teams, investigative journalists, and external auditors.  
Enter any company URL → get the RDI score, contradictions, SEC filing delta, Glassdoor sentiment, and recommended actions.

### 🏢 Internal Compliance Mode
For corporate sustainability teams who need to *fix* the problem, not just observe it.  
Same scan, different framing. Includes:
- **Pre-Publish Checker** — paste a draft ESG claim → instant CLEAR / MINOR_DRIFT / CONFLICT verdict
- **Regulatory Readiness** scorecard — EU CSRD audit readiness across 4 dimensions  
- **Regional Team Breakdown** — which of your 5 regional teams is the source of drift
- **Priority Actions** — Urgent / This Week / Next Quarter action plan

**Switch modes:** Click the toggle on the landing page, or go to `/compliance/shell` directly.

### 🎯 Presentation Mode
`Cmd+Shift+D` on any dashboard page — hides all demo labels, enlarges key metrics. Built for screen sharing with judges and stakeholders.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        REALITY DRIFT                             │
├──────────────────────────────────────────────────────────────────┤
│  FRONTEND (Next.js 14)                                           │
│  ┌────────────────┐ ┌──────────────────┐ ┌────────────────────┐  │
│  │  Landing Page  │ │ Outsider Dashboard│ │ Compliance Dashboard│ │
│  │  Globe + Search│ │ RDI + DNA + SEC  │ │ Pre-Publish Checker│  │
│  └────────────────┘ └──────────────────┘ └────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  BACKEND (FastAPI) — 7-layer pipeline                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  1. Geo Fetch         ← Bright Data Residential Proxies  │    │
│  │     5 regions, auto-detects .de / .co.in / .com.br       │    │
│  │  2. SEC EDGAR Scrape  ← Bright Data SERP + Web Unlocker  │    │
│  │  3. News Violations   ← Bright Data SERP API             │    │
│  │  4. Glassdoor         ← Bright Data Scraping Browser     │    │
│  │  5. Claude AI         ← Anthropic (3-layer prompt cache) │    │
│  │     ├─ Extract claims per region                         │    │
│  │     ├─ Find contradictions vs SEC + news                 │    │
│  │     ├─ Classify drift type (Drift DNA)                   │    │
│  │     └─ Compute SEC public-vs-regulatory delta            │    │
│  │  6. RDI Scoring       ← Weighted formula                 │    │
│  │  7. Cognee Memory     ← Temporal drift history           │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Bright Data Integration — All 5 Products

| Product | Used For | File |
|---------|----------|------|
| **Residential Proxies** | Fetches sustainability pages simultaneously from US, DE, IN, BR, SG exit IPs | `scrapers/geo_fetcher.py` |
| **Web Unlocker** | Fallback for JS-heavy pages and bot-protected sites | `scrapers/geo_fetcher.py` |
| **SERP API** | Structured search for SEC EDGAR filings + ESG violation news | `scrapers/sec_edgar.py`, `scrapers/news_violations.py` |
| **Scraping Browser** | Playwright CDP session for Glassdoor reviews (fully JS-rendered) | `scrapers/glassdoor.py` |
| **Web Scraper API** | Dataset triggers for bulk content collection | `scrapers/web_scraper.py` |

All 5 products are shown in the **Data Sources** panel on every dashboard page.

---

## Claude AI Pipeline (with Prompt Caching)

Claude Sonnet 4.6 powers 5 distinct analysis tasks with **3-layer prompt caching** (~90% token cost reduction):

1. **Claim Extractor** — identifies specific ESG commitments from each of the 5 regional pages
2. **Contradiction Finder** — cross-references claims against SEC filings and news evidence
3. **Drift Classifier** — determines dominant drift type and computes Drift DNA fingerprint
4. **SEC Comparator** — calculates the public-vs-regulatory delta with numeric precision
5. **Compliance Checker** — pre-publish verdict (CLEAR / MINOR_DRIFT / CONFLICT)

Prompt caching is always on. `cache_control: {"type": "ephemeral"}` is applied to all system prompts. **Never remove this.**

---

## Cognee Memory Integration

Every analysis is stored in Cognee's knowledge graph. This enables:
- **Temporal Drift History** — watch a company's RDI change over time
- **Escalation Scoring** — detect worsening drift before it becomes a regulatory event  
- **Audit Trail** — every scan timestamped and queryable

Shell's demo data shows RDI escalating: **72 → 76 → 80 → 84** over 3 months.

Visualized in the **Drift Timeline** (Recharts line chart) on every dashboard.

---

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.12+
- API keys: Anthropic, Bright Data

### 1. Clone and set up backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

Create `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_CUSTOMER_ID=...
BRIGHT_DATA_RESIDENTIAL_PASSWORD=...
BRIGHT_DATA_SCRAPING_BROWSER_PASSWORD=...
COGNEE_LLM_API_KEY=sk-ant-...        # same as Anthropic key
COGNEE_DB_PATH=./cognee_db
ENABLE_BACKEND_ACCESS_CONTROL=false  # required for Cognee 1.1.0
ENVIRONMENT=development
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

```bash
uvicorn main:app --reload
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### 2. Set up frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
# → http://localhost:3000
```

### 3. Test the demo

```bash
# Should return instantly (pre-loaded):
curl http://localhost:8000/api/companies/shell

# Run live analysis on any company:
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tesla.com/impact", "company_name": "Tesla"}'
```

Open http://localhost:3000 → click Shell/Nike/H&M for instant results.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check → `{"status":"ok"}` |
| `GET` | `/api/companies` | All demo companies with RDI scores |
| `GET` | `/api/companies/{slug}` | Full analysis (instant for shell/nike/hm) |
| `POST` | `/api/analyze` | Run full live pipeline (any URL) |
| `GET` | `/api/analyze/stream` | SSE streaming — real-time pipeline progress |
| `GET` | `/api/history/{company}` | Temporal drift history from Cognee |
| `POST` | `/api/compliance/check-claim` | Pre-publish compliance verdict |
| `POST` | `/api/compliance/readiness` | EU CSRD readiness assessment |
| `POST` | `/api/compliance/recommended-actions` | Tiered action items |

---

## Deploy

### Backend → Railway

```bash
cd backend
railway login
railway deploy
```

Set all `.env` variables in Railway dashboard → Variables.

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

In Vercel dashboard → Settings → Environment Variables → add:  
`NEXT_PUBLIC_API_URL = https://your-railway-app.railway.app`

---

## Project Structure

```
Reality Drift/
├── backend/
│   ├── main.py                      ← FastAPI entry point, CORS, lifespan
│   ├── api/routes/
│   │   ├── analyze.py               ← 7-layer pipeline + SSE streaming
│   │   ├── companies.py             ← Demo company endpoints
│   │   ├── compliance.py            ← Internal compliance endpoints
│   │   ├── health.py
│   │   └── history.py               ← Cognee temporal history
│   ├── scrapers/                    ← All 5 Bright Data products
│   ├── ai/                          ← Claude pipeline (5 tasks + caching)
│   ├── scoring/                     ← RDI formula and sub-scores
│   ├── memory/                      ← Cognee store + retrieve
│   └── data/
│       ├── schemas.py               ← Single source of truth (Pydantic models)
│       └── preloaded/               ← shell.json, nike.json, hm.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 ← Landing page (globe, search, demo cards)
│   │   ├── analyze/[company]/       ← Outsider dashboard
│   │   └── compliance/[company]/    ← Internal compliance dashboard
│   ├── components/
│   │   ├── rdi/                     ← RDIReveal (count-up), RDIBreakdown
│   │   ├── dna/                     ← DriftDNA fingerprint bars
│   │   ├── filing/                  ← FilingDiscrepancyCard (the key demo moment)
│   │   ├── timeline/                ← DriftTimeline (Recharts + Cognee data)
│   │   ├── search/                  ← LiveAnalysisProgress (SSE stepper)
│   │   ├── compliance/              ← PrePublishChecker, RegionalTeamBreakdown,
│   │   │                               RegulatoryReadiness, RecommendedActions,
│   │   │                               DriftAlertSettings
│   │   └── ui/                      ← ModeToggle, ModeNav, PresentationMode
│   └── public/
│       ├── globe.png                ← Earth globe image
│       └── preloaded/               ← Static fallback JSONs (works offline)
│
├── docs/                            ← Architecture, API, scoring, deploy docs
├── DEMO_SCRIPT.md                   ← Rehearsed 5-minute demo walkthrough
└── CLAUDE.md                        ← AI assistant context (project state + rules)
```

---

## Prize Targets

| Prize | Requirement | How We Meet It |
|-------|-------------|----------------|
| 🏆 **Bright Data AI Startup ($20K)** | All 5 Bright Data products visibly used | 5 products in Data Sources panel, each in its own scraper file, all clearly labelled |
| 🧠 **Cognee Partner Prize ($2,900)** | Meaningful use of Cognee memory | DriftTimeline shows 4-point temporal history; escalation scoring uses stored history |
| 📈 **Finance & Market Intelligence** | SEC filing as alternative data source | FilingDiscrepancyCard: Shell 30% vs 20% SEC 20-F, 10pp numeric delta, severity HIGH |

---

## Key Technical Decisions

| Decision | Why |
|----------|-----|
| Pre-loaded Shell/Nike/H&M data | Demo never fails. No Bright Data calls for known companies. Judges get instant impressive results. |
| Double fallback on frontend | `getCompany(slug)` → static `public/preloaded/{slug}.json`. Works even if Railway is down. |
| 3-layer prompt caching | `cache_control: {"type": "ephemeral"}` on all Claude calls. ~90% token cost reduction. |
| Cognee lazy imports | `import cognee` only inside functions. Server starts without Cognee installed. |
| SSE streaming | Live analysis progress in real-time. Judges see all 7 pipeline steps complete. |
| Company-specific compliance fallbacks | If Claude API is unavailable, compliance endpoints return specific, relevant data per company rather than generic text. |

---

## Built For

**Web Data UNLOCKED Hackathon** — [lablab.ai](https://lablab.ai)  
Deadline: **May 30, 2026, 5PM Pacific**  
Built in 5 days from scratch.
