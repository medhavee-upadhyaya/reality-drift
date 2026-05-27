# Claude AI Pipeline — Reality Drift

## Overview

Claude Sonnet 4.6 (`claude-sonnet-4-6`) runs 5 analysis tasks per live analysis.  
**Aggressive prompt caching reduces cost ~90%** — all 5 tasks share the same cached HTML context.

---

## The 3-Layer Caching Strategy

### Layer 1: System Prompt Cache
- `SYSTEM_PROMPT` in `prompts.py` is ~1500 tokens (above the 1024-token caching threshold)
- Marked `cache_control: {"type": "ephemeral"}` in the `system` block
- Cached for 5 minutes; all 5 Claude calls in one analysis hit this cache

### Layer 2: HTML Context Cache  
- The combined 5-region page text (~30–50k tokens) is the FIRST user content block
- Also marked `cache_control: {"type": "ephemeral"}`
- First call writes the cache; calls 2–5 READ from cache (~$0.001 each instead of ~$0.08)
- The task instruction (small, ~200 tokens) is the LAST content block and is NOT cached

### Layer 3: Result Cache
- `backend/utils/cache.py` — in-memory dict, 1-hour TTL, keyed by SHA256(url)
- If same URL analyzed within an hour: returns cached result, zero Claude calls
- Cleared on server restart

**Net cost:** Running all 5 Claude tasks for one analysis ≈ cost of 1.2 uncached calls.

---

## The 5 Claude Tasks

Each call uses `call_claude(task, regional_text, company_name, extra_context)`.

### Task 1: `"claims"`
**File:** `ai/claim_extractor.py`  
**Input:** All 5 regions' page text  
**Output:**
```json
{
  "US": ["Net zero by 2050", "30% emissions reduction by 2035"],
  "DE": ["Netto-Null bis 2050", "Verbindliche Zwischenziele"],
  "IN": ["Sustainability commitment", "Clean energy transition"],
  "BR": ["Zero carbono até 2050"],
  "SG": ["Net zero commitment", "Regional sustainability goals"]
}
```

### Task 2: `"contradictions"`
**File:** `ai/contradiction_finder.py`  
**Extra context:** SEC filing text + news violations  
**Output:**
```json
[
  {
    "claim": "30% emissions reduction by 2035",
    "evidence_source": "SEC 20-F 2023",
    "evidence_text": "20% reduction subject to market conditions and government policy",
    "contradiction_type": "quantitative_delta",
    "severity": "high",
    "region_source": "US"
  },
  ...
]
```

### Task 3: `"drift_type"`
**File:** `ai/drift_classifier.py`  
**Output:**
```json
{
  "dominant_drift_type": "Regulatory Arbitrage",
  "regulatory_language_pct": 85,
  "commitment_specificity_pct": 30,
  "omission_pattern_pct": 70,
  "tone_variation_pct": 75,
  "reasoning": "Shell uses highly specific language on DE page (for EU CSRD compliance) but vague aspirational language on US page where no binding disclosure rules exist."
}
```

### Task 4: `"sec_compare"`
**File:** `ai/sec_comparator.py`  
**Extra context:** SEC filing text  
**Output:**
```json
{
  "public_claim": "30% absolute emissions reduction by 2035",
  "sec_language": "Targets to reduce net carbon intensity by 20%, subject to market conditions and government support",
  "delta_description": "Public claims a higher (30% absolute) target vs SEC's 20% intensity reduction with conditions",
  "delta_numeric": 10.0,
  "discrepancy_severity": "high",
  "filing_type": "20-F",
  "filing_date": "2024-03-15"
}
```

### Task 5: `"geographic_similarity"` (computed in scoring layer)
Actually computed in `analyze.py` by passing regional page text through a similarity proxy.  
The Claude `geographic_similarity` task is defined in `prompts.py` but currently the scoring uses a simpler proxy (`1 - regions_fetched × 0.12`).  
**To improve:** Call Claude's `geographic_similarity` task to get real semantic similarity scores.

---

## Message Structure for Each Call

```python
# backend/ai/claude_client.py
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=[{
        "type": "text",
        "text": SYSTEM_PROMPT,
        "cache_control": {"type": "ephemeral"}   # Layer 1: system cache
    }],
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": html_context,              # All 5 regions, ~50k tokens
                "cache_control": {"type": "ephemeral"}  # Layer 2: HTML cache
            },
            {
                "type": "text",
                "text": f"\n\nADDITIONAL EVIDENCE:\n{sec_text}",
                "cache_control": {"type": "ephemeral"}  # Also cached
            },
            {
                "type": "text",
                "text": TASK_PROMPTS[task]          # Small, NOT cached (varies)
            }
        ]
    }]
)
```

---

## JSON Response Parsing

Claude always returns JSON (enforced by TASK_PROMPTS format instructions).  
`_parse_json_response()` in `claude_client.py` handles:
- Markdown code blocks (` ```json ... ``` `)
- Leading/trailing whitespace
- Fallback regex extraction if needed

---

## Cache Hit Logging

Each call logs:
```
[Claude/claims] cache=HIT 🎯 | read=48231 | write=0 | input=312 | output=892
[Claude/contradictions] cache=HIT 🎯 | read=48231 | write=0 | input=298 | output=1204
[Claude/drift_type] cache=MISS (writing cache) | read=0 | write=48231 | input=48543 | output=634
```

First call writes cache (MISS), subsequent 4 calls are HITs.

---

## SYSTEM_PROMPT Content

Located in `backend/ai/prompts.py`. Must be **>1024 tokens** to trigger caching.

Key sections:
- Role definition: "Expert ESG analyst, 20 years experience"
- Expertise domains: GRI, TCFD, SASB, CDP, CSRD, SEC climate rules
- Output format rules: "Respond with JSON only. No prose."
- Severity classification guide
- Contradiction type definitions
- Geographic variation analysis methodology

---

## Adding a New Claude Task

1. Add task prompt to `TASK_PROMPTS` dict in `prompts.py`
2. Create `backend/ai/{task_name}.py` following the pattern of `claim_extractor.py`
3. Call `call_claude(task="{task_name}", ...)` 
4. Add call to `_run_full_pipeline()` in `analyze.py`
5. Add result handling to `AnalysisResult` schema if needed
