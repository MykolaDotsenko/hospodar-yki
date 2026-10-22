"""Model evolution invariants: extending research must not require rewriting validator."""
import pathlib
import unittest
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from validate_learning_methods import validate_research_counts


class ResearchGrowthTests(unittest.TestCase):
    def test_baseline_and_added_methods_are_accepted(self):
        self.assertEqual(validate_research_counts(67, 69, 67, 67), [])
        self.assertEqual(validate_research_counts(68, 70, 68, 68), [])

    def test_cannot_silently_remove_existing_research(self):
        self.assertTrue(validate_research_counts(66, 69, 66, 66)))
        self.assertTrue(validate_research_counts(67, 68, 67, 67)))

    def test_ratings_and_count_are_one_to_one(self):
        self.assertTrue(validate_research_counts(68, 70, 67, 67))
        self.assertTrue(validate_research_counts(68, 70, 68, 69))


if __name__ == "__main__":
    unittest.main()
