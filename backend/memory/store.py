"""
store.py — Store analysis results in Cognee graph memory.

Each analysis result is stored as a structured natural-language document
that Cognee converts into a knowledge graph + vector embeddings.

Schema stored:
- Company entity (name, domain, first analyzed)
- AnalysisRun entity (RDI score, timestamp, drift type, all sub-scores)
- Claims (per region, with contradiction flags)
- The temporal chain (each run FOLLOWS the previous)
"""

from memory.cognee_client import ensure_initialized


async def store_analysis(result: dict) -> str:
    """
    Store a complete AnalysisResult in Cognee memory.

    Args:
        result: AnalysisResult as dict (from model.model_dump())

    Returns:
        analysis_id of stored result
    """
    await ensure_initialized()
    import cognee  # lazy import — requires cognee to be installed

    company = result.get("company", "Unknown")
    company_id = company.lower().replace(" ", "_").replace("&", "and")
    analysis_id = result.get("analysis_id", "unknown")
    rdi_score = result.get("rdi_score", 0)
    timestamp = result.get("timestamp", "")

    drift_dna = result.get("drift_dna", {})
    drift_type = drift_dna.get("dominant_drift_type", "Unknown")

    components = result.get("rdi_components", {})
    geo = components.get("geographic_drift", {}).get("score", 0)
    ce = components.get("claim_evidence", {}).get("score", 0)
    td = components.get("temporal_drift", {}).get("score", 0)
    dg = components.get("disclosure_gap", {}).get("score", 0)

    contradictions = result.get("contradictions", [])
    regional_pages = result.get("regional_pages", {})
    total_claims = sum(
        len(p.get("claims", [])) for p in regional_pages.values()
        if isinstance(p, dict)
    )

    # Build structured document for Cognee ingestion
    document = f"""
Company Analysis Report
=======================
Company Name: {company}
Company ID: {company_id}
Analysis ID: {analysis_id}
Analysis Timestamp: {timestamp}
URL Analyzed: {result.get("url", "")}

Reality Drift Index: {rdi_score} out of 100
Dominant Drift Type: {drift_type}

Sub-Scores:
- Geographic Drift Score: {geo} (30% weight)
- Claim vs Evidence Score: {ce} (35% weight)
- Temporal Drift Score: {td} (20% weight)
- Disclosure Gap Score: {dg} (15% weight)

Drift DNA Fingerprint:
- Regulatory Language: {drift_dna.get("regulatory_language_pct", 0)}%
- Commitment Specificity: {drift_dna.get("commitment_specificity_pct", 0)}%
- Omission Pattern: {drift_dna.get("omission_pattern_pct", 0)}%
- Tone Variation: {drift_dna.get("tone_variation_pct", 0)}%

Analysis Summary:
- Total claims extracted: {total_claims}
- Contradictions found: {len(contradictions)}
- High severity contradictions: {sum(1 for c in contradictions if c.get("severity") == "high")}
- Regions analyzed: {", ".join(regional_pages.keys())}
- Pre-loaded data: {result.get("is_preloaded", False)}
"""

    # Add key contradictions to document
    if contradictions:
        document += "\nKey Contradictions Identified:\n"
        for i, c in enumerate(contradictions[:3], 1):
            document += (
                f"{i}. [{c.get('severity', '?').upper()}] "
                f"{c.get('claim', '')[:100]}\n"
                f"   Evidence: {c.get('evidence_text', '')[:100]}\n"
            )

    # Store in company-specific dataset
    dataset_name = f"company_{company_id}"
    await cognee.add(document, dataset_name=dataset_name)
    await cognee.cognify()

    print(f"✅ Cognee: stored analysis {analysis_id} for {company} in dataset '{dataset_name}'")
    return analysis_id
