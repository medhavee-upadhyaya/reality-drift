# Reality Drift — Backend CLAUDE.md

> You are in the **backend/** directory. The full context is one level up.

**Start here:** Read [`../CLAUDE.md`](../CLAUDE.md) then [`../docs/PROJECT_STATE.md`](../docs/PROJECT_STATE.md).

---

## Backend Quick Reference

**Start server:** `source venv/bin/activate && uvicorn main:app --reload`  
**Run tests:** `python -m pytest` (no tests yet — add if needed)  
**Install deps:** `pip install -r requirements.txt`

## Entry Point

`main.py` — FastAPI app, includes 4 routers:
- `api/routes/health.py` → `GET /health`
- `api/routes/companies.py` → `GET /api/companies`, `GET /api/companies/{slug}`
- `api/routes/analyze.py` → `POST /api/analyze`, `GET /api/analyze/stream`
- `api/routes/history.py` → `GET /api/history/{company}`

## Single Source of Truth for Models

`data/schemas.py` — All Pydantic models. If adding a field, add it here first, then update `frontend/lib/types.ts`.

## Never Do These

1. ❌ Put `import cognee` at module top-level — server won't start without it
2. ❌ Remove `cache_control: {"type": "ephemeral"}` from `claude_client.py` — token costs spike
3. ❌ Call live scrapers for shell/nike/hm — `_is_preloaded()` in `analyze.py` must intercept

## Key Docs to Read

| Task | Doc |
|------|-----|
| Full project state | `../docs/PROJECT_STATE.md` |
| API endpoints/schemas | `../docs/API.md` |
| Scoring formulas | `../docs/SCORING.md` |
| Bright Data scrapers | `../docs/BRIGHT_DATA.md` |
| Cognee memory | `../docs/COGNEE.md` |
| Claude caching | `../docs/CLAUDE_AI_PIPELINE.md` |
| Deploy/env vars | `../docs/ENV_AND_DEPLOY.md` |
