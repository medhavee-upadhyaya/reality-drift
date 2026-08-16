import unittest

from utils.provenance import content_hash, enrich_contradiction


class ProvenanceTests(unittest.TestCase):
    def test_hash_is_stable(self):
        self.assertEqual(content_hash("evidence"), content_hash("evidence"))
        self.assertNotEqual(content_hash("evidence"), content_hash("Evidence"))

    def test_sec_url_is_attached_to_sec_finding(self):
        finding = enrich_contradiction(
            {"evidence_source": "SEC 20-F 2024", "evidence_text": "Target may be revised."},
            sec_url="https://www.sec.gov/filing.htm",
            retrieved_at="2026-01-01T00:00:00Z",
        )
        self.assertEqual(finding["evidence_url"], "https://www.sec.gov/filing.htm")
        self.assertEqual(len(finding["evidence_hash"]), 64)

    def test_unsafe_model_url_is_dropped(self):
        finding = enrich_contradiction(
            {
                "evidence_source": "Unknown",
                "evidence_text": "Text",
                "evidence_url": "javascript:alert(1)",
            }
        )
        self.assertIsNone(finding["evidence_url"])


if __name__ == "__main__":
    unittest.main()
