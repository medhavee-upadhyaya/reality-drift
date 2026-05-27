"""
rdi_calculator.py — Master Reality Drift Index computation.

RDI = geo×0.30 + ce×0.35 + td×0.20 + dg×0.15

Range: 0-100
0 = perfectly consistent company, no detectable drift
100 = maximum contradiction and narrative inconsistency
"""

from scoring.geographic_drift import compute_geographic_drift
from scoring.claim_evidence import compute_claim_evidence_score
from scoring.temporal_drift import compute_temporal_drift
from scoring.disclosure_gap import compute_disclosure_gap
from data.schemas import RDIComponent


async def compute_rdi(
    regional_similarity: dict,
    contradictions: list[dict],
    total_claims: int,
    sec_filing,
    cognee_history: list[dict],
) -> dict:
    """
    Compute the full Reality Drift Index.

    Returns dict matching the rdi_score + rdi_components fields of AnalysisResult.
    """
    geo_score = compute_geographic_drift(regional_similarity)
    ce_score = compute_claim_evidence_score(contradictions, total_claims)
    td_score = await compute_temporal_drift(cognee_history)
    dg_score = compute_disclosure_gap(sec_filing)

    weighted_rdi = (
        geo_score * 0.30 +
        ce_score * 0.35 +
        td_score * 0.20 +
        dg_score * 0.15
    )
    rdi_score = round(weighted_rdi)

    print(
        f"\n{'='*50}\n"
        f"Reality Drift Index: {rdi_score}\n"
        f"  Geographic Drift:  {geo_score} × 0.30 = {geo_score * 0.30:.1f}\n"
        f"  Claim vs Evidence: {ce_score} × 0.35 = {ce_score * 0.35:.1f}\n"
        f"  Temporal Drift:    {td_score} × 0.20 = {td_score * 0.20:.1f}\n"
        f"  Disclosure Gap:    {dg_score} × 0.15 = {dg_score * 0.15:.1f}\n"
        f"{'='*50}\n"
    )

    return {
        "rdi_score": rdi_score,
        "rdi_components": {
            "geographic_drift": RDIComponent(
                score=geo_score, weight=0.30, weighted=round(geo_score * 0.30, 2)
            ),
            "claim_evidence": RDIComponent(
                score=ce_score, weight=0.35, weighted=round(ce_score * 0.35, 2)
            ),
            "temporal_drift": RDIComponent(
                score=td_score, weight=0.20, weighted=round(td_score * 0.20, 2)
            ),
            "disclosure_gap": RDIComponent(
                score=dg_score, weight=0.15, weighted=round(dg_score * 0.15, 2)
            ),
        },
    }
