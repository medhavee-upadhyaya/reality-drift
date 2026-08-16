import unittest

from ai.evidence_verifier import deterministic_verification, _merge_verdicts


class EvidenceVerifierTests(unittest.TestCase):
    def test_exact_quote_is_verified(self):
        findings = [{"claim": "30%", "evidence_text": "Target may be revised."}]
        result = deterministic_verification(findings, "The filing says: Target may be revised.")
        self.assertEqual(result[0]["verification_status"], "verified")
        self.assertGreater(result[0]["confidence"], 0.8)

    def test_unmatched_quote_is_not_verified(self):
        findings = [{"claim": "30%", "evidence_text": "Invented quotation"}]
        result = deterministic_verification(findings, "Actual collected evidence")
        self.assertEqual(result[0]["verification_status"], "insufficient_evidence")

    def test_invalid_model_status_is_rejected(self):
        result = _merge_verdicts(
            [{"claim": "claim"}],
            [{"finding_index": 0, "status": "certain", "confidence": 8, "reason": "x"}],
        )
        self.assertEqual(result[0]["verification_status"], "insufficient_evidence")
        self.assertEqual(result[0]["confidence"], 1.0)


if __name__ == "__main__":
    unittest.main()
