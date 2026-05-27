"""
geographic_drift.py — Geographic Drift sub-score (30% of RDI)

Formula: geo_drift_score = (1 - mean_similarity) × 100
Bonus: +10 if max_variation > 0.5 (one region wildly different)

Range: 0-100
0 = perfectly identical across all regions
100 = completely different messaging per region
"""


def compute_geographic_drift(similarity: dict) -> int:
    """
    Args:
        similarity: Dict with keys:
            - mean_similarity: float 0.0-1.0 (average pairwise semantic similarity)
            - max_variation: float 0.0-1.0 (1.0 - minimum pairwise similarity)

    Returns:
        Geographic drift score 0-100
    """
    mean_sim = float(similarity.get("mean_similarity", 0.8))
    max_var = float(similarity.get("max_variation", 0.0))

    # Clamp to valid range
    mean_sim = max(0.0, min(1.0, mean_sim))
    max_var = max(0.0, min(1.0, max_var))

    # Base score: higher similarity = lower drift
    base_score = (1.0 - mean_sim) * 100

    # Bonus if at least one regional pair is drastically different
    variation_bonus = 10 if max_var > 0.5 else 0

    final = min(100, round(base_score + variation_bonus))

    print(f"[Scoring/Geo] mean_sim={mean_sim:.2f}, max_var={max_var:.2f} → {final}")
    return final
