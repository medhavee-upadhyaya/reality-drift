import unittest

from ai.geographic_similarity import lexical_similarity, _normalize_model_result


class GeographicSimilarityTests(unittest.TestCase):
    def test_identical_regions_have_no_drift(self):
        result = lexical_similarity({"US": "net zero emissions by 2050", "DE": "net zero emissions by 2050"})
        self.assertEqual(result["mean_similarity"], 1.0)
        self.assertEqual(result["max_variation"], 0.0)

    def test_different_regions_have_high_variation(self):
        result = lexical_similarity({"US": "net zero carbon emissions", "DE": "worker wages supplier audits"})
        self.assertEqual(result["mean_similarity"], 0.0)
        self.assertEqual(result["max_variation"], 1.0)

    def test_model_summary_is_recomputed_from_pairs(self):
        result = _normalize_model_result(
            {"US_DE": 0.8, "US_IN": 0.4, "mean_similarity": 0.99},
            {},
        )
        self.assertEqual(result["mean_similarity"], 0.6)
        self.assertEqual(result["max_variation"], 0.6)
        self.assertEqual(result["method"], "llm_semantic")


if __name__ == "__main__":
    unittest.main()
