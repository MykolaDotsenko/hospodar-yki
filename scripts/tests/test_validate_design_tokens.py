"""Regression cases: tokens.json is the only colour source and DESIGN-01a roles hold."""
from pathlib import Path
import copy
import json
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_design_tokens import ROOT, check, contrast, render_css, APP_CSS  # noqa: E402

TOKENS = json.loads((ROOT / "brand/tokens.json").read_text(encoding="utf-8"))


class DesignTokenTests(unittest.TestCase):
    def setUp(self):
        self.tokens = copy.deepcopy(TOKENS)
        self.css = {p: (ROOT / p).read_text(encoding="utf-8") for p in APP_CSS}

    def errors(self, tokens=None, generated=None, css=None):
        tokens = tokens or self.tokens
        return check(tokens, render_css(tokens) if generated is None else generated, css or self.css)

    def test_repository_state_passes(self):
        self.assertEqual(self.errors(), [])
        self.assertEqual((ROOT / "app/tokens.css").read_text(encoding="utf-8"), render_css(TOKENS))

    def test_wcag_reference_values(self):
        self.assertAlmostEqual(contrast("#000000", "#FFFFFF"), 21)
        self.assertEqual(contrast("#FFFFFF", "#FFFFFF"), 1)
        with self.assertRaises(ValueError):
            contrast("#fff", "#000000")

    def test_stale_generated_file_fails(self):
        self.assertTrue(any("stale" in e for e in self.errors(generated=":root{}\n")))

    def test_raw_hex_in_app_css_fails_but_box_shadow_is_allowed(self):
        css = dict(self.css)
        css["app/exam.css"] += "\n.x{color:#123456}\n.y{box-shadow:0 1px 0 #18251f22}\n"
        errs = self.errors(css=css)
        self.assertEqual([e for e in errs if "raw colour" in e], ["app/exam.css: raw colour #123456 — use a token from brand/tokens.json"])

    def test_undefined_custom_property_fails(self):
        css = dict(self.css)
        css["app/exam.css"] += "\n.x{color:var(--not-a-token)}\n"
        self.assertTrue(any("--not-a-token" in e for e in self.errors(css=css)))

    def test_low_contrast_pair_fails(self):
        self.tokens["colors"]["muted"] = "#9BAAA2"  # the old input-border grey: 2.4:1 on white
        self.assertTrue(any(e.startswith("contrast muted on surface") for e in self.errors()))

    def test_input_border_meets_non_text_minimum(self):
        self.tokens["colors"]["input_border"] = "#9BAAA2"
        self.assertTrue(any("input_border" in e and "1.4.11" in e for e in self.errors()))

    def test_saturated_fill_behind_finnish_text_fails(self):
        css = dict(self.css)
        css["app/styles.css"] += "\n.prompt{background:var(--skill-reading)}\n"
        self.assertTrue(any("saturated accent fill" in e for e in self.errors(css=css)))

    def test_learning_cue_cannot_use_accent_tokens(self):
        css = dict(self.css)
        css["app/styles.css"] += "\n.learning-cue{background:var(--gold)}\n"
        self.assertTrue(any(".learning-cue must use only" in e for e in self.errors(css=css)))

    def test_forced_colors_system_colours_are_allowed(self):
        css = dict(self.css)
        css["app/styles.css"] += "\n@media(forced-colors:active){.prompt{background:Canvas}.learning-cue{background:Canvas;color:CanvasText}}\n"
        self.assertEqual(self.errors(css=css), [])

    def test_cue_tokens_cannot_drift_from_learning_cue_policy(self):
        self.tokens["learning_cue"]["background"] = "#FFFFFF"
        self.assertTrue(any("learning_cue colours differ" in e for e in self.errors()))


if __name__ == "__main__":
    unittest.main()
