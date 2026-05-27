# Frontend — Reality Drift

## Tech Stack

- **Next.js 14** (App Router, `"use client"` where needed)
- **Tailwind CSS** — utility classes, custom CSS vars in `globals.css`
- **Framer Motion** — all animations (count-up, bar fills, stagger reveals)
- **Recharts** — `DriftTimeline` line chart
- **react-globe.gl** — installed but not used (we built canvas globe instead — SSR safe)

---

## Routes

| Route | File | What It Does |
|-------|------|--------------|
| `/` | `app/page.tsx` → `components/LandingPage.tsx` | Animated headline, search input, 3 demo cards, background globe |
| `/analyze/[company]` | `app/analyze/[company]/page.tsx` | Full dashboard (pre-loaded instant or live SSE) |

---

## Key Files

### `frontend/lib/types.ts`
TypeScript interfaces mirroring all Pydantic schemas. Also exports:
```typescript
getRDIColor(score: number): string   // "#22c55e" | "#eab308" | "#f97316" | "#ef4444"
getRDILabel(score: number): string   // "Low Drift" | "Moderate" | "High" | "Extreme Drift"
DRIFT_TYPE_COLORS: Record<string, string>
REGION_COORDS: Record<string, [number, number]>  // lat/lng for globe pins
```

### `frontend/lib/api.ts`
Typed fetch wrappers:
```typescript
getCompany(slug: string): Promise<AnalysisResult>
analyzeCompany(url, companyName, forceLive): Promise<AnalysisResult>
streamAnalysis(url, companyName, onProgress, onError): () => void  // returns cleanup
```
`streamAnalysis` uses native `EventSource` for SSE. Parses JSON from each SSE data event.

### `frontend/lib/preloaded.ts`
```typescript
getPreloadedSlug(urlOrName: string): string | null
getPreloadedResult(slug: string): Promise<AnalysisResult | null>  // fetches /public/preloaded/
DEMO_COMPANIES: [{slug, name, rdi, driftType, color, hook}, ...]
```

---

## Components

### `components/globe/DriftGlobe.tsx`
Canvas-based animated 3D globe (SSR-safe, no WebGL dependency).

```typescript
<DriftGlobe
  rdiScore={84}                          // Colors the pins + arcs
  activeRegions={["US","DE","IN","BR","SG"]}  // Which pins glow (others dim)
/>
```

- Rotating sphere with latitude/longitude grid lines
- 5 region pins that light up in RDI color when active
- Arc lines connecting active regions
- Region labels (US/DE/IN/BR/SG) at pin locations
- Framer Motion fade-in on mount
- Used on: landing page (top-right background) + analyze page (left column)

### `components/rdi/RDIReveal.tsx`
```typescript
<RDIReveal score={84} animate={true} />
```
Counts up from 0 to score over 1800ms using setInterval.  
Color-coded glow ring via `getRDIColor()`.  
"REALITY DRIFT INDEX" label below, colored score label above.

### `components/rdi/RDIBreakdown.tsx`
```typescript
<RDIBreakdown components={result.rdi_components} />
```
4 stacked bars: Geographic (30%) / Claim vs Evidence (35%) / Temporal (20%) / Disclosure Gap (15%).  
Each bar `motion.div` animates from width 0 → `${score}%` on mount.

### `components/dna/DriftDNA.tsx`
```typescript
<DriftDNA dna={result.drift_dna} />
```
Dominant drift type badge (colored by `DRIFT_TYPE_COLORS`).  
4 bars: Regulatory Language / Commitment Specificity / Omission Pattern / Tone Variation.

### `components/filing/FilingDiscrepancyCard.tsx`
```typescript
<FilingDiscrepancyCard filing={result.sec_filing} />
```
Red-themed card with two columns: public claim (left) vs SEC language (right).  
`delta_numeric` badge in top-right corner.  
This is **the key demo moment** — "inarguable proof" per demo script.

### `components/timeline/DriftTimeline.tsx`
```typescript
<DriftTimeline history={result.temporal_history} company="Shell" />
```
Recharts `LineChart` with `CustomTooltip`.  
Shows "escalating" / "declining" trend label.  
"Powered by Cognee" attribution text at bottom.  
Only renders when `temporal_history.length >= 2`.

### `components/search/LiveAnalysisProgress.tsx`
```typescript
<LiveAnalysisProgress
  events={progressEvents}
  currentStep={currentStep}
  progress={progress}
/>
```
Progress bar at top.  
Step list: completed steps (green checkmark), current step (pulsing), pending steps (dim).  
7 steps: Geo Fetch → SEC Scrape → News Scan → Glassdoor → AI Analysis → Scoring → Memory

---

## Analysis Page Flow (`app/analyze/[company]/page.tsx`)

```
1. Get company param from URL
2. getPreloadedSlug(companyParam) → if slug found:
   a. Try getCompany(slug) from backend API
   b. If backend fails: getPreloadedResult(slug) from /public/preloaded/
3. If not preloaded:
   a. setIsLive(true)
   b. streamAnalysis() → EventSource SSE
   c. Show LiveAnalysisProgress while loading
4. On result: render 3-column dashboard
```

**3-column grid layout:**
- **Left:** DriftGlobe + Regional Coverage (claims per region) + Data Sources (Bright Data)
- **Center:** RDIReveal + RDIBreakdown + Contradictions list
- **Right:** DriftDNA + FilingDiscrepancyCard + DriftTimeline + Glassdoor signals

---

## CSS Design System (`app/globals.css`)

```css
/* Key classes */
.glass-card        /* backdrop-filter blur, bg-white/3, border-white/8 */
.rdi-number        /* Geist Mono font — used for all numeric displays */
.severity-high     /* text-red-400 bg-red-500/10 border-red-500/20 */
.severity-medium   /* text-yellow-400 bg-yellow-500/10 */
.severity-low      /* text-green-400 bg-green-500/10 */
```

**Color palette:**
```css
--background: #050a18   /* deep navy black */
--navy:       #0a1628
--red:        #ef4444
--yellow:     #eab308
--orange:     #f97316
--green:      #22c55e
--border:     rgba(255,255,255,0.08)
```

---

## Google Stitch Design

**Status:** User has a design ready in Google Stitch. Will share when ready to connect.

**How to integrate when shared:**
1. User shares Stitch export or component specs
2. Update `globals.css` with Stitch color tokens
3. Replace `LandingPage.tsx` layout with Stitch structure (keep logic, swap visuals)
4. Update `glass-card` and animation classes to match Stitch design
5. Notify user when connected

---

## Build & Dev

```bash
# Development
cd frontend && npm run dev      # http://localhost:3000

# Production build check
npm run build                   # Must produce zero TypeScript errors

# Deploy (after npm run build passes)
vercel --prod
```

**Last verified build:** ✅ Zero TypeScript errors (May 26, 2026)

---

## Static Fallback

`frontend/public/preloaded/shell.json`, `nike.json`, `hm.json`  
Served at `/preloaded/{slug}.json` by Next.js static file serving.  
`getPreloadedResult(slug)` in `preloaded.ts` fetches these.  
Demo works even if Railway backend is completely down.
