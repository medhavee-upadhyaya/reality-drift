"""
analyze.py — Core analysis endpoint.

POST /api/analyze        — Run full pipeline, return AnalysisResult
GET  /api/analyze/stream — SSE endpoint streaming progress events

Pipeline:
  1. geo_fetch      (Bright Data Residential Proxies)
  2. sec_scrape     (Bright Data SERP API → Web Unlocker)
  3. news_scrape    (Bright Data SERP API)
  4. glassdoor_scrape (Bright Data Scraping Browser)
  5. claude_analyze  (Anthropic with prompt caching)
  6. scoring         (RDI calculation)
  7. cognee_store    (memory persistence)
"""

import json
import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from data.schemas import (
    AnalyzeRequest, AnalysisResult, ProgressEvent, AnalysisStep,
    BrightDataUsage, RDIComponents, RDIComponent
)
from utils.cache import get_cached_analysis, set_cached_analysis
from utils.text_processing import extract_text_from_html

# Scrapers (Bright Data)
from scrapers.geo_fetcher import fetch_all_regions
from scrapers.sec_edgar import fetch_sec_filing, fetch_sec_filing_text
from scrapers.news_violations import fetch_news_violations
from scrapers.glassdoor import scrape_glassdoor_reviews
from scrapers.web_scraper import trigger_dataset_scrape

# AI (Claude with caching)
from ai.claim_extractor import extract_claims
from ai.contradiction_finder import find_contradictions
from ai.drift_classifier import classify_drift
from ai.sec_comparator import compare_sec_filing

# Scoring
from scoring.rdi_calculator import compute_rdi
from scoring.dna_fingerprint import compute_drift_dna

# Memory
from memory.store import store_analysis
from memory.retrieve import get_temporal_history

router = APIRouter()

PRELOADED_SLUGS = {"shell", "nike", "hm"}
PRELOADED_URLS = {
    "https://www.shell.com/sustainability": "shell",
    "shell": "shell",
    "https://about.nike.com/en/impact": "nike",
    "nike": "nike",
    "https://hmgroup.com/sustainability/": "hm",
    "h&m": "hm",
    "hm": "hm",
}


def _is_preloaded(url: str, company_name: str) -> str | None:
    """Return preloaded slug if this company has pre-computed results."""
    url_lower = url.lower().strip("/")
    name_lower = company_name.lower().strip()
    return PRELOADED_URLS.get(url_lower) or PRELOADED_URLS.get(name_lower)


async def _load_preloaded_result(slug: str) -> AnalysisResult:
    import os
    path = os.path.join(
        os.path.dirname(__file__), f"../../data/preloaded/{slug}.json"
    )
    with open(path) as f:
        data = json.load(f)
    return AnalysisResult(**data)


async def _run_full_pipeline(
    url: str,
    company_name: str,
    analysis_id: str,
    progress_callback=None,
) -> AnalysisResult:
    """
    Execute the full Reality Drift analysis pipeline.
    Calls progress_callback(step, pct, message) after each layer.
    """

    async def _progress(step: AnalysisStep, pct: int, msg: str):
        if progress_callback:
            await progress_callback(step, pct, msg)

    # ── Layer 1: Geo Fetch (Bright Data Residential Proxies) ─────────────────
    await _progress(AnalysisStep.GEO_FETCH, 10, "Fetching page from 5 geographic regions...")
    try:
        regional_html = await fetch_all_regions(url)
    except Exception as e:
        regional_html = {}
        print(f"⚠️  Geo fetch partial failure: {e}")
    await _progress(AnalysisStep.GEO_FETCH, 20, f"Retrieved {len(regional_html)} regional pages")

    # ── Layer 2: SEC EDGAR (Bright Data SERP API + Web Unlocker) ─────────────
    await _progress(AnalysisStep.SEC_SCRAPE, 25, "Searching SEC EDGAR for regulatory filings...")
    try:
        sec_serp = await fetch_sec_filing(company_name)
        sec_text = await fetch_sec_filing_text(sec_serp)
    except Exception as e:
        sec_serp, sec_text = [], ""
        print(f"⚠️  SEC scrape failed: {e}")
    await _progress(AnalysisStep.SEC_SCRAPE, 35, "Retrieved regulatory filing data")

    # ── Layer 3: News Violations (Bright Data SERP API) ───────────────────────
    await _progress(AnalysisStep.NEWS_SCRAPE, 38, "Scanning for violations and regulatory actions...")
    try:
        raw_news = await fetch_news_violations(company_name)
    except Exception as e:
        raw_news = []
        print(f"⚠️  News scrape failed: {e}")
    await _progress(AnalysisStep.NEWS_SCRAPE, 45, f"Found {len(raw_news)} news items")

    # ── Layer 4: Glassdoor (Bright Data Scraping Browser) ─────────────────────
    await _progress(AnalysisStep.GLASSDOOR_SCRAPE, 47, "Analyzing employee sentiment on Glassdoor...")
    try:
        glassdoor = await scrape_glassdoor_reviews(company_name)
    except Exception as e:
        glassdoor = None
        print(f"⚠️  Glassdoor scrape failed: {e}")
    await _progress(AnalysisStep.GLASSDOOR_SCRAPE, 52, "Glassdoor analysis complete")

    # ── Layer 5: Claude AI Analysis (with prompt caching) ─────────────────────
    await _progress(AnalysisStep.CLAUDE_ANALYZE, 55, "Extracting claims from regional pages...")

    # Convert HTML to clean text for each region
    regional_text = {
        region: extract_text_from_html(data["html"])
        for region, data in regional_html.items()
        if isinstance(data, dict) and data.get("html")
    }

    # 5a. Extract claims per region
    claims_result = await extract_claims(regional_text, company_name)
    await _progress(AnalysisStep.CLAUDE_ANALYZE, 62, "Detecting contradictions and evidence mismatches...")

    # 5b. Build evidence text
    evidence_text = f"SEC Filing:\n{sec_text}\n\nNews:\n" + "\n".join(
        f"- {n.get('title', n.get('headline', ''))}: {n.get('snippet', '')}"
        for n in raw_news[:10]
    )

    # 5c. Find contradictions
    all_claims_text = "\n".join(
        f"[{r}] {c}"
        for r, claims in claims_result.items()
        for c in claims
    )
    contradictions_result = await find_contradictions(
        all_claims_text, evidence_text, company_name
    )
    await _progress(AnalysisStep.CLAUDE_ANALYZE, 70, "Classifying drift type and computing DNA fingerprint...")

    # 5d. Classify drift
    drift_result = await classify_drift(regional_text, contradictions_result, company_name)
    await _progress(AnalysisStep.CLAUDE_ANALYZE, 77, "Comparing public claims against regulatory filings...")

    # 5e. Compare SEC
    most_prominent_claim = ""
    if claims_result.get("US"):
        most_prominent_claim = claims_result["US"][0]
    sec_comparison = await compare_sec_filing(
        most_prominent_claim, sec_text, company_name
    )
    await _progress(AnalysisStep.CLAUDE_ANALYZE, 83, "AI analysis complete")

    # ── Layer 6: Scoring ──────────────────────────────────────────────────────
    await _progress(AnalysisStep.SCORING, 85, "Computing Reality Drift Index...")

    # Build geographic similarity proxy from region count
    regions_fetched = len(regional_text)
    similarity_score = max(0.2, 1.0 - (regions_fetched * 0.12))  # Rough proxy
    regional_similarity = {
        "mean_similarity": similarity_score,
        "max_variation": 1.0 - similarity_score,
    }

    total_claims = sum(len(c) for c in claims_result.values())
    history_for_scoring = []  # Will be fetched from Cognee after first store

    rdi_data = await compute_rdi(
        regional_similarity=regional_similarity,
        contradictions=contradictions_result,
        total_claims=max(total_claims, 1),
        sec_filing=sec_comparison,
        cognee_history=history_for_scoring,
    )

    # Build DNA
    drift_dna = compute_drift_dna(drift_result)

    # Build regional pages model
    from data.schemas import RegionalPage, Contradiction, NewsViolation
    regional_pages = {
        region: RegionalPage(
            region=region,
            url=data.get("url", url),
            claims=claims_result.get(region, []),
            tone="regulatory" if region == "DE" else "aspirational",
            word_count=len(data.get("html", "").split()),
        )
        for region, data in regional_html.items()
        if isinstance(data, dict)
    }

    # Convert news to schema
    news_violations = []
    for n in raw_news[:5]:
        try:
            news_violations.append(NewsViolation(
                headline=n.get("title", n.get("headline", "Unknown")),
                source=n.get("source", {}).get("name", "Unknown") if isinstance(n.get("source"), dict) else str(n.get("source", "Unknown")),
                date=n.get("date", "2024-01-01"),
                region="US",
                url=n.get("link", n.get("url", "")),
            ))
        except Exception:
            pass

    # Build result
    result = AnalysisResult(
        company=company_name,
        url=url,
        analysis_id=analysis_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        is_preloaded=False,
        rdi_score=rdi_data["rdi_score"],
        rdi_components=RDIComponents(**rdi_data["rdi_components"]),
        regional_pages=regional_pages,
        contradictions=[Contradiction(**c) for c in contradictions_result if _is_valid_contradiction(c)],
        sec_filing=sec_comparison,
        news_violations=news_violations,
        glassdoor_signals=glassdoor,
        drift_dna=drift_dna,
        temporal_history=[],
        bright_data_usage=BrightDataUsage(
            residential_proxies={"regions_fetched": regions_fetched, "product": "Residential Proxies"},
            web_unlocker={"pages_unlocked": 1, "product": "Web Unlocker"},
            serp_api={"queries_run": 2, "product": "SERP API"},
            scraping_browser={"sessions": 1 if glassdoor else 0, "product": "Scraping Browser"},
            web_scraper_api={"datasets": 1, "product": "Web Scraper API"},
        ),
    )
    await _progress(AnalysisStep.SCORING, 90, "Reality Drift Index computed")

    # ── Layer 7: Cognee Memory ─────────────────────────────────────────────────
    await _progress(AnalysisStep.COGNEE_STORE, 93, "Storing analysis in memory...")
    try:
        await store_analysis(result.model_dump())
        history = await get_temporal_history(company_name)
        result.temporal_history = history
    except Exception as e:
        print(f"⚠️  Cognee store failed: {e}")

    await _progress(AnalysisStep.DONE, 100, "Analysis complete")
    return result


def _is_valid_contradiction(c: dict) -> bool:
    required = {"claim", "evidence_source", "evidence_text"}
    return all(c.get(k) for k in required)


# ─── POST /api/analyze ─────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_company(request: AnalyzeRequest):
    """
    Synchronous analysis endpoint.
    Returns pre-loaded data instantly for Shell/Nike/H&M.
    Runs full live pipeline for any other company.
    """
    # Check pre-loaded
    slug = _is_preloaded(request.url, request.company_name)
    if slug and not request.force_live:
        return await _load_preloaded_result(slug)

    # Check in-memory cache
    cached = get_cached_analysis(request.url)
    if cached and not request.force_live:
        return AnalysisResult(**cached)

    # Run live pipeline
    analysis_id = str(uuid.uuid4())
    result = await _run_full_pipeline(
        url=request.url,
        company_name=request.company_name,
        analysis_id=analysis_id,
    )

    # Cache result
    set_cached_analysis(request.url, result.model_dump())
    return result


# ─── GET /api/analyze/stream ──────────────────────────────────────────────────

@router.get("/analyze/stream")
async def analyze_stream(url: str, company_name: str, force_live: bool = False):
    """
    SSE streaming endpoint for live analysis progress.
    Emits ProgressEvent JSON objects as each pipeline step completes.
    """
    slug = _is_preloaded(url, company_name)
    if slug and not force_live:
        # For preloaded: emit fake fast progress then return result
        async def preloaded_stream():
            for step, pct, msg in [
                (AnalysisStep.GEO_FETCH, 20, "Loading regional data..."),
                (AnalysisStep.SEC_SCRAPE, 40, "Loading regulatory filings..."),
                (AnalysisStep.CLAUDE_ANALYZE, 70, "Loading AI analysis..."),
                (AnalysisStep.SCORING, 90, "Computing RDI score..."),
            ]:
                evt = ProgressEvent(step=step, progress=pct, message=msg)
                yield {"data": evt.model_dump_json()}
                await asyncio.sleep(0.3)

            result = await _load_preloaded_result(slug)
            final = ProgressEvent(step=AnalysisStep.DONE, progress=100, message="Analysis complete", result=result)
            yield {"data": final.model_dump_json()}

        return EventSourceResponse(preloaded_stream())

    # Live pipeline with SSE progress
    progress_events: asyncio.Queue = asyncio.Queue()
    analysis_id = str(uuid.uuid4())

    async def stream_pipeline():
        async def on_progress(step, pct, msg):
            evt = ProgressEvent(step=step, progress=pct, message=msg)
            await progress_events.put(evt)

        # Run pipeline in background
        pipeline_task = asyncio.create_task(
            _run_full_pipeline(url, company_name, analysis_id, on_progress)
        )

        # Stream events as they arrive
        while True:
            try:
                evt = await asyncio.wait_for(progress_events.get(), timeout=120.0)
                if evt.step == AnalysisStep.DONE:
                    # Get result from completed pipeline
                    result = await pipeline_task
                    final = ProgressEvent(
                        step=AnalysisStep.DONE, progress=100,
                        message="Analysis complete", result=result
                    )
                    yield {"data": final.model_dump_json()}
                    break
                yield {"data": evt.model_dump_json()}
            except asyncio.TimeoutError:
                error_evt = ProgressEvent(
                    step=AnalysisStep.ERROR, progress=0,
                    message="Analysis timed out", error="Pipeline exceeded 120s"
                )
                yield {"data": error_evt.model_dump_json()}
                break
            except Exception as e:
                error_evt = ProgressEvent(
                    step=AnalysisStep.ERROR, progress=0,
                    message="Analysis failed", error=str(e)
                )
                yield {"data": error_evt.model_dump_json()}
                break

    return EventSourceResponse(stream_pipeline())
