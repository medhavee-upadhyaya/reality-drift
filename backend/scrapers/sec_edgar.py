"""
sec_edgar.py — Bright Data SERP API + Web Unlocker for SEC EDGAR

SEC EDGAR aggressively blocks automated access.
Bright Data Web Unlocker makes this integration essential (not just nice-to-have).

Products used:
  - Bright Data SERP API (structured Google search for SEC filings)
  - Bright Data Web Unlocker (fetch actual filing pages from sec.gov)
"""

import os
import httpx
from typing import Optional

BRIGHT_DATA_API_TOKEN = os.getenv("BRIGHT_DATA_API_TOKEN", "")
CUSTOMER_ID = os.getenv("BRIGHT_DATA_CUSTOMER_ID", "")
WEB_UNLOCKER_PASSWORD = os.getenv("BRIGHT_DATA_WEB_UNLOCKER_PASSWORD", "")

SERP_API_URL = "https://api.brightdata.com/serp/req"


async def fetch_sec_filing(company_name: str) -> list[dict]:
    """
    Use Bright Data SERP API to find SEC filings for a company.
    Returns list of search result dicts with URLs pointing to SEC EDGAR.
    """
    if not BRIGHT_DATA_API_TOKEN:
        print("⚠️  BRIGHT_DATA_API_TOKEN not set — SEC SERP search skipped")
        return []

    queries = [
        f"{company_name} 20-F SEC EDGAR annual report sustainability emissions",
        f"{company_name} 10-K SEC EDGAR sustainability climate risk disclosure",
    ]

    all_results = []
    async with httpx.AsyncClient() as client:
        for query in queries:
            try:
                response = await client.post(
                    SERP_API_URL,
                    headers={
                        "Authorization": f"Bearer {BRIGHT_DATA_API_TOKEN}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "country": "us",
                        "query": query,
                        "results_count": 5,
                        "parse": True,
                    },
                    timeout=30.0,
                )
                if response.status_code == 200:
                    data = response.json()
                    organic = data.get("organic", [])
                    # Filter to SEC-related results
                    sec_results = [
                        r for r in organic
                        if any(kw in r.get("url", "").lower()
                               for kw in ["sec.gov", "edgar", "10-k", "20-f", "annual-report"])
                    ]
                    all_results.extend(sec_results)
                    print(f"✅ SERP API: found {len(sec_results)} SEC results for '{query[:40]}'")
            except Exception as e:
                print(f"⚠️  SERP API error: {e}")

    return all_results


async def fetch_sec_filing_text(serp_results: list[dict]) -> str:
    """
    Fetch actual SEC filing text using Bright Data Web Unlocker.
    SEC.gov blocks most automated requests — Web Unlocker bypasses this.
    """
    if not serp_results:
        return ""

    # Try to fetch the most relevant SEC result
    sec_url = None
    for result in serp_results[:3]:
        url = result.get("url", "")
        if "sec.gov" in url and (".htm" in url or ".txt" in url):
            sec_url = url
            break

    if not sec_url:
        return ""

    if not CUSTOMER_ID or not WEB_UNLOCKER_PASSWORD:
        print("⚠️  Web Unlocker credentials not set — SEC text fetch skipped")
        return ""

    try:
        unlocker_proxy = (
            f"http://brd-customer-{CUSTOMER_ID}-zone-web_unlocker1:"
            f"{WEB_UNLOCKER_PASSWORD}@brd.superproxy.io:22225"
        )
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.get(
                sec_url,
                proxy=unlocker_proxy,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; research/1.0)",
                    "x-brd-render": "false",  # SEC filings are plain HTML/text, no JS needed
                },
                timeout=45.0,
                follow_redirects=True,
            )
        text = response.text
        print(f"✅ Web Unlocker: fetched SEC filing ({len(text)} chars)")
        return text[:50000]  # Cap at 50k chars for Claude context
    except Exception as e:
        print(f"⚠️  Web Unlocker SEC fetch failed: {e}")
        return ""
