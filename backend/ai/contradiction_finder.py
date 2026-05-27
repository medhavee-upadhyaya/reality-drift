"""
contradiction_finder.py — Find contradictions between claims and evidence using Claude.
"""

from ai.claude_client import call_claude


async def find_contradictions(
    claims_text: str,
    evidence_text: str,
    company_name: str,
    regional_text: dict = None,
) -> list[dict]:
    """
    Find contradictions between public claims and evidence (SEC filings, news).

    Returns list of contradiction dicts matching the Contradiction schema.
    """
    if not regional_text:
        regional_text = {}

    # Inject claims into context by adding to regional_text as synthetic region
    augmented = dict(regional_text)
    augmented["CLAIMS_SUMMARY"] = f"EXTRACTED CLAIMS:\n{claims_text}"

    extra = f"EVIDENCE FOR COMPARISON:\n{evidence_text}" if evidence_text else ""

    try:
        result, _ = await call_claude(
            task="contradictions",
            regional_text=augmented,
            company_name=company_name,
            extra_context=extra,
        )

        if isinstance(result, list):
            # Validate and normalize each contradiction
            valid = []
            for item in result:
                if isinstance(item, dict) and item.get("claim") and item.get("evidence_text"):
                    # Ensure required fields with safe defaults
                    item.setdefault("evidence_source", "Unknown")
                    item.setdefault("contradiction_type", "omission")
                    item.setdefault("severity", "medium")
                    item.setdefault("region_source", "US")
                    valid.append(item)
            return valid

        print(f"⚠️  Contradiction finder returned unexpected type: {type(result)}")
        return []

    except Exception as e:
        print(f"⚠️  Contradiction finding failed: {e}")
        return []
