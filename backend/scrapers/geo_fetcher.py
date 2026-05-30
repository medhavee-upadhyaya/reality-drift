"""
geo_fetcher.py — Bright Data Residential Proxies + Web Unlocker

Two fetch strategies:
  1. OUTSIDER MODE (default): Fetch the SAME URL through 5 geo-proxies.
     Detects server-side geo-targeting (different HTML served to different IPs).
     Also auto-detects common regional TLD variants (nike.de, nike.com.br, etc.)
     and merges whichever has unique content.

  2. COMPLIANCE MODE: Caller provides explicit per-region URLs.
     e.g. {"US": "nike.com", "DE": "nike.de", "IN": "nike.co.in"}
     Each is fetched directly (still through proxy for authenticity).

Products used:
  - Bright Data Residential Proxies (zone: residential_proxy1)
  - Bright Data Web Unlocker (fallback, zone: web_unlocker1)
"""

import os
import asyncio
import hashlib
import httpx
from typing import Optional
from urllib.parse import urlparse

CUSTOMER_ID          = os.getenv("BRIGHT_DATA_CUSTOMER_ID", "")
RESIDENTIAL_PASSWORD = os.getenv("BRIGHT_DATA_RESIDENTIAL_PASSWORD", "")
API_TOKEN            = os.getenv("BRIGHT_DATA_API_TOKEN", "")

# Region → proxy URL (country-specific exit IPs)
REGION_PROXIES = {
    "US": f"http://brd-customer-{CUSTOMER_ID}-zone-residential_proxy1-country-us:{RESIDENTIAL_PASSWORD}@brd.superproxy.io:22225",
    "DE": f"http://brd-customer-{CUSTOMER_ID}-zone-residential_proxy1-country-de:{RESIDENTIAL_PASSWORD}@brd.superproxy.io:22225",
    "IN": f"http://brd-customer-{CUSTOMER_ID}-zone-residential_proxy1-country-in:{RESIDENTIAL_PASSWORD}@brd.superproxy.io:22225",
    "BR": f"http://brd-customer-{CUSTOMER_ID}-zone-residential_proxy1-country-br:{RESIDENTIAL_PASSWORD}@brd.superproxy.io:22225",
    "SG": f"http://brd-customer-{CUSTOMER_ID}-zone-residential_proxy1-country-sg:{RESIDENTIAL_PASSWORD}@brd.superproxy.io:22225",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Regional TLD patterns to try when auto-detecting
# sld = second-level domain (e.g. "nike" from "nike.com")
REGIONAL_TLD_PATTERNS = {
    "DE": ["{sld}.de", "de.{sld}.com", "{sld}.com/de"],
    "IN": ["{sld}.co.in", "{sld}.in", "in.{sld}.com", "{sld}.com/in"],
    "BR": ["{sld}.com.br", "br.{sld}.com", "{sld}.com.br/sustentabilidade"],
    "SG": ["{sld}.com.sg", "sg.{sld}.com"],
}


def _extract_sld(url: str) -> str:
    """Extract second-level domain from URL. 'https://www.nike.com/...' → 'nike'"""
    parsed = urlparse(url if url.startswith("http") else f"https://{url}")
    hostname = parsed.netloc.lower()
    parts = [p for p in hostname.split(".") if p not in ("www", "")]
    return parts[0] if parts else ""


def _build_auto_regional_urls(base_url: str) -> dict[str, str]:
    """
    Auto-generate candidate regional URLs from a base URL.
    Returns the most likely regional URL per region.
    e.g. nike.com → {"US": "https://nike.com", "DE": "https://nike.de", ...}
    """
    sld = _extract_sld(base_url)
    if not sld:
        return {}

    parsed = urlparse(base_url if base_url.startswith("http") else f"https://{base_url}")
    path = parsed.path.rstrip("/")

    candidates = {"US": base_url}  # US always uses the original URL

    for region, patterns in REGIONAL_TLD_PATTERNS.items():
        # Use the first pattern as primary candidate
        primary = patterns[0].format(sld=sld)
        # Preserve any path (e.g. /sustainability)
        candidates[region] = f"https://{primary}{path}" if path else f"https://{primary}"

    return candidates


async def _fetch_url(
    url: str,
    region: str,
    client: httpx.AsyncClient,
    use_proxy: bool = True,
) -> Optional[dict]:
    """Fetch a URL, optionally through the regional proxy."""
    proxy_url = REGION_PROXIES.get(region) if use_proxy else None
    has_proxy_creds = bool(CUSTOMER_ID and RESIDENTIAL_PASSWORD)

    try:
        kwargs: dict = {
            "headers": HEADERS,
            "timeout": 30.0,
            "follow_redirects": True,
        }
        if proxy_url and has_proxy_creds:
            kwargs["proxy"] = proxy_url

        response = await client.get(url, **kwargs)
        html = response.text
        return {
            "region": region,
            "url": str(response.url),
            "html": html,
            "status_code": response.status_code,
            "content_length": len(html),
            "raw_text_hash": hashlib.sha256(html.encode()).hexdigest()[:16],
            "source": "residential_proxy" if (proxy_url and has_proxy_creds) else "direct",
        }
    except Exception as e:
        print(f"⚠️  Fetch failed [{region}] {url}: {e}")
        return None


async def _fetch_via_web_unlocker(url: str, region: str) -> Optional[dict]:
    """
    Bright Data Web Unlocker — used when proxy fetch fails.
    Handles JS-rendering, CAPTCHAs, bot-protection.
    """
    if not API_TOKEN:
        return None
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.brightdata.com/request",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {API_TOKEN}",
                },
                json={
                    "zone": "web_unlocker1",
                    "url": url,
                    "format": "raw",
                    "country": region.lower(),
                },
            )
        html = response.text
        return {
            "region": region,
            "url": url,
            "html": html,
            "status_code": response.status_code,
            "content_length": len(html),
            "raw_text_hash": hashlib.sha256(html.encode()).hexdigest()[:16],
            "source": "web_unlocker",
        }
    except Exception as e:
        print(f"⚠️  Web Unlocker failed [{region}]: {e}")
        return None


async def fetch_all_regions(
    url: str,
    regional_urls: dict[str, str] | None = None,
) -> dict[str, dict]:
    """
    Main entry point: fetch content from all 5 regions.

    Args:
        url: Primary URL to analyze
        regional_urls: Optional explicit per-region URLs
                       e.g. {"DE": "https://nike.de", "IN": "https://nike.co.in"}
                       Any region not provided falls back to proxy-fetching `url`.

    Strategy:
        - If regional_urls provided → fetch each specified URL directly (compliance mode)
        - Otherwise → proxy-fetch base URL AND try auto-detected regional TLDs,
          keep whichever has unique content (outsider mode)
    """

    # ── Build the URL map for each region ────────────────────────────────────
    if regional_urls:
        # Compliance mode: use caller-provided URLs, fill gaps with base URL
        url_map = {
            region: regional_urls.get(region, url)
            for region in REGION_PROXIES
        }
        print(f"📌 Compliance mode: using explicit regional URLs")
    else:
        # Outsider mode: proxy-fetch + auto-detect regional TLDs
        auto_urls = _build_auto_regional_urls(url)
        url_map = {
            region: auto_urls.get(region, url)
            for region in REGION_PROXIES
        }
        print(f"🌍 Outsider mode: geo-proxy + auto-regional URLs")
        for r, u in url_map.items():
            print(f"   {r}: {u}")

    # ── Fetch all regions concurrently ────────────────────────────────────────
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        tasks = [
            _fetch_url(url_map[region], region, client, use_proxy=True)
            for region in REGION_PROXIES
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    # ── Collect results, fall back to Web Unlocker on failure or thin content ───
    output: dict[str, dict] = {}

    # Minimum content threshold — JS-shell pages are typically < 5KB of useful text
    JS_SHELL_THRESHOLD = 5000

    for result in results:
        if isinstance(result, dict) and result.get("region"):
            region = result["region"]
            content_len = result.get("content_length", 0)
            output[region] = result
            if content_len < JS_SHELL_THRESHOLD:
                print(f"⚠️  {region}: only {content_len:,} chars — likely JS-shell, will retry via Web Unlocker")
            else:
                print(f"✅ {region}: {content_len:,} chars from {result.get('url','?')[:60]} ({result.get('source','?')})")
        elif isinstance(result, Exception):
            print(f"⚠️  Region exception: {result}")

    # Fall back to Web Unlocker for:
    #   a) regions that completely failed
    #   b) regions that returned thin JS-shell pages (< 5KB)
    for region in REGION_PROXIES:
        current = output.get(region)
        needs_fallback = (
            current is None or
            current.get("content_length", 0) < JS_SHELL_THRESHOLD
        )
        if needs_fallback:
            reason = "failed" if current is None else f"thin content ({current.get('content_length',0):,} chars)"
            print(f"⚠️  {region} {reason} — retrying via Web Unlocker")
            fallback = await _fetch_via_web_unlocker(url_map[region], region)
            if fallback and fallback.get("content_length", 0) > (current or {}).get("content_length", 0):
                output[region] = fallback
                print(f"✅ {region} (web_unlocker): {fallback.get('content_length', 0):,} chars")

    return output
