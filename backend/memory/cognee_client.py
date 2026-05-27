"""
cognee_client.py — Cognee initialization and configuration.

Cognee is used for temporal drift memory:
- Every analysis result is stored as institutional memory
- Historical RDI scores are queried to compute the Temporal Drift sub-score
- The Historical Drift Timeline UI component reads from Cognee

Configuration:
- LLM: Uses COGNEE_LLM_API_KEY (same as ANTHROPIC_API_KEY — no extra cost)
- Vector DB: LanceDB (local, no external service needed)
- Graph DB: NetworkX (local, no external service needed)
- Storage: SQLite at COGNEE_DB_PATH

Demo line:
"Reality Drift doesn't just analyze today. It remembers. Every scan is
institutional memory. You can see whether a company is getting more consistent
— or more deceptive."
"""

import os

COGNEE_LLM_API_KEY = os.getenv("COGNEE_LLM_API_KEY", os.getenv("ANTHROPIC_API_KEY", ""))
COGNEE_DB_PATH = os.getenv("COGNEE_DB_PATH", "./cognee_db")

_initialized = False


async def initialize_cognee():
    """Initialize Cognee with Anthropic LLM backend and local storage."""
    global _initialized

    if _initialized:
        return

    if not COGNEE_LLM_API_KEY:
        raise ValueError("COGNEE_LLM_API_KEY (or ANTHROPIC_API_KEY) not set")

    try:
        import cognee

        # cognee 1.1 config methods are synchronous
        cognee.config.set_llm_provider("anthropic")
        cognee.config.set_llm_model("claude-haiku-4-5-20251001")  # Haiku for Cognee (cheaper)
        cognee.config.set_llm_api_key(COGNEE_LLM_API_KEY)

        # Local storage — no external services required
        cognee.config.set_vector_db_provider("lancedb")
        cognee.config.set_graph_database_provider("networkx")  # v1.1 method name

        # Set storage path
        os.makedirs(COGNEE_DB_PATH, exist_ok=True)

        _initialized = True
        print(f"✅ Cognee initialized at {COGNEE_DB_PATH}")

    except ImportError:
        raise ImportError("cognee package not installed. Run: pip install cognee")
    except Exception as e:
        _initialized = False
        raise RuntimeError(f"Cognee initialization failed: {e}")


async def ensure_initialized():
    """Ensure Cognee is initialized before use."""
    global _initialized
    if not _initialized:
        await initialize_cognee()
