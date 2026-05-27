# Project State — Reality Drift

> **This is the first doc to read every session.** It tells you exactly where the build is, what works, what's broken, and what to do next.

---

## ⚡ IMMEDIATE NEXT TASK

**Apply the Google Stitch design to the frontend.**

The `stitch` MCP server is live (configured in `.claude.json` for this project).  
Do NOT read source files first — just call the Stitch MCP tools, get the design, apply it.

**Steps:**
1. Call Stitch MCP → list screens / get components
2. Apply visual layer to:
   - `frontend/app/globals.css` (colors, fonts, spacing tokens)
   - `frontend/components/LandingPage.tsx` (landing layout)
   - `frontend/app/layout.tsx` (root font/metadata)
   - `frontend/app/analyze/[company]/page.tsx` (dashboard, if Stitch has one)
3. Keep ALL logic, data, and component props exactly as-is — visual only
4. `cd frontend && npm run build` → must pass with zero errors
5. Mark this task ✅ below

---

## Current Date Context

Hackathon deadline: **May 30, 2026, 5PM Pacific**  
Build started: May 25, 2026  
Day 2 (May 26) — **COMPLETE**  
Day 3 (May 27) — **IN PROGRESS**: Stitch design integration

---

## Build Status by Layer

### ✅ COMPLETE — Backend Foundation
- `backend/main.py` — FastAPI app with lifespan, CORS, all 4 route modules mounted
- `backend/data/schemas.py` — All Pydantic models (single source of truth)
- `backend/data/preloaded/shell.json` — RDI=84, 5 contradictions, SEC delta=10pp, 4-point temporal history
- `backend/data/preloaded/nike.json` — RDI=71, Supply Chain Omission
- `backend/data/preloaded/hm.json` — RDI=78, Legal Greenwashing
- `backend/api/routes/companies.py` — `GET /api/companies` and `GET /api/companies/{slug}`
- `backend/api/routes/health.py` — `GET /health`
- `backend/api/routes/history.py` — `GET /api/history/{company}`

### ✅ COMPLETE — Bright Data Scrapers
- `backend/scrapers/geo_fetcher.py` — Residential Proxies (5 regions) + Web Unlocker fallback
- `backend/scrapers/sec_edgar.py` — SERP API → fetches SEC 20-F filings
- `backend/scrapers/news_violations.py` — SERP API → ESG violation news
- `backend/scrapers/glassdoor.py` — Scraping Browser (Playwright CDP)
- `backend/scrapers/web_scraper.py` — Web Scraper API (trigger + poll pattern)

### ✅ COMPLETE — Claude AI Pipeline
- `backend/ai/claude_client.py` — 3-layer prompt caching, `call_claude(task, ...)` 
- `backend/ai/prompts.py` — SYSTEM_PROMPT (>1024 tokens) + 5 TASK_PROMPTS
- `backend/ai/claim_extractor.py` — Extracts claims per region
- `backend/ai/contradiction_finder.py` — Finds claim vs evidence contradictions
- `backend/ai/drift_classifier.py` — Classifies drift type + DNA fingerprint
- `backend/ai/sec_comparator.py` — Compares public claims vs SEC language

### ✅ COMPLETE — Scoring Engine
- `backend/scoring/geographic_drift.py` — `(1 - mean_sim) × 100`, +10 bonus
- `backend/scoring/claim_evidence.py` — Weighted contradiction ratio
- `backend/scoring/temporal_drift.py` — Stdev of history + escalation bonus
- `backend/scoring/disclosure_gap.py` — Severity base + numeric delta × 4
- `backend/scoring/rdi_calculator.py` — Master: `geo×0.30 + ce×0.35 + td×0.20 + dg×0.15`
- `backend/scoring/dna_fingerprint.py` — Validates and clamps DNA bar values

### ✅ COMPLETE — Cognee Memory
- `backend/memory/cognee_client.py` — Init for Cognee **1.1.0** (sync config API)
- `backend/memory/store.py` — Lazy `import cognee`, stores natural-language document
- `backend/memory/retrieve.py` — Lazy `import cognee`, GRAPH_COMPLETION query, regex parse

### ✅ COMPLETE — Live Analysis Pipeline
- `backend/api/routes/analyze.py` — Full `_run_full_pipeline()` with all 7 layers wired
- SSE streaming endpoint: `GET /api/analyze/stream`
- `POST /api/analyze` with preloaded intercept + in-memory cache

### ✅ COMPLETE — Frontend
- `frontend/app/page.tsx` → `components/LandingPage.tsx` — animated headline, search input, 3 demo cards
- `frontend/app/analyze/[company]/page.tsx` — full dashboard, 3-column grid
- `frontend/components/rdi/RDIReveal.tsx` — Framer Motion count-up animation
- `frontend/components/rdi/RDIBreakdown.tsx` — 4 animated sub-score bars
- `frontend/components/dna/DriftDNA.tsx` — 4 DNA bars + dominant type badge
- `frontend/components/filing/FilingDiscrepancyCard.tsx` — public vs SEC two-column red card
- `frontend/components/timeline/DriftTimeline.tsx` — Recharts LineChart, Cognee data
- `frontend/components/search/LiveAnalysisProgress.tsx` — SSE progress stepper
- `frontend/components/globe/DriftGlobe.tsx` — Canvas-based animated 3D globe, 5 region pins

### ✅ COMPLETE — Infrastructure
- `backend/requirements.txt` — Pinned to installed versions (May 2026)
- `backend/Dockerfile` — python:3.12-slim + playwright
- `backend/railway.toml` — start command + healthcheck
- `frontend/package.json` — all deps including react-globe.gl, recharts, framer-motion
- `README.md` + `DEMO_SCRIPT.md` at project root

---

## Verified Working (last tested May 26, 2026)

```
GET /health              → {"status":"ok","version":"1.0.0","environment":"development"}
GET /api/companies       → Shell RDI=84, Nike RDI=71, H&M RDI=78
GET /api/companies/shell → RDI=84, company="Shell", contradictions=5
Frontend npm run build   → ✅ Zero TypeScript errors
All Python imports       → ✅ including cognee, anthropic, scrapers, scoring
Cognee 1.1.0 init        → ✅ "Cognee initialized at ./cognee_db"
```

---

## NOT YET DONE — Remaining Tasks

### ✅ COMPLETE — Full Stitch Rebuild + Light/Dark Mode (Day 3)
- [x] Stitch project fetched: "Global Narrative Drift Auditor" (ID: 387684644234286406)
- [x] `frontend/app/globals.css` — full Stitch color tokens (navy surfaces, Electric Blue primary, Drift Red tertiary, JetBrains Mono)
- [x] `frontend/components/LandingPage.tsx` — Stitch visual layer applied (glassmorphism cards, primary blue CTA, Inter + Mono fonts)
- [x] `frontend/app/layout.tsx` — switched to Google Fonts: Inter + JetBrains Mono (replaces Geist local fonts)
- [x] `frontend/app/analyze/[company]/page.tsx` — Stitch dashboard visual layer applied
- [x] `npm run build` → ✅ Zero TypeScript errors, all 3 routes build clean
- [x] `.gitignore` created at project root (covers .env, .claude.json, venv, cognee_db, node_modules, etc.)

### 🔥 RIGHT NOW — Fill in `.env`
Copy `backend/.env.example` to `backend/.env`, add real API keys:
- `ANTHROPIC_API_KEY` (user has this)
- Bright Data credentials — see `docs/ENV_AND_DEPLOY.md`
- Then test: `POST /api/analyze` with a real company URL

### 🔲 Day 3 — Test Live Pipeline (after .env filled)
- [ ] `POST /api/analyze` with real non-demo URL → all 5 Bright Data products fire
- [ ] Claude returns valid JSON for all 5 tasks
- [ ] Cognee: 2 analyses of same company → temporal_history has 2 points

### 🔲 Day 4 (May 28) — Polish + Full Demo Test
- [ ] Full demo flow: Shell → Nike → H&M (instant) → live URL (streamed, ~2 min)
- [ ] Verify all 6 dashboard panels render correctly with Stitch design applied

### 🔲 Day 5 (May 29) — Deploy + Submit
- [ ] Deploy backend to Railway (see `docs/ENV_AND_DEPLOY.md`)
- [ ] Deploy frontend to Vercel
- [ ] Demo rehearsal × 3
- [ ] Submit on lablab.ai before May 30, 5PM Pacific

---

## Known Issues / Quirks

| Issue | File | Fix Applied |
|-------|------|-------------|
| Cognee 1.1.0: config methods are sync, not async | `memory/cognee_client.py` | ✅ Removed `await` from config calls |
| Cognee 1.1.0: method renamed | `memory/cognee_client.py` | ✅ `set_graph_db_provider` → `set_graph_database_provider` |
| Cognee 1.1.0: lazy import required | `memory/store.py`, `memory/retrieve.py` | ✅ `import cognee` inside functions only |
| TypeScript: `ctx` not narrowed in closures | `components/globe/DriftGlobe.tsx` | ✅ Used `const draw = ctx` alias |
| Next.js: `layout.tsx` auto-created by CLI | `frontend/app/layout.tsx` | ✅ Read then Edited (not Write) |

---

## Prize Targets

| Prize | Requirement | Status |
|-------|-------------|--------|
| Finance & Market Intelligence | SEC filing discrepancy as alternative data | ✅ FilingDiscrepancyCard built |
| Cognee Partner Prize ($500 + $2,400) | Temporal drift memory, timeline UI | ✅ DriftTimeline + Cognee memory |
| Bright Data AI Startup ($20K) | All 5 products visibly used + $250 promo code `unlocked` | ✅ All 5 in Data Sources panel |
