"""
retrieve.py — Query temporal drift history from Cognee memory.

Provides the Historical Drift Timeline data — the Cognee partner prize feature.
"""

import re
from data.schemas import TemporalPoint
from memory.cognee_client import ensure_initialized


async def get_temporal_history(company_name: str, limit: int = 20) -> list[TemporalPoint]:
    """
    Query Cognee for all past RDI analyses for a company.
    Returns sorted list of TemporalPoint (timestamp + rdi_score) for the timeline.

    Args:
        company_name: Company name to query
        limit: Maximum number of historical points to return

    Returns:
        List of TemporalPoint dicts sorted by timestamp (oldest first)
    """
    try:
        await ensure_initialized()
        import cognee  # lazy import
    except Exception as e:
        print(f"⚠️  Cognee not available: {e}")
        return []

    company_id = company_name.lower().replace(" ", "_").replace("&", "and")
    dataset_name = f"company_{company_id}"

    try:
        # Search Cognee graph for this company's analysis history
        results = await cognee.search(
            query_text=f"Reality Drift Index score analysis {company_name} timestamp",
            query_type="GRAPH_COMPLETION",
            datasets=[dataset_name],
        )
    except Exception as e:
        print(f"⚠️  Cognee search failed for {company_name}: {e}")
        return []

    # Parse structured data back from Cognee results
    history = []
    seen_ids = set()

    for result in results[:limit * 2]:  # Over-fetch, then trim
        parsed = _extract_temporal_point(result)
        if parsed and parsed.analysis_id not in seen_ids:
            seen_ids.add(parsed.analysis_id)
            history.append(parsed)

    # Sort by timestamp (oldest first)
    history.sort(key=lambda x: x.timestamp)

    # Trim to limit
    history = history[:limit]

    print(f"✅ Cognee retrieved {len(history)} history points for {company_name}")
    return history


def _extract_temporal_point(result) -> TemporalPoint | None:
    """Parse a Cognee search result into a TemporalPoint."""
    try:
        # Cognee returns graph nodes — extract from text content
        text = str(result)

        # Extract RDI score
        rdi_match = re.search(r"Reality Drift Index:\s*(\d+)", text)
        if not rdi_match:
            return None
        rdi_score = int(rdi_match.group(1))

        # Extract timestamp
        ts_match = re.search(
            r"Analysis Timestamp:\s*([\d\-T:Z+]+)", text
        )
        timestamp = ts_match.group(1) if ts_match else "2026-01-01T00:00:00Z"

        # Extract analysis ID
        id_match = re.search(r"Analysis ID:\s*([a-zA-Z0-9\-]+)", text)
        analysis_id = id_match.group(1) if id_match else f"cognee-{hash(text)}"

        return TemporalPoint(
            timestamp=timestamp,
            rdi_score=rdi_score,
            analysis_id=analysis_id,
        )
    except Exception:
        return None
