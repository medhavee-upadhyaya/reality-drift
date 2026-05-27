"""
disclosure_gap.py — Disclosure Gap sub-score (15% of RDI)

Formula: severity_base + min(40, abs(delta_numeric) × 4)
severity_base: high=60, medium=40, low=20, none=0

Shell example:
  severity=high (base=60) + min(40, 10pp × 4) = 60 + 40 = 100

Range: 0-100
"""

SEVERITY_BASE = {
    "high": 60,
    "medium": 40,
    "low": 20,
    "none": 0,
}


def compute_disclosure_gap(sec_filing) -> int:
    """
    Args:
        sec_filing: SECFiling object or dict, or None

    Returns:
        Disclosure gap score 0-100
    """
    if sec_filing is None:
        return 0

    # Handle both Pydantic model and dict
    if hasattr(sec_filing, "model_dump"):
        filing = sec_filing.model_dump()
    elif hasattr(sec_filing, "dict"):
        filing = sec_filing.dict()
    elif isinstance(sec_filing, dict):
        filing = sec_filing
    else:
        return 0

    severity = str(filing.get("discrepancy_severity", "none")).lower()
    base = SEVERITY_BASE.get(severity, 0)

    delta = filing.get("delta_numeric")
    quantitative_bonus = 0
    if delta is not None:
        try:
            quantitative_bonus = min(40, abs(float(delta)) * 4)
        except (TypeError, ValueError):
            quantitative_bonus = 0

    final = min(100, round(base + quantitative_bonus))

    print(
        f"[Scoring/DG] severity={severity} (base={base}), "
        f"delta={delta} (bonus={round(quantitative_bonus)}) → {final}"
    )
    return final
