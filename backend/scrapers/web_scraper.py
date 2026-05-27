"""
web_scraper.py — Bright Data Web Scraper API

Uses Bright Data's pre-built dataset scrapers for structured data collection.
Provides structured JSON from 660+ site-specific scrapers.

Product used: Bright Data Web Scraper API (Dataset API v3)
"""

import os
import asyncio
import httpx
from typing import Optional

BRIGHT_DATA_API_TOKEN = os.getenv("BRIGHT_DATA_API_TOKEN", "")
DATASET_API_BASE = "https://api.brightdata.com/datasets/v3"


async def trigger_dataset_scrape(
    dataset_id: str,
    inputs: list[dict],
    timeout_seconds: int = 90,
) -> list[dict]:
    """
    Trigger a Bright Data dataset collection job and poll for results.
    Handles the async trigger → poll → download pattern.
    """
    if not BRIGHT_DATA_API_TOKEN:
        print("⚠️  BRIGHT_DATA_API_TOKEN not set — dataset scrape skipped")
        return []

    headers = {
        "Authorization": f"Bearer {BRIGHT_DATA_API_TOKEN}",
        "Content-Type": "application/json",
    }

    # Trigger the job
    snapshot_id = None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DATASET_API_BASE}/trigger",
                headers=headers,
                json={
                    "dataset_id": dataset_id,
                    "include_errors": False,
                    "format": "json",
                    "input": inputs,
                },
                timeout=30.0,
            )
        if response.status_code not in (200, 201):
            print(f"⚠️  Dataset trigger failed: {response.status_code} {response.text[:200]}")
            return []

        data = response.json()
        snapshot_id = data.get("snapshot_id")
        print(f"✅ Dataset job triggered: {snapshot_id}")
    except Exception as e:
        print(f"⚠️  Dataset trigger error: {e}")
        return []

    if not snapshot_id:
        return []

    # Poll for completion
    elapsed = 0
    poll_interval = 5
    while elapsed < timeout_seconds:
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{DATASET_API_BASE}/snapshot/{snapshot_id}",
                    headers=headers,
                    params={"format": "json"},
                    timeout=20.0,
                )
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list) and results:
                    print(f"✅ Dataset ready: {len(results)} records")
                    return results
            elif response.status_code == 202:
                print(f"⏳ Dataset still processing ({elapsed}s)...")
                continue
        except Exception as e:
            print(f"⚠️  Dataset poll error: {e}")

    print(f"⚠️  Dataset job timed out after {timeout_seconds}s")
    return []


async def scrape_company_filings(company_name: str) -> list[dict]:
    """
    Use Bright Data Web Scraper API to collect structured SEC filing data.
    Returns list of structured filing records.
    """
    # SEC EDGAR dataset (Bright Data pre-built scraper)
    # Dataset ID varies — using generic web search dataset as fallback
    results = await trigger_dataset_scrape(
        dataset_id="gd_lic3o4v42qoqv74sk7",  # Generic web scraper dataset
        inputs=[
            {"url": f"https://efts.sec.gov/LATEST/search-index?q=%22{company_name.replace(' ', '+')}%22&dateRange=custom&startdt=2022-01-01&enddt=2025-01-01&forms=20-F,10-K"}
        ],
        timeout_seconds=60,
    )
    return results


async def scrape_company_news_structured(company_name: str) -> list[dict]:
    """
    Use Bright Data Web Scraper API for structured news collection.
    Complements SERP API with additional structured data.
    """
    results = await trigger_dataset_scrape(
        dataset_id="gd_lz11l67o2cb3r0lzl5",  # News dataset
        inputs=[{"keyword": f"{company_name} ESG sustainability violations 2023 2024"}],
        timeout_seconds=60,
    )
    return results
