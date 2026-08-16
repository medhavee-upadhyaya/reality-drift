"""Semantic comparison of regional narratives.

Claude evaluates meaning and framing when available. A deterministic token-set
comparison keeps live analysis measurable when the model is unavailable.
"""

from __future__ import annotations

from itertools import combinations
import re

from ai.claude_client import call_claude


REGIONS = ("US", "DE", "IN", "BR", "SG")


def _tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2
    }


def lexical_similarity(regional_text: dict[str, str]) -> dict[str, float]:
    """Return reproducible pairwise Jaccard similarity as an offline fallback."""
    pairs: dict[str, float] = {}
    available = [region for region in REGIONS if regional_text.get(region)]

    for left, right in combinations(available, 2):
        left_tokens = _tokens(regional_text[left])
        right_tokens = _tokens(regional_text[right])
        union = left_tokens | right_tokens
        score = len(left_tokens & right_tokens) / len(union) if union else 1.0
        pairs[f"{left}_{right}"] = round(score, 4)

    values = list(pairs.values())
    mean_similarity = sum(values) / len(values) if values else 1.0
    minimum = min(values) if values else 1.0
    return {
        **pairs,
        "mean_similarity": round(mean_similarity, 4),
        "max_variation": round(1.0 - minimum, 4),
        "method": "lexical_fallback",
        "pairs_compared": len(values),
    }


def _normalize_model_result(result: object, regional_text: dict[str, str]) -> dict[str, float]:
    if not isinstance(result, dict):
        raise ValueError("Similarity response must be an object")

    normalized: dict[str, float] = {}
    for key, value in result.items():
        if key in {"mean_similarity", "max_variation"} or "_" in key:
            try:
                normalized[key] = max(0.0, min(1.0, float(value)))
            except (TypeError, ValueError):
                continue

    pair_values = [
        value
        for key, value in normalized.items()
        if key not in {"mean_similarity", "max_variation"}
    ]
    if not pair_values:
        raise ValueError("Similarity response contains no regional pairs")

    normalized["mean_similarity"] = round(sum(pair_values) / len(pair_values), 4)
    normalized["max_variation"] = round(1.0 - min(pair_values), 4)
    normalized["method"] = "llm_semantic"
    normalized["pairs_compared"] = len(pair_values)
    return normalized


async def compare_regional_narratives(
    regional_text: dict[str, str], company_name: str
) -> dict[str, float]:
    """Measure pairwise narrative similarity using meaning, claims, and framing."""
    if len([text for text in regional_text.values() if text.strip()]) < 2:
        return lexical_similarity(regional_text)

    try:
        result, _ = await call_claude(
            task="geographic_similarity",
            regional_text=regional_text,
            company_name=company_name,
        )
        return _normalize_model_result(result, regional_text)
    except Exception as exc:
        print(f"⚠️  Semantic similarity failed; using lexical fallback: {exc}")
        return lexical_similarity(regional_text)
