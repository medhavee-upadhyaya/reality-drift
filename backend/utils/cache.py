"""
cache.py — In-memory analysis cache (Layer 3 of caching strategy).

Prevents duplicate Claude API calls for the same URL within 1 hour.
Keyed by URL hash. Simple dict — replace with Redis on production if needed.
"""

import time
import hashlib
from typing import Optional

_cache: dict = {}
CACHE_TTL = int(__import__("os").getenv("CACHE_TTL_SECONDS", "3600"))


def _key(url: str) -> str:
    return hashlib.sha256(url.lower().strip().encode()).hexdigest()


def get_cached_analysis(url: str) -> Optional[dict]:
    """Return cached analysis result if still within TTL."""
    entry = _cache.get(_key(url))
    if not entry:
        return None
    if time.time() - entry["ts"] > CACHE_TTL:
        del _cache[_key(url)]
        return None
    return entry["data"]


def set_cached_analysis(url: str, data: dict) -> None:
    """Cache an analysis result."""
    _cache[_key(url)] = {"data": data, "ts": time.time()}


def invalidate_cache(url: str) -> None:
    """Remove a specific URL from cache."""
    _cache.pop(_key(url), None)


def cache_stats() -> dict:
    """Return cache statistics for health endpoint."""
    now = time.time()
    valid = sum(1 for v in _cache.values() if now - v["ts"] <= CACHE_TTL)
    return {"total_entries": len(_cache), "valid_entries": valid, "ttl_seconds": CACHE_TTL}
