# Architecture — Reality Drift

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) + Tailwind + Framer Motion | Dark-mode animated dashboard |
| Backend | FastAPI (Python 3.14) | Async scraping, Python AI ecosystem |
| AI | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Prompt caching = 90% token savings |
| Memory | Cognee 1.1.0 | Temporal drift storage, graph + vector |
| Scraping | Bright Data (5 products) | Geographic proxies, SEC bypass, Glassdoor |
| Deploy | Vercel (frontend) + Railway (backend) | Free tier, fast |

---

## Full Directory Structure

```
reality-drift/
├── CLAUDE.md                     ← Start here every session
├── README.md
├── DEMO_SCRIPT.md                ← Word-for-word pitch script
├── docs/                         ← All context docs (you are here)
│   ├── PROJECT_STATE.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SCORING.md
│   ├── BRIGHT_DATA.md
│   ├── COGNEE.md
│   ├── CLAUDE_AI_PIPELINE.md
│   ├── FRONTEND.md
│   └── ENV_AND_DEPLOY.md
│
├── backend/
│   ├── main.py                   ← FastAPI entry, CORS, lifespan, mounts all routes
│   ├── requirements.txt          ← Pinned deps (fastapi, anthropic, cognee 1.1.0, etc.)
│   ├── .env.example              ← Template for all environment variables
│   ├── .env                      ← REAL KEYS — never commit, gitignored
│   ├── Dockerfile
│   ├── railway.toml
│   │
│   ├── api/routes/
│   │   ├── analyze.py            ← POST /api/analyze + GET /api/analyze/stream (SSE)
│   │   ├── companies.py          ← GET /api/companies, GET /api/companies/{slug}
│   │   ├── history.py            ← GET /api/history/{company}
│   │   └── health.py             ← GET /health
│   │
│   ├── scrapers/                 ← All Bright Data integrations
│   │   ├── geo_fetcher.py        ← [BD1+2] Residential Proxies + Web Unlocker
│   │   ├── sec_edgar.py          ← [BD3] SERP API → SEC EDGAR filings
│   │   ├── news_violations.py    ← [BD3] SERP API → violations news
│   │   ├── glassdoor.py          ← [BD4] Scraping Browser (Playwright CDP)
│   │   └── web_scraper.py        ← [BD5] Web Scraper API (trigger/poll)
│   │
│   ├── ai/                       ← Claude analysis (all with prompt caching)
│   │   ├── claude_client.py      ← Core: call_claude(), 3-layer cache, JSON parsing
│   │   ├── prompts.py            ← SYSTEM_PROMPT + 5 TASK_PROMPTS
│   │   ├── claim_extractor.py    ← Task: "claims" → {US:[...], DE:[...], ...}
│   │   ├── contradiction_finder.py ← Task: "contradictions" → [{claim, evidence, severity}]
│   │   ├── drift_classifier.py   ← Task: "drift_type" → DriftDNA
│   │   └── sec_comparator.py     ← Task: "sec_compare" → SECFiling object
│   │
│   ├── scoring/
│   │   ├── rdi_calculator.py     ← Master: geo×0.30 + ce×0.35 + td×0.20 + dg×0.15
│   │   ├── geographic_drift.py   ← 30% — (1-mean_sim)×100 + bonus
│   │   ├── claim_evidence.py     ← 35% — weighted contradictions / total_claims × 100
│   │   ├── temporal_drift.py     ← 20% — stdev(history) / 50 × 100 + escalation bonus
│   │   ├── disclosure_gap.py     ← 15% — severity_base + min(40, delta×4)
│   │   └── dna_fingerprint.py    ← Validates/clamps 4 DNA bars, maps to DriftType enum
│   │
│   ├── memory/
│   │   ├── cognee_client.py      ← Cognee 1.1.0 init (SYNC config calls)
│   │   ├── store.py              ← store_analysis(): natural-language doc → cognee.add() → cognify()
│   │   └── retrieve.py           ← get_temporal_history(): GRAPH_COMPLETION + regex parse
│   │
│   ├── data/
│   │   ├── schemas.py            ← ALL Pydantic models (single source of truth)
│   │   └── preloaded/
│   │       ├── shell.json        ← Complete AnalysisResult, RDI=84
│   │       ├── nike.json         ← Complete AnalysisResult, RDI=71
│   │       └── hm.json           ← Complete AnalysisResult, RDI=78
│   │
│   ├── utils/
│   │   ├── cache.py              ← In-memory 1hr TTL, keyed by SHA256(url)
│   │   └── text_processing.py    ← HTML → clean text, max 12k chars/region
│   │
│   └── venv/                     ← Python virtualenv (gitignored)
│
└── frontend/
    ├── app/
    │   ├── page.tsx              ← Renders <LandingPage />
    │   ├── analyze/[company]/
    │   │   └── page.tsx          ← Main dashboard (3-column grid)
    │   ├── layout.tsx            ← Dark bg, Geist font, metadata
    │   └── globals.css           ← CSS vars, glass-card, rdi-number, severity styles
    │
    ├── components/
    │   ├── LandingPage.tsx       ← Animated headline, search, 3 demo company cards
    │   ├── globe/
    │   │   └── DriftGlobe.tsx    ← Canvas-based animated rotating globe, 5 region pins
    │   ├── rdi/
    │   │   ├── RDIReveal.tsx     ← Framer Motion count-up to score + glow ring
    │   │   └── RDIBreakdown.tsx  ← 4 animated sub-score bars (geo/claim/temporal/disclosure)
    │   ├── dna/
    │   │   └── DriftDNA.tsx      ← 4 DNA bars + dominant type badge
    │   ├── filing/
    │   │   └── FilingDiscrepancyCard.tsx ← Red card: public claim vs SEC language
    │   ├── timeline/
    │   │   └── DriftTimeline.tsx ← Recharts LineChart, Cognee temporal history
    │   └── search/
    │       └── LiveAnalysisProgress.tsx  ← SSE step-by-step progress for live analysis
    │
    ├── lib/
    │   ├── types.ts              ← TypeScript interfaces (mirrors Pydantic schemas)
    │   ├── api.ts                ← getCompany(), analyzeCompany(), streamAnalysis()
    │   └── preloaded.ts          ← getPreloadedSlug(), getPreloadedResult(), DEMO_COMPANIES
    │
    └── public/
        └── preloaded/            ← Static JSON fallback if Railway is down
            ├── shell.json
            ├── nike.json
            └── hm.json
```

---

## Data Flow — Pre-loaded Company (Shell/Nike/H&M)

```
User types "Shell"
  ↓
frontend: getPreloadedSlug("Shell") → "shell"
  ↓
frontend: GET /api/companies/shell
  ↓
backend: companies.py → _load_preloaded("shell") → reads shell.json
  ↓
frontend: receives AnalysisResult JSON instantly
  ↓
frontend: renders all 6 dashboard panels (globe, RDI reveal, breakdown, DNA, filing card, timeline)
```

Total time: ~200ms. No Claude, no Bright Data, no Cognee.

---

## Data Flow — Live Analysis (any other company)

```
User types "apple.com/environment"
  ↓
frontend: not in PRELOADED_MAP → SSE stream to GET /api/analyze/stream
  ↓
[Layer 1] geo_fetcher.py → 5 concurrent httpx requests through regional proxies
  ↓
[Layer 2] sec_edgar.py → SERP API search → fetch SEC filing via Web Unlocker
  ↓
[Layer 3] news_violations.py → SERP API search for violations/fines
  ↓
[Layer 4] glassdoor.py → Playwright via Scraping Browser CDP
  ↓
[Layer 5] claude_client.py × 5 calls (all caching HTML from call 2 onward)
          → extract_claims → find_contradictions → classify_drift → compare_sec
  ↓
[Layer 6] rdi_calculator.py → geo×0.30 + ce×0.35 + td×0.20 + dg×0.15
  ↓
[Layer 7] cognee: store_analysis() → cognee.add() → cognee.cognify()
          retrieve: get_temporal_history() → temporal_history populated
  ↓
SSE sends {"step":"done","result":{...AnalysisResult...}}
  ↓
frontend: renders dashboard
```

Total time: ~2–3 minutes.

---

## Hybrid Demo Architecture

The demo never fails because of the layered fallback:

```
1. Try GET /api/companies/{slug}    → instant, from preloaded JSON
2. If backend down: getPreloadedResult(slug)  → static /public/preloaded/{slug}.json
3. If not a demo company: streamAnalysis()   → live pipeline with SSE progress
```

---

## Model Used for Each AI Task

| Task | Model | Why |
|------|-------|-----|
| All 5 analysis tasks | `claude-sonnet-4-6` | Best balance of intelligence and cost |
| Cognee internal LLM | `claude-haiku-4-5-20251001` | Cheaper, Cognee's graph building is lighter |
