# Reality Drift — Claude Context File

> **Read this file + `docs/PROJECT_STATE.md` only. Do NOT read source files unless something is broken. Everything you need to continue is in these docs.**

## ⚡ NEXT TASK (start here, no other reading needed)

**Deploy to Railway (backend) + Vercel (frontend). CLIs are installed, just need logins.**

1. User runs `! railway login` → browser auth → then run `cd backend && railway deploy`
2. User runs `! npx vercel login` → browser auth → then run `cd frontend && npx vercel --prod`
3. After deploy: add `NEXT_PUBLIC_API_URL=<railway-url>` env var in Vercel dashboard
4. Test both deployed URLs with Shell/Nike/H&M demo cards
5. Internal Compliance Mode is built — demo at `/compliance/shell`, `/compliance/nike`, `/compliance/hm`
6. Presentation Mode: `Cmd+Shift+D` on any dashboard page

---

## What This Project Is

**Reality Drift** — AI observability infrastructure that detects when companies publish different ESG/sustainability truths to different geographic regions. Shell says "30% emissions reduction" publicly but files "20% subject to market conditions" with the SEC. Reality Drift finds that automatically, with receipts.

Built for the **Web Data UNLOCKED Hackathon** (lablab.ai) — deadline **May 30, 2026 5PM Pacific**.

---

## Read These Docs (in order of relevance)

| Doc | Read When |
|-----|-----------|
| **[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)** | **Always read first.** Current build status, what's done, what's next, known issues. |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Understanding the full system: directory structure, data flow, tech stack. |
| **[docs/API.md](docs/API.md)** | Working on endpoints, request/response shapes, all Pydantic models. |
| **[docs/SCORING.md](docs/SCORING.md)** | Working on the RDI calculation: formulas, weights, sub-scores. |
| **[docs/BRIGHT_DATA.md](docs/BRIGHT_DATA.md)** | Working on scrapers: which Bright Data product lives in which file. |
| **[docs/COGNEE.md](docs/COGNEE.md)** | Working on memory/temporal features: Cognee setup, v1.1 quirks, API. |
| **[docs/CLAUDE_AI_PIPELINE.md](docs/CLAUDE_AI_PIPELINE.md)** | Working on AI analysis: prompt caching strategy, 5 Claude tasks, token costs. |
| **[docs/FRONTEND.md](docs/FRONTEND.md)** | Working on the UI: components, routes, preloaded vs live flow, animations. |
| **[docs/ENV_AND_DEPLOY.md](docs/ENV_AND_DEPLOY.md)** | Setting up .env, deploying to Railway + Vercel. |

---

## Working Directory

```
/Users/medha/Documents/Projects/Reality Drift/
├── backend/          ← FastAPI (Python), primary build target
├── frontend/         ← Next.js 14 (TypeScript)
├── CLAUDE.md         ← YOU ARE HERE
├── README.md
├── DEMO_SCRIPT.md
└── docs/             ← All context files
```

**Backend server:** `cd backend && source venv/bin/activate && uvicorn main:app --reload`  
**Frontend dev:** `cd frontend && npm run dev`

---

## The Three Demo Companies (pre-loaded, instant, never fail)

| Company | Slug | RDI | Dominant Drift | Key Hook |
|---------|------|-----|----------------|----------|
| Shell | `shell` | 84 | Regulatory Arbitrage | "30% reduction" (public) vs "20% subject to market conditions" (SEC 20-F) |
| Nike | `nike` | 71 | Supply Chain Omission | Supplier labor violations absent from all 5 regional sustainability pages |
| H&M | `hm` | 78 | Legal Greenwashing | Norway banned Conscious Collection as greenwashing — identical messaging globally |

**Pre-loaded JSON files:** `backend/data/preloaded/{shell,nike,hm}.json`  
**Static fallback:** `frontend/public/preloaded/{shell,nike,hm}.json`

---

## Critical Rules (never violate these)

1. **Prompt caching is always on.** Never remove `cache_control: {"type": "ephemeral"}` from `claude_client.py`. It cuts token costs ~90%.
2. **Cognee imports are lazy.** `import cognee` only inside functions, never at module top-level. Server must start without Cognee installed.
3. **Pre-loaded companies never hit live scrapers.** `_is_preloaded()` in `analyze.py` intercepts before any network call.
4. **All 5 Bright Data products must appear in the dashboard's "Data Sources" panel.** This is required for the $20K prize.
5. **Frontend has double fallback.** `getCompany(slug)` → `getPreloadedResult(slug)` from static JSON. Demo works even if Railway is down.

---

## 🔁 END OF EVERY SESSION — Mandatory Doc Update

**Before ending any session, always update the docs. This is not optional.**  
The user has a limited usage budget. Wasting it re-reading source code is not acceptable.  
These docs are the only thing standing between a fast session and an expensive one.

### What to update every time you finish work:

**`docs/PROJECT_STATE.md`** — the most important one:
- Move completed tasks from 🔲 to ✅
- Update the ⚡ IMMEDIATE NEXT TASK block to reflect exactly what to do next session
- Add any new known issues or quirks discovered
- Update "Verified Working" if new things were tested

**`CLAUDE.md` (this file)**:
- Update the ⚡ NEXT TASK block at the top to the new next task
- Keep it to 5 bullet points max — specific enough that no source reading is needed

**Relevant topic doc** (only if something changed in that area):
- `docs/ARCHITECTURE.md` — if files were added/moved
- `docs/FRONTEND.md` — if new components were built
- `docs/COGNEE.md` — if Cognee behavior changed
- `docs/API.md` — if endpoints changed
- etc.

### The test: could a new Claude session read ONLY `CLAUDE.md` + `PROJECT_STATE.md` and immediately start working without opening any `.py` or `.tsx` file? If no → the docs are not good enough. Fix them before ending the session.
