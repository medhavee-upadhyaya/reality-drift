# Reality Drift — Frontend CLAUDE.md

> You are in the **frontend/** directory. The full context is one level up.

**Start here:** Read [`../CLAUDE.md`](../CLAUDE.md) then [`../docs/PROJECT_STATE.md`](../docs/PROJECT_STATE.md).

---

## Frontend Quick Reference

**Dev server:** `npm run dev` → http://localhost:3000  
**Build check:** `npm run build` (must produce zero TypeScript errors)  
**Deploy:** `npx vercel --prod`

## Key Files

| File | Purpose |
|------|---------|
| `lib/types.ts` | TypeScript interfaces (mirrors `backend/data/schemas.py`) |
| `lib/api.ts` | `getCompany()`, `streamAnalysis()` (SSE consumer) |
| `lib/preloaded.ts` | `getPreloadedSlug()`, `DEMO_COMPANIES` array |
| `app/page.tsx` | Landing page (renders `<LandingPage />`) |
| `app/analyze/[company]/page.tsx` | Main dashboard |
| `app/globals.css` | CSS vars, `.glass-card`, `.rdi-number`, severity classes |

## Component Map

```
LandingPage.tsx             ← animated headline, search input, demo company cards
globe/DriftGlobe.tsx        ← Canvas rotating globe, 5 region pins
rdi/RDIReveal.tsx           ← Framer Motion count-up to score
rdi/RDIBreakdown.tsx        ← 4 animated sub-score bars
dna/DriftDNA.tsx            ← DNA bars + dominant drift type badge
filing/FilingDiscrepancyCard.tsx ← THE KEY DEMO MOMENT: public vs SEC
timeline/DriftTimeline.tsx  ← Recharts line chart (Cognee temporal data)
search/LiveAnalysisProgress.tsx ← SSE step progress display
```

## Adding a New Component

1. Create in `components/{category}/{Name}.tsx` with `"use client";` at top
2. Add props interface
3. Import in `app/analyze/[company]/page.tsx`
4. Add TypeScript types to `lib/types.ts` if needed

## Google Stitch Design

**Pending:** User has design in Google Stitch, will share to integrate visuals.  
When shared: update `globals.css` with design tokens, update `LandingPage.tsx` layout.

## Key Docs to Read

| Task | Doc |
|------|-----|
| All components | `../docs/FRONTEND.md` |
| API shape (TypeScript) | `../docs/API.md` |
| Deploy to Vercel | `../docs/ENV_AND_DEPLOY.md` |
