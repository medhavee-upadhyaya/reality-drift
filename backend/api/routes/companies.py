"""
companies.py — Serve pre-loaded company data (Shell, Nike, H&M).
These return instantly with zero computation — demo-safe.
"""

import json
import os
from fastapi import APIRouter, HTTPException
from data.schemas import AnalysisResult, CompanySummary, CompaniesResponse, DriftType

router = APIRouter()

PRELOADED_DIR = os.path.join(os.path.dirname(__file__), "../../data/preloaded")

# Manifest of demo companies
DEMO_COMPANIES = [
    CompanySummary(
        slug="shell",
        name="Shell",
        url="https://www.shell.com/sustainability",
        is_preloaded=True,
        last_rdi=84,
        dominant_drift=DriftType.REGULATORY_ARBITRAGE,
        description="Energy giant telling regulators one emissions number, consumers another",
    ),
    CompanySummary(
        slug="nike",
        name="Nike",
        url="https://about.nike.com/en/impact",
        is_preloaded=True,
        last_rdi=71,
        dominant_drift=DriftType.SUPPLY_CHAIN_OMISSION,
        description="Supplier labor violations absent from all public sustainability claims",
    ),
    CompanySummary(
        slug="hm",
        name="H&M",
        url="https://hmgroup.com/sustainability/",
        is_preloaded=True,
        last_rdi=78,
        dominant_drift=DriftType.LEGAL_GREENWASHING,
        description="Found guilty of greenwashing in Norway, still messaging identically globally",
    ),
]


def _load_preloaded(slug: str) -> dict:
    """Load a preloaded JSON file by company slug."""
    path = os.path.join(PRELOADED_DIR, f"{slug}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Company '{slug}' not found")
    with open(path, "r") as f:
        return json.load(f)


@router.get("/companies", response_model=CompaniesResponse)
async def list_companies():
    """Return all available demo companies with summary data."""
    return CompaniesResponse(companies=DEMO_COMPANIES)


@router.get("/companies/{slug}", response_model=AnalysisResult)
async def get_company(slug: str):
    """
    Return full pre-computed analysis for a demo company.
    Instant response — no computation, no API calls.
    """
    data = _load_preloaded(slug.lower())
    return AnalysisResult(**data)
