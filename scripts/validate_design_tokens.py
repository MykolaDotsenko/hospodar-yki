#!/usr/bin/env python3
"""Design tokens: brand/tokens.json is the single source of truth for app colours.

    python3 scripts/validate_design_tokens.py          # check (CI)
    python3 scripts/validate_design_tokens.py --write  # regenerate app/tokens.css

Checks (STATIC only — no rendered-screen, screen-reader or device verification):
  1. app/tokens.css is byte-identical to what tokens.json generates.
  2. app/*.css contain no raw hex colours outside the generated file
     (box-shadow declarations are the only exception: decorative, non-semantic).
  3. Every var(--…) used in app CSS is defined by the generated file.
  4. Every declared contrast pair meets its WCAG 2.2 minimum.
  5. DESIGN-01a colour roles: reading surfaces never get a saturated fill, and the
     learning cue only uses the feedback-cue tokens.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = ROOT / "brand/tokens.json"
GENERATED = ROOT / "app/tokens.css"
APP_CSS = ("app/styles.css", "app/exam.css")
SYSTEM_COLOURS = {"Canvas", "Field", "ButtonFace", "transparent", "inherit", "none"}
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
HEADER = ("/* GENERATED from brand/tokens.json by scripts/validate_design_tokens.py --write.\n"
          "   Do not edit by hand: change brand/tokens.json and regenerate. */\n")


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}", h):
        raise ValueError(f"expected six-digit hex colour, got {hex_color!r}")
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    rgb = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb]
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]


def contrast(a: str, b: str) -> float:
    lo, hi = sorted((luminance(a), luminance(b)))
    return (hi + 0.05) / (lo + 0.05)


def render_css(tokens: dict) -> str:
    colors, mapping = tokens["colors"], tokens["css_custom_properties"]
    lines = [HEADER, ":root{"]
    for role, prop in mapping.items():
        lines.append(f"  {prop}:{colors[role]};")
    for name, value in tokens["spacing"].items():
        lines.append(f"  --space-{name}:{value}px;")
    for name, value in tokens["radius"].items():
        lines.append(f"  --radius-{name}:{value}px;")
    lines.append(f"  --motion-micro:{tokens['motion']['micro_ms']}ms;")
    lines.append(f"  --motion-max:{tokens['motion']['max_ms']}ms;")
    lines.append("}")
    return "\n".join(lines) + "\n"


def strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def declarations(css: str, selector: str) -> list[str]:
    """Declaration blocks of rules whose selector list contains `selector` exactly."""
    found = []
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", strip_comments(css)):
        if selector in [s.strip() for s in sel.split(",")]:
            found.append(body)
    return found


def check(tokens: dict, generated: str, css_files: dict[str, str]) -> list[str]:
    errors: list[str] = []
    colors, mapping = tokens["colors"], tokens["css_custom_properties"]
    for role in mapping:
        if role not in colors:
            errors.append(f"css_custom_properties maps unknown colour role {role!r}")
    if errors:
        return errors
    if generated != render_css(tokens):
        errors.append("app/tokens.css is stale: run python3 scripts/validate_design_tokens.py --write")

    # Linked derived values must not drift from the colour palette.
    if tokens["learning_cue"]["background"] != colors["cue_background"] or \
       tokens["learning_cue"]["text"] != colors["cue_text"]:
        errors.append("learning_cue colours differ from colors.cue_background/cue_text")
    for mode, role in (("learn", "forest"), ("exam", "primary")):
        if tokens["mode_identity"][mode]["accent"] != colors[role]:
            errors.append(f"mode_identity.{mode}.accent differs from colors.{role}")

    defined = set(mapping.values()) | {f"--space-{k}" for k in tokens["spacing"]} | \
        {f"--radius-{k}" for k in tokens["radius"]} | {"--motion-micro", "--motion-max"}
    for name, css in css_files.items():
        body = strip_comments(css)
        if not body.lstrip().startswith('@import url("./tokens.css")') and name == "app/styles.css":
            errors.append("app/styles.css must start with @import url(\"./tokens.css\")")
        without_shadows = re.sub(r"box-shadow:[^;}]*", "", body)
        for raw in HEX.findall(without_shadows):
            errors.append(f"{name}: raw colour {raw} — use a token from brand/tokens.json")
        for used in sorted(set(re.findall(r"var\((--[a-z0-9-]+)", body))):
            if used not in defined:
                errors.append(f"{name}: var({used}) is not defined by brand/tokens.json")

    for pair in tokens["contrast_pairs"]:
        try:
            value = contrast(colors[pair["fg"]], colors[pair["bg"]])
        except KeyError as missing:
            errors.append(f"contrast pair uses unknown colour {missing}")
            continue
        if value < pair["min"]:
            errors.append(f"contrast {pair['fg']} on {pair['bg']} = {value:.2f} < {pair['min']} ({pair['use']})")

    roles = tokens["color_roles"]
    surface_props = {mapping[r] for r in roles["reading_surface"]["tokens"]}
    accent_props = {mapping[r] for r in roles["accent_layer"]["tokens"]}
    all_css = "\n".join(css_files.values())
    for selector in roles["reading_surface"]["css_selectors"]:
        blocks = declarations(all_css, selector)
        if not blocks:
            errors.append(f"reading-surface selector {selector} not found in app CSS")
        for block in blocks:
            for prop, value in re.findall(r"(background(?:-color)?)\s*:\s*([^;]+)", block):
                used = set(re.findall(r"var\((--[a-z0-9-]+)\)", value))
                system = value.strip().split()[0] in SYSTEM_COLOURS
                if not system and (not used or not used <= surface_props):
                    errors.append(f"{selector}: {prop}:{value.strip()} — reading surfaces must use calm "
                                  f"surface tokens {sorted(surface_props)} (DESIGN-01a / COLOR-06)")
                if used & accent_props:
                    errors.append(f"{selector}: saturated accent fill behind Finnish text is forbidden")
    cue_props = {mapping[r] for r in roles["feedback_cue"]["tokens"]}
    for selector in roles["feedback_cue"]["css_selectors"]:
        for block in declarations(all_css, selector):
            used = set(re.findall(r"var\((--[a-z0-9-]+)\)", block))
            if not used <= cue_props:  # system colours (forced-colors: Canvas/CanvasText) allowed
                errors.append(f"{selector} must use only feedback-cue tokens {sorted(cue_props)}")
    if tokens["learning_cue"]["allowed_phases"] != roles["feedback_cue"]["phases"]:
        errors.append("color_roles.feedback_cue.phases must equal learning_cue.allowed_phases")
    return errors


def main(argv: list[str]) -> int:
    tokens = json.loads(TOKENS.read_text(encoding="utf-8"))
    if "--write" in argv:
        GENERATED.write_text(render_css(tokens), encoding="utf-8")
        print(f"wrote {GENERATED.relative_to(ROOT)}")
    generated = GENERATED.read_text(encoding="utf-8") if GENERATED.is_file() else ""
    css_files = {p: (ROOT / p).read_text(encoding="utf-8") for p in APP_CSS}
    errors = check(tokens, generated, css_files)
    if errors:
        print("FAIL design tokens:\n  " + "\n  ".join(errors))
        return 1
    print(f"PASS: app CSS colours come only from brand/tokens.json; {len(tokens['contrast_pairs'])} "
          "contrast pairs meet WCAG 2.2 minimums; reading surfaces stay calm (static check only)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
