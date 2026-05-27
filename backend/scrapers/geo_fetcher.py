"""
geo_fetcher.py — Bright Data Residential Proxies + Web Unlocker

Fetches the same company URL simultaneously from 5 geographic regions:
US, Germany, India, Brazil, Singapore.

Products used:
  - Bright Data Residential Proxies (country-specific exit IPs)
  - Bright Data Web Unlocker (for JS-heavy / bot-protected pages)
"""

import os
import asyncio
import hashlib
import httpx
from typing import Optional

CUSTOMER_ID = os.getenv("BRIGHT_DATA_CUSTOMER_ID", "")
RESIDENTIAL_PASSWORD = os.getenv("BRIGHT_DATA_RESIDENTIAL_PASSWORD", "")
API_TOKEN = os.getenv("BRIGHT_DATA_API_TOKEN", "")

# Zone name: residential_proxy1 (confirmed from account dashboard)
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


async def fetch_region_via_proxy(
    url: str, region: str, client: httpx.AsyncClient
) -> Optional[dict]:
    """Fetch URL through Bright Data residential proxy for a specific country."""
    proxy_url = REGION_PROXIES.get(region)
    if not proxy_url or not CUSTOMER_ID or not RESIDENTIAL_PASSWORD:
        print(f"⚠️  No proxy config for {region}, attempting direct fetch")
        return await _fetch_direct(url, region, client)

    try:
        response = await client.get(
            url,
            proxy=proxy_url,
            headers=HEADERS,
            timeout=30.0,
            follow_redirects=True,
        )
        html = response.text
        return {
            "region": region,
            "url": str(response.url),
            "html": html,
            "status_code": response.status_code,
            "content_length": len(html),
            "raw_text_hash": hashlib.sha256(html.encode()).hexdigest()[:16],
            "source": "residential_proxy",
        }
    except Exception as e:
        print(f"⚠️  Proxy fetch failed for {region}: {e}")
        return await _fetch_via_web_unlocker(url, region)


async def _fetch_direct(url: str, region: str, client: httpx.AsyncClient) -> Optional[dict]:
    """Fallback: direct fetch without proxy."""
    try:
        response = await client.get(url, headers=HEADERS, timeout=20.0, follow_redirects=True)
        html = response.text
        return {
            "region": region,
            "url": str(response.url),
            "html": html,
            "status_code": response.status_code,
            "content_length": len(html),
            "raw_text_hash": hashlib.sha256(html.encode()).hexdigest()[:16],
            "source": "direct",
        }
    except Exception as e:
        print(f"⚠️  Direct fetch failed for {region}: {e}")
        return None


async def _fetch_via_web_unlocker(url: str, region: str) -> Optional[dict]:
    """
    Bright Data Web Unlocker — used when residential proxy fails.
    Uses the API endpoint approach (Bearer token auth) for zone web_unlocker1.
    Handles JS-rendering, CAPTCHAs, and aggressive bot detection.
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
        print(f"⚠️  Web Unlocker failed for {region}: {e}")
        return None


async def fetch_all_regions(url: str) -> dict[str, dict]:
    """
    Main entry point: fetch URL from all 5 regions concurrently.
    Returns dict keyed by region code ("US", "DE", "IN", "BR", "SG").
    Failed regions are omitted from result (not fatal).
    """
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        tasks = [
            fetch_region_via_proxy(url, region, client)
            for region in REGION_PROXIES
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    output = {}
    for result in results:
        if isinstance(result, dict) and result.get("region"):
            region = result["region"]
            output[region] = result
            print(f"✅ {region}: {result.get('content_length', 0)} chars ({result.get('source', 'unknown')})")
        elif isinstance(result, Exception):
            print(f"⚠️  Region fetch exception: {result}")

    return output
