"""
news_violations.py — Bright Data SERP API for violations news

Searches for ESG violations, greenwashing lawsuits, regulatory fines,
and labor violations across global news sources.

Product used: Bright Data SERP API (news search mode)
"""

import os
import httpx

BRIGHT_DATA_API_TOKEN = os.getenv("BRIGHT_DATA_API_TOKEN", "")
SERP_API_URL = "https://api.brightdata.com/serp/req"


async def fetch_news_violations(company_name: str) -> list[dict]:
    """
    Use Bright Data SERP API to search for violations news.
    Returns structured list of news articles about ESG violations.
    """
    if not BRIGHT_DATA_API_TOKEN:
        print("⚠️  BRIGHT_DATA_API_TOKEN not set — news search skipped")
        return []

    query = (
        f"{company_name} ESG violation greenwashing lawsuit fine "
        "environmental labor sustainability misleading"
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SERP_API_URL,
                headers={
                    "Authorization": f"Bearer {BRIGHT_DATA_API_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "country": "us",
                    "query": query,
                    "results_count": 10,
                    "parse": True,
                    "search_type": "news",   # News-specific results
                },
                timeout=30.0,
            )

        if response.status_code != 200:
            print(f"⚠️  SERP news API returned {response.status_code}")
            return []

        data = response.json()
        news_items = data.get("news_results", data.get("organic", []))

        # Normalize result format
        normalized = []
        for item in news_items[:10]:
            normalized.append({
                "title": item.get("title", item.get("headline", "")),
                "source": item.get("source", {}).get("name", "") if isinstance(item.get("source"), dict) else str(item.get("source", "")),
                "date": item.get("date", item.get("published_date", "2024-01-01")),
                "url": item.get("link", item.get("url", "")),
                "snippet": item.get("snippet", item.get("description", "")),
                "region": "US",
            })

        print(f"✅ SERP news: found {len(normalized)} violation articles for {company_name}")
        return normalized

    except Exception as e:
        print(f"⚠️  News SERP error: {e}")
        return []
