"""
claim_evidence.py — Claim vs Evidence sub-score (35% of RDI)

Formula: weighted_contradiction_sum / total_claims × 100
Severity weights: high=1.0, medium=0.6, low=0.3

Range: 0-100
0 = no contradictions found
100 = every claim is contradicted with high severity
"""

SEVERITY_WEIGHTS = {
    "high": 1.0,
    "medium": 0.6,
    "low": 0.3,
}


def compute_claim_evidence_score(contradictions: list[dict], total_claims: int) -> int:
    """
    Args:
        contradictions: List of contradiction dicts with "severity" field
        total_claims: Total number of claims extracted across all regions

    Returns:
        Claim vs Evidence score 0-100
    """
    if not contradictions or total_claims == 0:
        return 0

    weighted_sum = sum(
        SEVERITY_WEIGHTS.get(c.get("severity", "low"), 0.3)
        for c in contradictions
    )

    ratio = min(1.0, weighted_sum / max(total_claims, 1))
    final = round(ratio * 100)

    print(
        f"[Scoring/CE] {len(contradictions)} contradictions, "
        f"{total_claims} claims, weighted_sum={weighted_sum:.2f} → {final}"
    )
    return final
