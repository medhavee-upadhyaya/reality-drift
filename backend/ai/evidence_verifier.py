"""Second-pass verification for contradiction findings."""

from __future__ import annotations

import json

from ai.claude_client import call_claude


VALID_STATUSES = {"verified", "disputed", "insufficient_evidence"}


def deterministic_verification(findings: list[dict], evidence_context: str) -> list[dict]:
    """Conservative fallback: verify only exact evidence quotes present in context."""
    verified: list[dict] = []
    normalized_context = " ".join(evidence_context.split()).lower()
    for finding in findings:
        quote = " ".join(str(finding.get("evidence_text", "")).split()).lower()
        exact_match = bool(quote) and quote in normalized_context
        item = dict(finding)
        item["verification_status"] = "verified" if exact_match else "insufficient_evidence"
        item["confidence"] = 0.85 if exact_match else 0.3
        item["verification_reason"] = (
            "The cited passage is an exact match in the collected evidence."
            if exact_match
            else "The cited passage could not be matched exactly in the collected evidence."
        )
        verified.append(item)
    return verified


def _merge_verdicts(findings: list[dict], verdicts: object) -> list[dict]:
    if not isinstance(verdicts, list):
        raise ValueError("Verifier response must be a list")

    by_index = {
        int(item["finding_index"]): item
        for item in verdicts
        if isinstance(item, dict) and str(item.get("finding_index", "")).isdigit()
    }
    merged: list[dict] = []
    for index, finding in enumerate(findings):
        verdict = by_index.get(index, {})
        status = verdict.get("status", "insufficient_evidence")
        if status not in VALID_STATUSES:
            status = "insufficient_evidence"
        try:
            confidence = max(0.0, min(1.0, float(verdict.get("confidence", 0.0))))
        except (TypeError, ValueError):
            confidence = 0.0

        item = dict(finding)
        item["verification_status"] = status
        item["confidence"] = confidence
        item["verification_reason"] = str(verdict.get("reason", "No verifier rationale returned."))
        merged.append(item)
    return merged


async def verify_findings(
    findings: list[dict], evidence_context: str, company_name: str
) -> list[dict]:
    """Use an independent LLM pass to challenge citations and conclusions."""
    if not findings:
        return []

    verifier_context = {
        "FINDINGS_TO_VERIFY": json.dumps(
            [{"finding_index": i, **finding} for i, finding in enumerate(findings)],
            ensure_ascii=False,
        ),
        "COLLECTED_EVIDENCE": evidence_context,
    }
    try:
        verdicts, _ = await call_claude(
            task="verify_evidence",
            regional_text=verifier_context,
            company_name=company_name,
        )
        return _merge_verdicts(findings, verdicts)
    except Exception as exc:
        print(f"⚠️  Evidence verification failed; using exact-match fallback: {exc}")
        return deterministic_verification(findings, evidence_context)
