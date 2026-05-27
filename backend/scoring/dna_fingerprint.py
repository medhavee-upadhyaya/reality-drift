"""
dna_fingerprint.py — Build the Drift DNA fingerprint from Claude's drift_type output.

The 4 DNA bars are computed by Claude and normalized here.
Each bar is an integer 0-100 representing a dimension of HOW a company drifts.
"""

from data.schemas import DriftDNA, DriftType


def compute_drift_dna(drift_result: dict) -> DriftDNA:
    """
    Normalize and validate the Drift DNA from Claude's drift_type call.

    Args:
        drift_result: Raw dict from drift_classifier.classify_drift()

    Returns:
        DriftDNA schema object
    """
    def clamp(val, default=50) -> int:
        try:
            return max(0, min(100, int(val)))
        except (TypeError, ValueError):
            return default

    drift_type_str = drift_result.get("dominant_drift_type", "Unknown")
    # Map string to enum (graceful fallback)
    try:
        drift_type = DriftType(drift_type_str)
    except ValueError:
        drift_type = DriftType.UNKNOWN

    return DriftDNA(
        regulatory_language_pct=clamp(drift_result.get("regulatory_language_pct", 50)),
        commitment_specificity_pct=clamp(drift_result.get("commitment_specificity_pct", 50)),
        omission_pattern_pct=clamp(drift_result.get("omission_pattern_pct", 50)),
        tone_variation_pct=clamp(drift_result.get("tone_variation_pct", 50)),
        dominant_drift_type=drift_type,
    )
