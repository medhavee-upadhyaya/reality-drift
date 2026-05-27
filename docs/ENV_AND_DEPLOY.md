# Environment Variables & Deployment — Reality Drift

## Local Setup

```bash
# Backend
cd backend
cp .env.example .env       # Then fill in values below
source venv/bin/activate
uvicorn main:app --reload  # http://localhost:8000

# Frontend
cd frontend
cp .env.local.example .env.local   # Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                         # http://localhost:3000
```

---

## All Environment Variables

### Backend (`backend/.env`)

```bash
# ── Anthropic ────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...             # Claude API key (user has this)

# ── Bright Data ──────────────────────────────────────────────────────────────
# Find at: https://brightdata.com/cp/zones
BRIGHT_DATA_CUSTOMER_ID=hl_xxxxxxxxxxxxx          # Your customer ID
BRIGHT_DATA_RESIDENTIAL_PASSWORD=xxxxxxxxxxxxx    # Zone "residential" password
BRIGHT_DATA_WEB_UNLOCKER_PASSWORD=xxxxxxxxxxxxx  # Zone "web_unlocker1" password (often same)
BRIGHT_DATA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx # API token (for SERP API + Web Scraper API)
BRIGHT_DATA_SCRAPING_BROWSER_PASSWORD=xxxxxxxxxxx # Zone "scraping_browser" password

# ── Cognee ───────────────────────────────────────────────────────────────────
COGNEE_LLM_API_KEY=${ANTHROPIC_API_KEY}   # Reuse Anthropic key, no extra cost
COGNEE_DB_PATH=./cognee_db                # Local SQLite + LanceDB storage

# ── Server ───────────────────────────────────────────────────────────────────
PORT=8000
ALLOWED_ORIGINS=https://reality-drift.vercel.app,http://localhost:3000,http://localhost:3001

# ── Optional ─────────────────────────────────────────────────────────────────
ENVIRONMENT=development    # "development" | "production"
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000   # → Railway URL after deploy
```

---

## Where to Get Bright Data Credentials

1. Login to https://brightdata.com
2. Apply promo code `unlocked` for $250 credits
3. Go to **Zones** panel
4. Create zones (or use existing):
   - `residential` — for Residential Proxies
   - `web_unlocker1` — for Web Unlocker
   - `scraping_browser` — for Scraping Browser
5. Find your **Customer ID** (shown as `hl_XXXXXXXX` in zone credentials)
6. Each zone has a **password** — copy it
7. For SERP API + Web Scraper API: go to **API** section → generate API token

---

## Railway Deploy (Backend)

### First time:
```bash
cd backend
# Install Railway CLI: brew install railway
railway login
railway init         # Creates new project
railway up           # Deploys from Dockerfile
```

### Environment variables on Railway:
Go to Railway dashboard → Project → Variables tab. Add all backend `.env` variables.

**Required for Railway:**
```
ANTHROPIC_API_KEY
BRIGHT_DATA_CUSTOMER_ID
BRIGHT_DATA_RESIDENTIAL_PASSWORD
BRIGHT_DATA_WEB_UNLOCKER_PASSWORD
BRIGHT_DATA_API_TOKEN
BRIGHT_DATA_SCRAPING_BROWSER_PASSWORD
COGNEE_LLM_API_KEY
ALLOWED_ORIGINS=https://reality-drift.vercel.app
PORT=8000
```

**`railway.toml`** (already configured):
```toml
[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
```

After deploy, get the Railway URL (e.g., `https://reality-drift-backend.railway.app`).

---

## Vercel Deploy (Frontend)

### First time:
```bash
cd frontend
npx vercel           # Follow prompts, connect to project
npx vercel --prod    # Deploy to production
```

### Or via Vercel dashboard:
1. Connect GitHub repo
2. Root Directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `.next`

### Environment variables on Vercel:
```
NEXT_PUBLIC_API_URL=https://reality-drift-backend.railway.app
```

---

## After Deploy Checklist

- [ ] Railway backend `/health` returns `{"status":"ok"}`
- [ ] Vercel frontend loads at `https://reality-drift.vercel.app`
- [ ] Update `ALLOWED_ORIGINS` in Railway to include Vercel URL
- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel to Railway URL
- [ ] Test `GET /api/companies/shell` from Vercel frontend
- [ ] Test clicking Shell card → instant analysis loads
- [ ] Test typing a real company URL → SSE progress shows, analysis completes

---

## Cognee Persistence on Railway

Cognee stores data at `COGNEE_DB_PATH` (SQLite + LanceDB files).  
Railway's filesystem is **ephemeral by default** — restarts clear the data.

**Options:**
1. **Railway Volume** (recommended for hackathon): Add a persistent volume, set `COGNEE_DB_PATH=/data/cognee_db`
2. **Accept ephemeral** (OK for demo): Pre-loaded companies have hardcoded `temporal_history` in their JSON; Cognee only stores live analyses.

For hackathon purposes, option 2 is fine — the Shell pre-loaded JSON has 4 history points showing the escalation from 72→84.

---

## Quick Health Test After Deploy

```bash
# Test backend
curl https://reality-drift-backend.railway.app/health
curl https://reality-drift-backend.railway.app/api/companies/shell | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'RDI={d[\"rdi_score\"]}')"

# Expected:
# {"status":"ok","version":"1.0.0","environment":"production"}
# RDI=84
```
