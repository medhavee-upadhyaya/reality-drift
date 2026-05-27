"""
drift_classifier.py — Classify dominant drift type and compute DNA fingerprint.
"""

from ai.claude_client import call_claude
from data.schemas import DriftDNA, DriftType


async def classify_drift(
    regional_text: dict[str, str],
    contradictions: list[dict],
    company_name: str,
) -> dict:
    """
    Classify the dominant drift type and compute Drift DNA bar percentages.

    Returns raw dict for use by compute_drift_dna() in scoring/dna_fingerprint.py
    """
    # Add contradictions summary to context
    augmented = dict(regional_text)
    if contradictions:
        contra_summary = "\n".join(
            f"- [{c.get('severity', '?').upper()}] {c.get('claim', '')} | "
            f"Evidence: {c.get('evidence_text', '')[:100]}"
            for c in contradictions[:5]
        )
        augmented["CONTRADICTIONS"] = f"IDENTIFIED CONTRADICTIONS:\n{contra_summary}"

    try:
        result, _ = await call_claude(
            task="drift_type",
            regional_text=augmented,
            company_name=company_name,
        )

        if isinstance(result, dict):
            return result

        print(f"⚠️  Drift classification returned unexpected type: {type(result)}")
        return _fallback_drift()

    except Exception as e:
        print(f"⚠️  Drift classification failed: {e}")
        return _fallback_drift()


def _fallback_drift() -> dict:
    return {
        "regulatory_language_pct": 50,
        "commitment_specificity_pct": 50,
        "omission_pattern_pct": 50,
        "tone_variation_pct": 50,
        "dominant_drift_type": "Unknown",
        "reasoning": "Insufficient data for classification",
    }
