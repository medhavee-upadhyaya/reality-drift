# Reality Drift

> **The Internet Shows Different Truths to Different People.**

AI observability infrastructure for detecting regional narrative drift in corporate ESG claims.

## What It Does

When a company publishes sustainability claims, they don't publish one truth. They publish **region-optimized narratives** — calibrated to regulatory pressure, consumer expectations, and legal exposure in each market.

Reality Drift catches them doing it. Automatically. With receipts.

## The Reality Drift Index (RDI)

A single number from 0–100 measuring how inconsistent a company's ESG narrative is:

| Sub-Score | Weight | What It Measures |
|-----------|--------|-----------------|
| Geographic Drift | 30% | Semantic variation across US/DE/IN/BR/SG pages |
| Claim vs Evidence | 35% | Contradicted claims vs regulatory filings + news |
| Temporal Drift | 20% | How claims changed over time (Cognee memory) |
| Disclosure Gap | 15% | Public claim language vs SEC filing language |

### Demo Companies

| Company | RDI | Dominant Drift | The Hook |
|---------|-----|----------------|----------|
| **Shell** | 84 | Regulatory Arbitrage | "30% reduction" public vs "20% subject to market conditions" in SEC 20-F |
| **Nike** | 71 | Supply Chain Omission | Supplier labor violations absent from all 5 regional pages |
| **H&M** | 78 | Legal Greenwashing | Banned in Norway for greenwashing, messaging identically everywhere else |

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind + Framer Motion
- **Backend**: FastAPI (Python)
- **AI**: Claude Sonnet 4.6 + Prompt Caching (protects credits)
- **Memory**: Cognee (temporal drift storage, $2,400 prize target)
- **Scraping**: Bright Data × 5 products
- **Deploy**: Vercel + Railway

## Bright Data Products Used

| Product | Where | Why It's Essential |
|---------|-------|-------------------|
| Residential Proxies | `geo_fetcher.py` | Country-specific exit IPs for regional pages |
| Web Unlocker | `geo_fetcher.py` | JS-heavy pages + bot detection bypass |
| SERP API | `sec_edgar.py`, `news_violations.py` | Structured search for SEC filings + violations |
| Scraping Browser | `glassdoor.py` | Cloud Playwright for Glassdoor reviews |
| Web Scraper API | `web_scraper.py` | Structured dataset collection |

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in your API keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Set NEXT_PUBLIC_API_URL
npm run dev
```

### Environment Variables
See `backend/.env.example` for all required keys.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/companies` | List demo companies |
| `GET /api/companies/{slug}` | Get pre-loaded analysis (instant) |
| `POST /api/analyze` | Run full analysis pipeline |
| `GET /api/analyze/stream` | SSE streaming progress |
| `GET /api/history/{company}` | Cognee temporal history |

## Demo Script

> "Most people think the internet is the same for everyone. It's not."
>
> "Shell published a sustainability report saying net zero by 2050 with binding interim targets. Their US website says something measurably different. Their SEC filing reports a 20% reduction target — not 30% like their press releases claim. Reality Drift found all of this. In under three minutes."

---

Built for the **Web Data UNLOCKED Hackathon** — May 25-30, 2026
