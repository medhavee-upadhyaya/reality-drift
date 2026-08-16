"""Attach reproducible provenance metadata to model-generated findings."""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
from urllib.parse import urlparse


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def is_public_url(value: str | None) -> bool:
    if not value:
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def enrich_contradiction(
    finding: dict,
    *,
    sec_url: str | None = None,
    news_items: list[dict] | None = None,
    retrieved_at: str | None = None,
) -> dict:
    """Validate a citation and compute a stable hash for its quoted evidence."""
    enriched = dict(finding)
    evidence_text = str(enriched.get("evidence_text", "")).strip()
    source_name = str(enriched.get("evidence_source", "")).lower()
    evidence_url = enriched.get("evidence_url")
    evidence_date = enriched.get("evidence_date")

    if not is_public_url(evidence_url):
        evidence_url = None

    if evidence_url is None and "sec" in source_name and is_public_url(sec_url):
        evidence_url = sec_url

    if evidence_url is None:
        for item in news_items or []:
            title = str(item.get("title", item.get("headline", ""))).lower()
            source = str(item.get("source", "")).lower()
            if title and title[:30] in source_name or source and source in source_name:
                candidate = item.get("url", item.get("link"))
                if is_public_url(candidate):
                    evidence_url = candidate
                    evidence_date = evidence_date or item.get("date")
                    break

    enriched["evidence_url"] = evidence_url
    enriched["evidence_date"] = evidence_date
    enriched["retrieved_at"] = retrieved_at or datetime.now(timezone.utc).isoformat()
    enriched["evidence_hash"] = content_hash(evidence_text) if evidence_text else None
    return enriched
