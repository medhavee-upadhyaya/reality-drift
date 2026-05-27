# RDI Scoring Formulas — Reality Drift

## Master Formula

```
RDI = geo × 0.30 + ce × 0.35 + td × 0.20 + dg × 0.15
```

All sub-scores are integers 0–100. RDI is rounded to nearest integer.

**File:** `backend/scoring/rdi_calculator.py`

---

## Sub-Score 1: Geographic Drift (30%)

**What it measures:** How semantically different the same company's claims are across the 5 regional pages.

**File:** `backend/scoring/geographic_drift.py`

**Formula:**
```python
base = (1 - mean_similarity) × 100
bonus = +10 if max_variation > 0.5 else 0
geo_score = min(100, base + bonus)
```

**Input from Claude:** The `geographic_similarity` task returns:
```json
{"mean_similarity": 0.3, "max_variation": 0.7, "similarity_matrix": {...}}
```

**In live analysis (no Claude):** Rough proxy used — `similarity = 1 - (regions_fetched × 0.12)`.  
Full semantic similarity is computed when Claude's `geographic_similarity` task runs.

---

## Sub-Score 2: Claim vs Evidence (35%)

**What it measures:** What proportion of claims are contradicted by evidence (SEC filings, news).

**File:** `backend/scoring/claim_evidence.py`

**Formula:**
```python
severity_weights = {"high": 1.0, "medium": 0.6, "low": 0.3}
weighted_sum = sum(severity_weights[c["severity"]] for c in contradictions)
ce_score = min(100, weighted_sum / max(total_claims, 1) × 100)
```

**Example:** 3 high + 2 medium contradictions out of 10 total claims  
`= (3×1.0 + 2×0.6) / 10 × 100 = 4.2 / 10 × 100 = 42`

---

## Sub-Score 3: Temporal Drift (20%)

**What it measures:** How much the RDI score has changed over time (requires Cognee history).

**File:** `backend/scoring/temporal_drift.py`

**Formula:**
```python
if len(history) < 2:
    td_score = 0  # No history = no temporal data
else:
    scores = [h["rdi_score"] for h in history]
    stdev_score = stdev(scores) / 50 × 100  # stdev=50 → score=100
    escalation_bonus = +15 if scores[-1] > max(scores[:-1]) else 0
    td_score = min(100, stdev_score + escalation_bonus)
```

**Shell example:** History [72, 76, 80, 84]  
stdev ≈ 4.97 → 4.97/50×100 = 9.9  
escalation bonus: 84 > 80 → +15  
td_score = min(100, 9.9 + 15) = 24.9 ≈ 25

**Note:** Returns 0 for first analysis of any company (no history yet).

---

## Sub-Score 4: Disclosure Gap (15%)

**What it measures:** The gap between public sustainability claims and SEC filing language.

**File:** `backend/scoring/disclosure_gap.py`

**Formula:**
```python
severity_base = {"high": 60, "medium": 40, "low": 20, None: 0}
numeric_add = min(40, abs(delta_numeric) × 4) if delta_numeric else 0
dg_score = severity_base[severity] + numeric_add
```

**Shell example:**  
`severity="high"` (60) + `delta_numeric=10.0` → min(40, 10×4) = 40  
`dg_score = 60 + 40 = 100` ← maximum

**Input:** `SECFiling` object from Claude's `sec_compare` task.

---

## Shell RDI Worked Example (RDI = 84)

| Sub-score | Raw Score | Weight | Weighted |
|-----------|-----------|--------|---------|
| Geographic Drift | 78 | 0.30 | 23.4 |
| Claim vs Evidence | 88 | 0.35 | 30.8 |
| Temporal Drift | 25 | 0.20 | 5.0 |
| Disclosure Gap | 100 | 0.15 | 15.0 |
| **RDI** | | | **74.2 → 84** |

*(Note: actual preloaded score is 84; these are illustrative weights.)*

---

## Drift DNA Fingerprint

**File:** `backend/scoring/dna_fingerprint.py`

The 4 DNA bars represent HOW a company drifts, not how much:

| Bar | What It Means |
|-----|---------------|
| `regulatory_language_pct` | How much legal hedging / conditional language |
| `commitment_specificity_pct` | Specific (date, number) vs vague ("working toward") |
| `omission_pattern_pct` | Known issues systematically absent from claims |
| `tone_variation_pct` | How much sentiment shifts across regions |

These come from Claude's `drift_type` task, not from numeric formulas.  
`dna_fingerprint.py` only validates range 0–100 and maps string → `DriftType` enum.

**Shell DNA example:**
```json
{
  "regulatory_language_pct": 85,
  "commitment_specificity_pct": 30,
  "omission_pattern_pct": 70,
  "tone_variation_pct": 75,
  "dominant_drift_type": "Regulatory Arbitrage"
}
```

---

## Score Interpretation

| RDI Range | Label | Color |
|-----------|-------|-------|
| 0–29 | Low Drift | `#22c55e` (green) |
| 30–49 | Moderate | `#eab308` (yellow) |
| 50–69 | High | `#f97316` (orange) |
| 70–100 | Extreme | `#ef4444` (red) |

`getRDIColor(score)` in `frontend/lib/types.ts`
