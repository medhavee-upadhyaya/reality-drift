"""
glassdoor.py — Bright Data Scraping Browser for Glassdoor employee reviews

Glassdoor is JavaScript-heavy and aggressively blocks scrapers.
Bright Data Scraping Browser provides a full cloud Playwright browser
with built-in proxy rotation and bot detection bypass.

Product used: Bright Data Scraping Browser (CDP over WebSocket)
"""

import os
import asyncio
from typing import Optional
from data.schemas import GlassdoorSignals

CUSTOMER_ID = os.getenv("BRIGHT_DATA_CUSTOMER_ID", "")
SCRAPING_BROWSER_PASSWORD = os.getenv("BRIGHT_DATA_SCRAPING_BROWSER_PASSWORD", "")

BRIGHT_DATA_CDP_URL = (
    f"wss://brd-customer-{CUSTOMER_ID}-zone-scraping_browser1:"
    f"{SCRAPING_BROWSER_PASSWORD}@brd.superproxy.io:9222"
)

ESG_KEYWORDS = [
    "sustainability", "environment", "green", "carbon", "emissions",
    "diversity", "esg", "climate", "renewable", "ethical", "fair",
    "supply chain", "labor", "worker", "wages",
]

NEGATIVE_MARKERS = [
    "misleading", "fake", "dishonest", "lie", "greenwash", "publicity stunt",
    "marketing only", "not real", "not true", "just for show", "hypocrisy",
    "ignore", "doesn't care", "performative", "lip service",
]


async def scrape_glassdoor_reviews(company_name: str) -> Optional[GlassdoorSignals]:
    """
    Scrape Glassdoor reviews mentioning ESG/sustainability topics.
    Uses Bright Data Scraping Browser (cloud Playwright) to bypass Glassdoor's
    aggressive bot detection.

    Returns GlassdoorSignals or None if scraping fails.
    """
    if not CUSTOMER_ID or not SCRAPING_BROWSER_PASSWORD:
        print("⚠️  Scraping Browser credentials not set — Glassdoor skipped")
        return _fallback_glassdoor(company_name)

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("⚠️  playwright not installed — Glassdoor skipped")
        return _fallback_glassdoor(company_name)

    cdp_url = f"wss://brd-customer-{CUSTOMER_ID}-zone-scraping_browser1:{SCRAPING_BROWSER_PASSWORD}@brd.superproxy.io:9222"

    try:
        async with async_playwright() as p:
            # Connect to Bright Data Scraping Browser via CDP
            browser = await p.chromium.connect_over_cdp(cdp_url)
            page = await browser.new_page()

            # Search for the company on Glassdoor
            search_url = f"https://www.glassdoor.com/Search/results.htm?keyword={company_name.replace(' ', '+')}"
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)

            # Try to navigate to the company's reviews page
            try:
                await page.wait_for_selector('[data-test="cell-employer-name"]', timeout=8000)
                await page.click('[data-test="cell-employer-name"]')
                await page.wait_for_selector('[data-test="review-text"], .review-text, .reviewText', timeout=15000)
            except Exception:
                # Fallback: try direct company search
                try:
                    await page.goto(
                        f"https://www.glassdoor.com/Search/results.htm?keyword={company_name.replace(' ', '+')}+reviews",
                        wait_until="domcontentloaded",
                        timeout=20000,
                    )
                except Exception:
                    pass

            # Extract review text
            reviews = await page.eval_on_selector_all(
                '[data-test="review-text"], .review-text, .reviewText, [class*="reviewText"]',
                "els => els.slice(0, 25).map(el => el.innerText.trim()).filter(t => t.length > 20)"
            )

            # Extract rating
            rating = None
            try:
                rating = await page.eval_on_selector(
                    '[data-test="rating-info"] .ratingNum, [class*="ratingNum"], [class*="rating"]',
                    "el => parseFloat(el.innerText)"
                )
            except Exception:
                pass

            await browser.close()

        return _process_reviews(reviews, rating)

    except Exception as e:
        print(f"⚠️  Glassdoor scraping failed: {e}")
        return _fallback_glassdoor(company_name)


def _process_reviews(reviews: list, rating: Optional[float]) -> GlassdoorSignals:
    """Process scraped reviews into GlassdoorSignals."""
    esg_reviews = [
        r for r in reviews
        if any(kw in r.lower() for kw in ESG_KEYWORDS)
    ]
    negative_count = sum(
        1 for r in esg_reviews
        if any(m in r.lower() for m in NEGATIVE_MARKERS)
    )
    negative_ratio = negative_count / max(len(esg_reviews), 1)

    return GlassdoorSignals(
        avg_rating=rating,
        total_reviews_sampled=len(reviews),
        esg_mention_count=len(esg_reviews),
        negative_esg_ratio=round(negative_ratio, 2),
        sample_reviews=esg_reviews[:5],
    )


def _fallback_glassdoor(company_name: str) -> GlassdoorSignals:
    """Return empty signals when scraping is unavailable."""
    print(f"ℹ️  Using empty Glassdoor fallback for {company_name}")
    return GlassdoorSignals(
        avg_rating=None,
        total_reviews_sampled=0,
        esg_mention_count=0,
        negative_esg_ratio=0.0,
        sample_reviews=[],
    )
