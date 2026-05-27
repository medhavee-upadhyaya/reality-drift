# Bright Data Integration — Reality Drift

## Overview

All 5 Bright Data products are used and **must appear in the Data Sources panel** on the dashboard. This is required for the $20K Bright Data AI Startup Program prize.

**Promo code:** `unlocked` (applied to account, gives $250 credits)

---

## Product Map

| # | Product | File | What It Does | Why It's Essential |
|---|---------|------|--------------|-------------------|
| 1 | Residential Proxies | `geo_fetcher.py` | Fetch company URL from 5 country-specific IPs simultaneously | Without this, every request looks US-origin — geographic drift detection is impossible |
| 2 | Web Unlocker | `geo_fetcher.py` | JS-heavy pages + bot detection bypass | SEC EDGAR aggressively blocks automated access; needed for fetching actual filing pages |
| 3 | SERP API | `sec_edgar.py`, `news_violations.py` | Structured Google search results | Finds SEC 20-F filing URLs and ESG violation news without parsing raw Google HTML |
| 4 | Scraping Browser | `glassdoor.py` | Playwright via CDP to Bright Data cloud browser | Glassdoor requires JavaScript rendering and blocks headless browsers; cloud Playwright bypasses |
| 5 | Web Scraper API | `web_scraper.py` | Structured dataset trigger + poll | Dataset-based structured extraction, demonstrates the full Bright Data stack |

---

## Product 1 & 2: `backend/scrapers/geo_fetcher.py`

**Function:** `fetch_all_regions(url: str) → dict[region, {html, url, status, ...}]`

**How Residential Proxies work:**
```python
REGION_PROXIES = {
    "US": f"http://brd-customer-{CUSTOMER_ID}-zone-residential-country-us:{PASSWORD}@brd.superproxy.io:22225",
    "DE": f"http://brd-customer-{CUSTOMER_ID}-zone-residential-country-de:{PASSWORD}@brd.superproxy.io:22225",
    "IN": f"http://brd-customer-{CUSTOMER_ID}-zone-residential-country-in:{PASSWORD}@brd.superproxy.io:22225",
    "BR": f"http://brd-customer-{CUSTOMER_ID}-zone-residential-country-br:{PASSWORD}@brd.superproxy.io:22225",
    "SG": f"http://brd-customer-{CUSTOMER_ID}-zone-residential-country-sg:{PASSWORD}@brd.superproxy.io:22225",
}
# All 5 fetched concurrently with asyncio.gather()
```

**Web Unlocker fallback:**
```python
UNLOCKER_PROXY = f"http://brd-customer-{CUSTOMER_ID}-zone-web_unlocker1:{PASSWORD}@brd.superproxy.io:22225"
# Used when residential proxy returns 403/429, or for SEC EDGAR
# Add header: "x-brd-render": "true" for JS rendering
```

---

## Product 3: `backend/scrapers/sec_edgar.py`

**Function:** `fetch_sec_filing(company_name: str) → list[SERPResult]`

**SERP API call:**
```python
response = await client.post(
    "https://api.brightdata.com/serp/req",
    headers={"Authorization": f"Bearer {API_TOKEN}"},
    json={
        "query": f"{company_name} SEC 20-F annual report sustainability emissions",
        "search_engine": "google",
        "country": "US",
        "num_results": 5,
    }
)
```

**Follow-up:** `fetch_sec_filing_text(serp_results)` fetches the actual SEC page using Web Unlocker proxy.

---

## Product 3 (also): `backend/scrapers/news_violations.py`

**Function:** `fetch_news_violations(company_name: str) → list[NewsItem]`

Same SERP API, different query:
```python
query = f"{company_name} ESG greenwashing lawsuit fine violation 2023 2024"
```

Returns list of `{title, link, snippet, source, date}` dicts.

---

## Product 4: `backend/scrapers/glassdoor.py`

**Function:** `scrape_glassdoor_reviews(company_name: str) → GlassdoorSignals`

**Scraping Browser via CDP:**
```python
CDP_URL = f"wss://brd-customer-{CUSTOMER_ID}-zone-scraping_browser:{PASSWORD}@brd.superproxy.io:9222"

async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp(CDP_URL)
    page = await browser.new_page()
    await page.goto(glassdoor_url)
    # Extract review text, ratings
```

**Fallback:** If credentials missing, returns empty `GlassdoorSignals(esg_mention_count=0)`.

---

## Product 5: `backend/scrapers/web_scraper.py`

**Function:** `trigger_dataset_scrape(dataset_id: str, inputs: list) → list[dict]`

**Pattern: trigger → poll:**
```python
# Step 1: Trigger
response = await client.post(
    "https://api.brightdata.com/datasets/v3/trigger",
    headers={"Authorization": f"Bearer {API_TOKEN}"},
    json={"dataset_id": dataset_id, "inputs": inputs}
)
snapshot_id = response.json()["snapshot_id"]

# Step 2: Poll until ready
while True:
    result = await client.get(f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}")
    if result.status_code == 200:
        return result.json()
    await asyncio.sleep(5)
```

---

## Environment Variables Required

```bash
BRIGHT_DATA_CUSTOMER_ID=hl_xxxxxxxxxxxxx
BRIGHT_DATA_RESIDENTIAL_PASSWORD=xxxxxxxxxxxxxxxx
BRIGHT_DATA_WEB_UNLOCKER_PASSWORD=xxxxxxxxxxxxxxxx    # Often same as residential
BRIGHT_DATA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # For SERP API + Web Scraper API
BRIGHT_DATA_SCRAPING_BROWSER_PASSWORD=xxxxxxxxxxxxxxxx
```

Find these at: https://brightdata.com/cp/zones (customer ID is in the zone credentials page)

---

## Dashboard Display

The `BrightDataUsage` object is populated in `analyze.py` and rendered in the **Data Sources** panel (left column of analysis page):

```json
{
  "residential_proxies": {"regions_fetched": 5, "product": "Residential Proxies"},
  "web_unlocker": {"pages_unlocked": 1, "product": "Web Unlocker"},
  "serp_api": {"queries_run": 2, "product": "SERP API"},
  "scraping_browser": {"sessions": 1, "product": "Scraping Browser"},
  "web_scraper_api": {"datasets": 1, "product": "Web Scraper API"}
}
```

In the frontend, `FilingDiscrepancyCard` and the analyze page both surface this. **All 5 product names must be visible to judges.**

---

## Demo Script Note (for judges)

> "Every layer of this is powered by Bright Data. Residential proxies for geographic fetching — without this, every request looks the same. Web Unlocker for SEC EDGAR, which aggressively blocks automated access. Scraping Browser for Glassdoor. SERP API for violations discovery. Web Scraper API for structured dataset collection. We needed all five."
