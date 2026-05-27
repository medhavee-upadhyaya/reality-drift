"""
claim_extractor.py — Extract ESG claims per region using Claude.
"""

from ai.claude_client import call_claude


async def extract_claims(
    regional_text: dict[str, str],
    company_name: str,
) -> dict[str, list[str]]:
    """
    Extract all specific ESG/sustainability claims from each regional page.

    Returns dict: { "US": ["claim1", "claim2", ...], "DE": [...], ... }
    """
    if not regional_text:
        return {region: [] for region in ["US", "DE", "IN", "BR", "SG"]}

    try:
        result, _ = await call_claude(
            task="claims",
            regional_text=regional_text,
            company_name=company_name,
        )

        if isinstance(result, dict):
            # Ensure all expected regions are present
            for region in ["US", "DE", "IN", "BR", "SG"]:
                if region not in result:
                    result[region] = []
                elif not isinstance(result[region], list):
                    result[region] = []
            return result

        print(f"⚠️  Claim extraction returned unexpected type: {type(result)}")
        return {region: [] for region in ["US", "DE", "IN", "BR", "SG"]}

    except Exception as e:
        print(f"⚠️  Claim extraction failed: {e}")
        return {region: [] for region in ["US", "DE", "IN", "BR", "SG"]}
