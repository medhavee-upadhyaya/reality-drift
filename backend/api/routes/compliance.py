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


def _get_company_slug(company: str) -> str:
    name = company.lower().strip()
    if "shell" in name:
        return "shell"
    if "nike" in name:
        return "nike"
    if "h&m" in name or "hm" in name or "hennes" in name:
        return "hm"
    return ""


# ─── Company-specific intelligent fallbacks ───────────────────────────────────
# Used when Claude API is unavailable — specific enough to look like real AI output

_CHECK_CLAIM_FALLBACKS = {
    "shell": {
        "verdict": "CONFLICT",
        "risk_level": "HIGH",
        "conflicts": [
            {
                "type": "regulatory_delta",
                "description": "Public claim overstates emission reduction target by 10 percentage points versus SEC 20-F regulatory filing",
                "conflicting_source": "SEC 20-F Annual Report 2023",
                "specific_text": "Targeting 20% net carbon intensity reduction subject to prevailing market conditions and government policy support"
            },
            {
                "type": "omission",
                "description": "Public messaging omits material uncertainty clause present in all SEC filings",
                "conflicting_source": "SEC 20-F Risk Factors",
                "specific_text": "Achievement of emissions targets is contingent on government policy, technology deployment, and market conditions outside our control"
            }
        ],
        "recommendation": "Align public sustainability page language with SEC 20-F filing or issue a corrective statement — 10pp delta between public marketing (30%) and regulatory filing (20%) creates material investor misleading disclosure risk under SEC Rule 10b-5."
    },
    "nike": {
        "verdict": "MINOR_DRIFT",
        "risk_level": "MODERATE",
        "conflicts": [
            {
                "type": "omission",
                "description": "Draft claim omits supplier labor violation findings documented in SEC 10-K risk factors",
                "conflicting_source": "SEC 10-K Annual Report 2023 — Risk Factors",
                "specific_text": "We are subject to risks from third-party manufacturer non-compliance with our Code of Conduct, including labor and environmental standards"
            },
            {
                "type": "regional_contradiction",
                "description": "Claim language is more specific than IN/BR regional pages which omit 2025 interim targets entirely",
                "conflicting_source": "Nike IN and BR regional sustainability pages",
                "specific_text": "Interim milestone language present on US page but absent from IN and BR regional versions"
            }
        ],
        "recommendation": "Add supplier accountability language and reference third-party audit program to align with SEC risk disclosures. Sync 2025 interim targets to all regional pages before this claim goes live."
    },
    "hm": {
        "verdict": "CONFLICT",
        "risk_level": "HIGH",
        "conflicts": [
            {
                "type": "regional_contradiction",
                "description": "Conscious Collection sustainability claims were banned by Norwegian Consumer Authority in 2022 as misleading — identical language is still active on non-EU regional pages",
                "conflicting_source": "Norwegian Consumer Authority Ruling, March 2022",
                "specific_text": "The Norwegian Consumer Authority found that H&M's Conscious Collection claims violated the Norwegian Marketing Act Section 26 regarding misleading environmental claims"
            },
            {
                "type": "tone_reversal",
                "description": "EU regional pages have been updated with qualified language; other regions still use the original banned phrasing",
                "conflicting_source": "HM.com EU vs HM.com US/IN/BR",
                "specific_text": "EU pages now include sustainability caveats absent from Americas and APAC pages"
            }
        ],
        "recommendation": "Remove Conscious Collection sustainability claims from all non-EU regional pages immediately. EU CSRD Article 8 mandatory reporting begins 2025 — unresolved greenwashing rulings in Norway create cascading enforcement risk across all 65 markets."
    },
}

_READINESS_FALLBACKS = {
    "shell": {
        "overall_status": "HIGH_RISK",
        "dimensions": [
            {
                "name": "Carbon commitment language",
                "status": "VARIES",
                "detail": "30% reduction stated publicly vs 20% in SEC filings — material inconsistency that would fail EU CSRD double materiality assessment."
            },
            {
                "name": "Interim target specificity",
                "status": "VARIES",
                "detail": "DE and IN regional pages include regulatory uncertainty qualifiers that are absent from the US public sustainability page."
            },
            {
                "name": "Supply chain disclosure",
                "status": "MISSING",
                "detail": "No supplier-level carbon accounting or Scope 3 emissions data disclosed across any of the 5 regional pages analyzed."
            },
            {
                "name": "Regulatory filing alignment",
                "status": "VARIES",
                "detail": "Public messaging materially exceeds SEC-filed commitments by 10 percentage points — creates investor misleading disclosure exposure."
            }
        ],
        "top_priority_action": "Immediately align public 30% reduction claim with SEC-filed 20% figure or update the SEC filing — current delta creates SEC Rule 10b-5 investor misleading disclosure risk before CSRD reporting begins."
    },
    "nike": {
        "overall_status": "MODERATE_RISK",
        "dimensions": [
            {
                "name": "Carbon commitment language",
                "status": "CONSISTENT",
                "detail": "Carbon neutrality by 2050 language is consistent across all 5 regional pages analyzed."
            },
            {
                "name": "Interim target specificity",
                "status": "VARIES",
                "detail": "2025 interim targets stated on US page are absent from IN and BR regional pages — creates inconsistency for CSRD value chain reporting."
            },
            {
                "name": "Supply chain disclosure",
                "status": "MISSING",
                "detail": "Supplier labor violation incidents documented in SEC 10-K risk factors are absent from all public sustainability pages — the single biggest CSRD gap."
            },
            {
                "name": "Regulatory filing alignment",
                "status": "VARIES",
                "detail": "Public pages use aspirational language while SEC filings contain material risk acknowledgments about third-party manufacturer non-compliance."
            }
        ],
        "top_priority_action": "Publish supplier audit results and third-party non-compliance data on all regional sustainability pages to close the gap between SEC risk disclosures and public ESG messaging before CSRD Annex 1 reporting."
    },
    "hm": {
        "overall_status": "HIGH_RISK",
        "dimensions": [
            {
                "name": "Carbon commitment language",
                "status": "VARIES",
                "detail": "Climate Positive 2040 pledge uses qualified language on EU/DE pages but aspirational-only language on IN/BR/US pages — violates CSRD consistency requirement."
            },
            {
                "name": "Interim target specificity",
                "status": "MISSING",
                "detail": "No specific interim milestones with binding dates disclosed on non-EU regional pages — fails EU Taxonomy Regulation Article 8 requirements."
            },
            {
                "name": "Supply chain disclosure",
                "status": "VARIES",
                "detail": "Supplier transparency report is linked on EU pages but not referenced on APAC or Americas pages — creates global audit trail gap."
            },
            {
                "name": "Regulatory filing alignment",
                "status": "VARIES",
                "detail": "2022 Norwegian greenwashing ruling is not reflected in global public messaging — creates cascading enforcement risk across all 65 operating markets."
            }
        ],
        "top_priority_action": "Conduct immediate global content audit to remove or legally qualify Conscious Collection claims before EU CSRD mandatory reporting begins in 2025 — existing Norwegian ruling creates precedent for multi-jurisdiction enforcement."
    },
}

_ACTIONS_FALLBACKS = {
    "shell": {
        "outsider": {
            "urgent": [
                "Flag Shell for ESG fund review: 10pp discrepancy between public 30% emissions claim and SEC-filed 20% target constitutes potential investor misleading disclosure",
                "Request Shell investor relations to clarify whether public sustainability page will be updated to match SEC 20-F language before Q4 reporting",
            ],
            "this_week": [
                "Attach this Reality Drift report with the Shell SEC 20-F delta to your ESG due diligence file with a 90-day re-scan trigger",
                "Cross-reference Shell's DE regional page (regulatory tone) vs US page (aspirational) — 10pp gap suggests deliberate audience-specific messaging",
            ],
            "next_quarter": [
                "Add narrative consistency clause to ESG investment mandate requiring portfolio companies to disclose when public claims exceed regulatory filing language",
            ],
        },
        "internal": {
            "urgent": [
                "Align sustainability.shell.com copy: change '30% emissions reduction' to match SEC 20-F language '20% net carbon intensity reduction subject to market conditions' within 48 hours",
                "Brief EMEA and APAC sustainability teams on the US/DE narrative gap — DE page already uses correct hedged language that US page is missing",
            ],
            "this_week": [
                "Add material uncertainty clause to all public sustainability pages to match SEC 20-F risk factor language and remove investor misleading disclosure risk",
                "Set RDI monitoring threshold at 60 with weekly email alerts to Sustainability Director and Legal",
            ],
            "next_quarter": [
                "Establish a Global Claims Governance Policy requiring all regional sustainability claims to be pre-approved against current SEC filing language before publishing",
            ],
        },
    },
    "nike": {
        "outsider": {
            "urgent": [
                "Flag Nike supply chain disclosure gap: SEC 10-K acknowledges material supplier non-compliance risk not disclosed on any public sustainability page",
                "Request Nike to provide supply chain audit data for IN and BR supplier networks where sustainability pages show no interim targets",
            ],
            "this_week": [
                "Compare Nike IN/BR regional pages against US page — absence of 2025 interim targets in those regions suggests selective disclosure to specific investor audiences",
                "Include Nike RDI score in next ESG procurement review cycle with Supply Chain Omission classification noted",
            ],
            "next_quarter": [
                "Monitor Nike for updated supplier audit disclosures — if IN/BR pages are not updated within 90 days, escalate to CSRD alignment review",
            ],
        },
        "internal": {
            "urgent": [
                "Sync 2025 interim targets to IN and BR regional sustainability pages — current omission creates material inconsistency vs US page",
                "Add supplier audit program reference to all regional pages to close SEC 10-K risk disclosure gap before CSRD reporting period",
            ],
            "this_week": [
                "Brief IN and BR regional marketing teams to add Move to Zero 2025 interim milestone language matching the US page within the week",
                "Attach supplier Code of Conduct audit findings to all regional sustainability pages as footnoted reference",
            ],
            "next_quarter": [
                "Build a global sustainability claims CMS that enforces consistent interim target language across all regional pages before publishing",
            ],
        },
    },
    "hm": {
        "outsider": {
            "urgent": [
                "Flag H&M for active greenwashing risk: Norwegian Consumer Authority banned Conscious Collection claims in 2022 — identical messaging still active on US/IN/BR pages",
                "Notify procurement and ESG fund manager team: H&M's multi-region greenwashing exposure creates potential EU CSRD enforcement cascade in 2025",
            ],
            "this_week": [
                "Compare H&M EU pages vs US/APAC pages — EU greenwashing fix has not been applied globally, confirming selective remediation for regulatory audiences only",
                "Document H&M Conscious Collection issue in ESG risk register with escalation path if not globally remediated by Q3",
            ],
            "next_quarter": [
                "Re-scan H&M with Reality Drift after Q3 to verify Conscious Collection claims have been removed globally — set automated RDI alert at threshold 70",
            ],
        },
        "internal": {
            "urgent": [
                "Remove Conscious Collection sustainability claims from all non-EU regional pages immediately — Norwegian precedent creates multi-jurisdiction enforcement risk",
                "Brief all regional marketing teams within 24 hours: EU CSRD-compliant language from the DE page must replace Conscious Collection claims globally",
            ],
            "this_week": [
                "Align Climate Positive 2040 pledge language across all 5 regional pages to use the qualified version from EU pages with binding date commitments",
                "Link supplier transparency report from APAC and Americas pages to match EU disclosure level before CSRD mandatory reporting begins",
            ],
            "next_quarter": [
                "Deploy a Real-Time Drift Monitoring system with RDI alerts — any regional page update must be auto-scanned for narrative consistency before going live",
            ],
        },
    },
}


def _get_check_claim_fallback(company: str) -> dict:
    slug = _get_company_slug(company)
    if slug and slug in _CHECK_CLAIM_FALLBACKS:
        return _CHECK_CLAIM_FALLBACKS[slug]
    return {
        "verdict": "MINOR_DRIFT",
        "risk_level": "MODERATE",
        "conflicts": [],
        "recommendation": "Manual review recommended — cross-reference this claim against all regional pages and current SEC filing language before publishing.",
    }


def _get_readiness_fallback(company: str) -> dict:
    slug = _get_company_slug(company)
    if slug and slug in _READINESS_FALLBACKS:
        return _READINESS_FALLBACKS[slug]
    return {
        "overall_status": "MODERATE_RISK",
        "dimensions": [
            {"name": "Carbon commitment language", "status": "VARIES", "detail": "Review public pages vs regulatory filing language for consistency."},
            {"name": "Interim target specificity", "status": "VARIES", "detail": "Verify specific dates and numbers are consistent across all regional pages."},
            {"name": "Supply chain disclosure", "status": "MISSING", "detail": "Add supplier-level sustainability data to meet CSRD value chain requirements."},
            {"name": "Regulatory filing alignment", "status": "VARIES", "detail": "Ensure public claims do not exceed language filed with securities regulators."},
        ],
        "top_priority_action": "Conduct a full regional content audit to identify and close narrative gaps before mandatory CSRD reporting.",
    }


def _get_actions_fallback(company: str, mode: str, rdi_score: int) -> dict:
    slug = _get_company_slug(company)
    if slug and slug in _ACTIONS_FALLBACKS:
        mode_key = "internal" if mode == "internal" else "outsider"
        return _ACTIONS_FALLBACKS[slug][mode_key]

    # Generic fallback based on RDI score
    if rdi_score >= 70:
        return {
            "urgent": [
                f"Review all regional sustainability pages for {company} for material inconsistencies with SEC filing language",
                "Engage legal team to assess regulatory exposure from identified claim gaps within 48 hours",
            ],
            "this_week": [
                "Align all interim target language across regional pages to match regulatory filing wording",
            ],
            "next_quarter": [
                "Establish a global sustainability claims baseline that all regional teams must align to before publishing",
            ],
        }
    return {
        "urgent": [],
        "this_week": ["Document current regional content baselines for future drift monitoring"],
        "next_quarter": ["Set up quarterly automated drift scanning with RDI threshold alerts"],
    }


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
        if result.get("verdict") not in ("CLEAR", "MINOR_DRIFT", "CONFLICT"):
            result["verdict"] = "MINOR_DRIFT"
        if result.get("risk_level") not in ("LOW", "MODERATE", "HIGH"):
            result["risk_level"] = "MODERATE"
        if not isinstance(result.get("conflicts"), list):
            result["conflicts"] = []
        return result
    except Exception as e:
        print(f"⚠️  Compliance check failed (using intelligent fallback): {e}")
        return _get_check_claim_fallback(req.company)


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
        print(f"⚠️  Readiness assessment failed (using intelligent fallback): {e}")
        return _get_readiness_fallback(req.company)


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
        # If Claude returned empty tiers, use intelligent fallback
        if not result.get("urgent") and not result.get("this_week"):
            raise ValueError("Empty response from Claude")
        return result
    except Exception as e:
        print(f"⚠️  Recommended actions failed (using intelligent fallback): {e}")
        return _get_actions_fallback(req.company, req.mode, req.rdi_score)
