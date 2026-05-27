"""
temporal_drift.py — Temporal Drift sub-score (20% of RDI)

Formula: stdev(history_scores) / 50 × 100
Bonus: +15 if latest score > all previous (escalating trend)
Returns 0 if < 2 data points.

Range: 0-100
"""

import statistics


async def compute_temporal_drift(history: list[dict]) -> int:
    """
    Args:
        history: List of TemporalPoint-like dicts with "rdi_score" field

    Returns:
        Temporal drift score 0-100
    """
    scores = [
        h["rdi_score"] for h in history
        if isinstance(h, dict) and h.get("rdi_score") is not None
    ]

    if len(scores) < 2:
        print(f"[Scoring/TD] Insufficient history ({len(scores)} points) → 0")
        return 0

    try:
        stddev = statistics.stdev(scores)
    except statistics.StatisticsError:
        return 0

    base_score = min(100, round((stddev / 50) * 100))

    # Escalation bonus: if each scan shows higher drift, that's more concerning
    latest = scores[-1]
    escalation_bonus = 15 if all(latest > s for s in scores[:-1]) else 0

    final = min(100, base_score + escalation_bonus)

    print(
        f"[Scoring/TD] {len(scores)} history points, stddev={stddev:.2f}, "
        f"escalation={escalation_bonus} → {final}"
    )
    return final
