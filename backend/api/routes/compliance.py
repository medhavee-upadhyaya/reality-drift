"""
compliance.py — Internal Compliance Mode endpoints.

POST /api/compliance/check-claim       — Pre-publish compliance checker
POST /api/compliance/readiness         — Regulatory readiness assessment
POST /api/compliance/recommended-actions — Prioritized action items by mode
"""

import os
import json
import re
import anthropic
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

MODEL = "claude-sonnet-4-6"

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client


def _parse_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise ValueError(f"Cannot parse JSON from: {text[:300]}")


# ─── Schemas ─────────────────────────────────────────────────────────────────


class CheckClaimRequest(BaseModel):
    company: str
    draft_claim: str
    target_region: str = "ALL"
    existing_claims: dict[str, list[str]] = {}
    sec_language: str = ""


class ReadinessRequest(BaseModel):
    company: str
    contradictions: list[dict] = []
    sec_filing: dict | None = None
    regional_pages: dict[str, dict] = {}


class RecommendedActionsRequest(BaseModel):
    company: str
    contradictions: list[dict] = []
    mode: str = "outsider"   # "outsider" | "internal"
    rdi_score: int = 0


# ─── POST /api/compliance/check-claim ────────────────────────────────────────


@router.post("/compliance/check-claim")
async def check_claim(req: CheckClaimRequest):
    """
    Pre-publish compliance checker.
    Checks a draft sustainability claim against existing regional content
    and SEC regulatory language before it goes live.
    """
    existing_str = ""
    for region, claims in req.existing_claims.items():
        if claims:
            existing_str += f"\n{region} region claims:\n" + "\n".join(f"  - {c}" for c in claims[:5])

    sec_ctx = f"\n\nSEC/Regulatory Filing Language:\n{req.sec_language[:3000]}" if req.sec_language else ""

    prompt = f"""You are a compliance verification engine for a global enterprise.

COMPANY: {req.company}
TARGET REGION FOR NEW CLAIM: {req.target_region}

EXISTING REGIONAL CLAIMS (published across all regions):
{existing_str or "No existing claims available."}
{sec_ctx}

DRAFT CLAIM TO VERIFY:
"{req.draft_claim}"

Determine:
1. Does this draft claim contradict any existing regional claims?
2. Does this draft claim contradict any regulatory filing language?
3. Does this draft claim make commitments more specific than other regions?
4. Does this draft claim omit commitments present in other regions?

Respond ONLY with valid JSON in this exact structure:
{{
  "verdict": "CLEAR" | "MINOR_DRIFT" | "CONFLICT",
  "risk_level": "LOW" | "MODERATE" | "HIGH",
  "conflicts": [
    {{
      "type": "regional_contradiction" | "regulatory_delta" | "omission" | "overcommitment",
      "description": "plain English explanation",
      "conflicting_source": "which region or filing it conflicts with",
      "specific_text": "the exact conflicting text"
    }}
  ],
  "recommendation": "one sentence action recommendation"
}}

If no conflicts, return verdict: "CLEAR", risk_level: "LOW", conflicts: [], and a brief recommendation."""

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=[{
                "type": "text",
                "text": "You are a corporate compliance verification engine. You respond only with valid JSON. No explanations outside the JSON structure.",
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": prompt}],
        )
        result = _parse_json(response.content[0].text)
        # Validate verdict
        if result.get("verdict") not in ("CLEAR", "MINOR_DRIFT", "CONFLICT"):
            result["verdict"] = "MINOR_DRIFT"
        if result.get("risk_level") not in ("LOW", "MODERATE", "HIGH"):
            result["risk_level"] = "MODERATE"
        if not isinstance(result.get("conflicts"), list):
            result["conflicts"] = []
        return result
    except Exception as e:
        print(f"⚠️  Compliance check failed: {e}")
        return {
            "verdict": "MINOR_DRIFT",
            "risk_level": "MODERATE",
            "conflicts": [],
            "recommendation": "Manual review recommended — automated check unavailable.",
        }


# ─── POST /api/compliance/readiness ──────────────────────────────────────────


@router.post("/compliance/readiness")
async def regulatory_readiness(req: ReadinessRequest):
    """
    Generate a regulatory readiness assessment (e.g. EU CSRD audit readiness)
    based on the contradictions and filing data already collected by the pipeline.
    """
    contradictions_str = ""
    for c in req.contradictions[:8]:
        contradictions_str += f"- [{c.get('severity','?').upper()}] {c.get('claim','')} | Source: {c.get('evidence_source','')}\n"

    filing_str = ""
    if req.sec_filing and req.sec_filing.get("public_claim"):
        filing_str = f"""
Public claim: "{req.sec_filing.get('public_claim','')}"
SEC language: "{req.sec_filing.get('sec_language','')}"
Delta: {req.sec_filing.get('delta_description','')}"""

    regions_str = ", ".join(req.regional_pages.keys()) if req.regional_pages else "US, DE, IN, BR, SG"

    prompt = f"""You are an EU CSRD regulatory readiness assessment engine.

COMPANY: {req.company}
REGIONS ANALYZED: {regions_str}

CONTRADICTIONS DETECTED:
{contradictions_str or "No contradictions found."}

REGULATORY FILING COMPARISON:
{filing_str or "No SEC filing data available."}

Generate a regulatory readiness assessment as if an EU CSRD auditor reviewed the company's public sustainability claims today.

Respond ONLY with valid JSON:
{{
  "overall_status": "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK",
  "dimensions": [
    {{
      "name": "Carbon commitment language",
      "status": "CONSISTENT" | "VARIES" | "MISSING",
      "detail": "one sentence explanation"
    }},
    {{
      "name": "Interim target specificity",
      "status": "CONSISTENT" | "VARIES" | "MISSING",
      "detail": "one sentence explanation"
    }},
    {{
      "name": "Supply chain disclosure",
      "status": "CONSISTENT" | "VARIES" | "MISSING",
      "detail": "one sentence explanation"
    }},
    {{
      "name": "Regulatory filing alignment",
      "status": "CONSISTENT" | "VARIES" | "MISSING",
      "detail": "one sentence explanation"
    }}
  ],
  "top_priority_action": "the single most important thing to fix right now"
}}"""

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=[{
                "type": "text",
                "text": "You are a regulatory compliance assessment engine. Respond only with valid JSON.",
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": prompt}],
        )
        result = _parse_json(response.content[0].text)
        if result.get("overall_status") not in ("LOW_RISK", "MODERATE_RISK", "HIGH_RISK"):
            result["overall_status"] = "MODERATE_RISK"
        return result
    except Exception as e:
        print(f"⚠️  Readiness assessment failed: {e}")
        return {
            "overall_status": "MODERATE_RISK",
            "dimensions": [
                {"name": "Carbon commitment language", "status": "VARIES", "detail": "Assessment unavailable — manual review required."},
                {"name": "Interim target specificity", "status": "VARIES", "detail": "Assessment unavailable — manual review required."},
                {"name": "Supply chain disclosure", "status": "MISSING", "detail": "Assessment unavailable — manual review required."},
                {"name": "Regulatory filing alignment", "status": "VARIES", "detail": "Assessment unavailable — manual review required."},
            ],
            "top_priority_action": "Conduct manual regulatory readiness review with legal team.",
        }


# ─── POST /api/compliance/recommended-actions ────────────────────────────────


@router.post("/compliance/recommended-actions")
async def recommended_actions(req: RecommendedActionsRequest):
    """
    Generate prioritized recommended actions based on contradictions found.
    Different framing for outsider vs internal compliance mode.
    """
    contradictions_str = ""
    for c in req.contradictions[:10]:
        contradictions_str += (
            f"- [{c.get('severity','?').upper()}] [{c.get('region_source','?')}] "
            f"{c.get('claim','')}\n  Evidence: {c.get('evidence_text','')[:120]}\n"
        )

    mode_instruction = (
        "The audience is an EXTERNAL observer (ESG fund manager, procurement, auditor). Frame actions as what an external party should do — flag, request, escalate, monitor."
        if req.mode == "outsider"
        else "The audience is the COMPANY'S OWN compliance team. Frame actions as internal fixes — align content, update language, brief teams, set guardrails."
    )

    prompt = f"""You are generating prioritized recommended actions for {req.company}.

REALITY DRIFT INDEX: {req.rdi_score}/100
MODE: {req.mode.upper()}
{mode_instruction}

CONTRADICTIONS FOUND:
{contradictions_str or "No contradictions found. Generate general best-practice recommendations."}

Generate specific, actionable items organized by urgency. Reference actual regions and claims where possible.

Respond ONLY with valid JSON:
{{
  "urgent": ["action 1", "action 2"],
  "this_week": ["action 1", "action 2"],
  "next_quarter": ["action 1"]
}}

Keep each action to one clear sentence. Maximum 3 items per tier. Be specific."""

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=[{
                "type": "text",
                "text": "You generate concise, specific compliance action items. Respond only with valid JSON.",
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": prompt}],
        )
        result = _parse_json(response.content[0].text)
        for key in ("urgent", "this_week", "next_quarter"):
            if not isinstance(result.get(key), list):
                result[key] = []
        return result
    except Exception as e:
        print(f"⚠️  Recommended actions failed: {e}")
        # Sensible fallback based on RDI score
        if req.rdi_score >= 70:
            return {
                "urgent": [
                    f"Review all regional sustainability pages for {req.company} for material inconsistencies",
                    "Engage legal team to assess regulatory exposure from identified claim gaps",
                ],
                "this_week": [
                    "Align interim target language across all regional pages to match regulatory filing wording",
                ],
                "next_quarter": [
                    "Establish a global claims baseline document all regional teams must align to before publishing",
                ],
            }
        return {
            "urgent": [],
            "this_week": ["Document current regional content baselines for future drift monitoring"],
            "next_quarter": ["Set up quarterly automated drift scanning with RDI threshold alerts"],
        }
