"""
sec_comparator.py — Compare public claims against SEC regulatory filing language.

This is the most important single output: the moment where "they said X publicly
but filed Y with regulators" becomes inarguable.
"""

from ai.claude_client import call_claude
from data.schemas import SECFiling, ContradictionSeverity


async def compare_sec_filing(
    prominent_claim: str,
    sec_text: str,
    company_name: str,
    regional_text: dict = None,
) -> SECFiling | None:
    """
    Compare a company's most prominent public claim against their SEC filing.

    Returns SECFiling schema object or None if comparison not possible.
    """
    if not sec_text or not prominent_claim:
        return None

    if not regional_text:
        regional_text = {}

    # Add SEC text and claim to context
    augmented = dict(regional_text)
    augmented["SEC_FILING_CONTENT"] = f"SEC REGULATORY FILING:\n{sec_text[:15000]}"
    augmented["PUBLIC_CLAIM"] = f"PROMINENT PUBLIC CLAIM TO COMPARE:\n{prominent_claim}"

    try:
        result, _ = await call_claude(
            task="sec_compare",
            regional_text=augmented,
            company_name=company_name,
        )

        if isinstance(result, dict) and result.get("public_claim"):
            severity_map = {"high": ContradictionSeverity.HIGH, "medium": ContradictionSeverity.MEDIUM, "low": ContradictionSeverity.LOW}
            severity = severity_map.get(result.get("discrepancy_severity", "low"), ContradictionSeverity.LOW)

            return SECFiling(
                filing_type=result.get("filing_type", "unknown"),
                filing_date="2024-01-01",  # Would be extracted from actual filing
                public_claim=result.get("public_claim", prominent_claim),
                sec_language=result.get("sec_language", ""),
                delta_description=result.get("delta_description", ""),
                delta_numeric=result.get("delta_numeric"),
                discrepancy_severity=severity,
            )

        return None

    except Exception as e:
        print(f"⚠️  SEC comparison failed: {e}")
        return None
