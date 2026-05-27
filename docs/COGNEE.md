# Cognee Integration — Reality Drift

## Why Cognee

Cognee provides **temporal drift memory** — the feature that turns Reality Drift from a one-time audit tool into continuous monitoring infrastructure.

> "Reality Drift doesn't just analyze today. It remembers. Every scan is stored as institutional memory. You can see whether a company is getting more consistent — or more deceptive. Shell's RDI has gone from 72 to 84 over the past three months."

This is the angle for the **Cognee Partner Prize ($500 gift card + $2,400 access)**.

---

## Version

**Cognee 1.1.0** — installed in backend venv.

⚠️ **Critical:** Cognee 1.1.0 changed its config API compared to 0.x:
- Config methods are now **synchronous** (no `await`)
- Graph DB method renamed: `set_graph_db_provider` → `set_graph_database_provider`
- V1 API (`add`, `cognify`, `search`) still works — we use these

---

## File Overview

### `backend/memory/cognee_client.py`
Initializes Cognee with Anthropic backend and local storage.

```python
# Correct v1.1.0 config (synchronous, not async):
cognee.config.set_llm_provider("anthropic")
cognee.config.set_llm_model("claude-haiku-4-5-20251001")   # Haiku = cheaper
cognee.config.set_llm_api_key(COGNEE_LLM_API_KEY)
cognee.config.set_vector_db_provider("lancedb")
cognee.config.set_graph_database_provider("networkx")      # NOT set_graph_db_provider
```

**Key design:** `_initialized = False` flag prevents double-init.  
`ensure_initialized()` is called lazily before any Cognee operation.

### `backend/memory/store.py`
Stores a completed analysis as a natural-language document:
```python
# Lazy import (critical — server must start without cognee)
import cognee  # ← inside the function, not at module top

document = f"""
Company Analysis Report
=======================
Company Name: {company}
Analysis ID: {analysis_id}
Analysis Timestamp: {timestamp}
Reality Drift Index: {rdi_score} out of 100
Dominant Drift Type: {drift_type}
...
"""
await cognee.add(document, dataset_name=f"company_{company_id}")
await cognee.cognify()
```

### `backend/memory/retrieve.py`
Queries history for temporal timeline:
```python
# Also lazy import
results = await cognee.search(
    query_text=f"Reality Drift Index score analysis {company_name} timestamp",
    query_type="GRAPH_COMPLETION",
    datasets=[f"company_{company_id}"],
)
# Parse results with regex (Cognee returns graph nodes as text)
rdi_match = re.search(r"Reality Drift Index:\s*(\d+)", text)
ts_match = re.search(r"Analysis Timestamp:\s*([\d\-T:Z+]+)", text)
```

---

## Environment Variables

```bash
COGNEE_LLM_API_KEY=sk-ant-...    # Same as ANTHROPIC_API_KEY (reuse, no extra cost)
COGNEE_DB_PATH=./cognee_db        # SQLite + LanceDB stored here (local)
```

On Railway, `COGNEE_DB_PATH` should be a persistent volume path. Default `./cognee_db` works for demo.

---

## Data Model

Cognee stores as graph entities. We don't define explicit entity types — we write natural-language documents and Cognee builds the graph automatically via `cognify()`.

**Document structure stored per analysis:**
```
Company Name: Shell
Analysis ID: shell-2026-05-26
Analysis Timestamp: 2026-05-26T02:00:00Z
Reality Drift Index: 84 out of 100
Dominant Drift Type: Regulatory Arbitrage
Sub-Scores:
- Geographic Drift Score: 78 (30% weight)
- Claim vs Evidence Score: 88 (35% weight)
- Temporal Drift Score: 25 (20% weight)
- Disclosure Gap Score: 100 (15% weight)
Key Contradictions:
1. [HIGH] "30% reduction by 2035" → Evidence: "20% subject to market conditions"
```

---

## Temporal History Flow

1. User runs first analysis of Apple.com → stored in `company_apple` dataset
2. User runs second analysis a week later → stored again in same dataset
3. `get_temporal_history("Apple")` searches Cognee → returns 2 `TemporalPoint` objects
4. `temporal_drift.py` computes stdev of [score1, score2] → temporal sub-score
5. Frontend `DriftTimeline.tsx` renders Recharts LineChart of the history

**Pre-seeded history** for Shell (in `shell.json`):
```json
"temporal_history": [
  {"timestamp": "2026-03-01T00:00:00Z", "rdi_score": 72, "analysis_id": "shell-2026-03"},
  {"timestamp": "2026-04-01T00:00:00Z", "rdi_score": 76, "analysis_id": "shell-2026-04"},
  {"timestamp": "2026-05-01T00:00:00Z", "rdi_score": 80, "analysis_id": "shell-2026-05"},
  {"timestamp": "2026-05-26T00:00:00Z", "rdi_score": 84, "analysis_id": "shell-2026-05-26"}
]
```

---

## Startup Behavior

In `main.py`:
```python
@asynccontextmanager
async def lifespan(app):
    try:
        await initialize_cognee()
        print("✅ Cognee memory initialized")
    except Exception as e:
        print(f"⚠️  Cognee init skipped (will retry on first use): {e}")
    yield
```

Server starts even if Cognee fails. First actual Cognee operation triggers retry.

---

## Prize Pitch Language

> "The Historical Drift Timeline is powered by Cognee. Every scan writes to a persistent knowledge graph. Over time, you build institutional memory of how a company changes — or doesn't. That's the feature that turns a one-time audit tool into a continuous monitoring infrastructure."
