import unittest

from memory.retrieve import format_retrieved_context


class MemoryRetrievalTests(unittest.TestCase):
    def test_context_is_labeled_and_bounded(self):
        context = format_retrieved_context(["first result", "second result"], max_chars=40)
        self.assertIn("[MEMORY 1]", context)
        self.assertLessEqual(len(context), 40)

    def test_empty_results_return_empty_context(self):
        self.assertEqual(format_retrieved_context([]), "")


if __name__ == "__main__":
    unittest.main()
