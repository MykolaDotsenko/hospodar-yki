#!/usr/bin/env python3
"""Design + pedagogy ↔ research traceability gate (docs/design/design-traceability-v1.json).

Every design / UX requirement ID defined in the canonical spec and design/UX research
must have an honest status:
  ENFORCED       — at least one evidence item; every evidence file exists AND contains the
                   quoted text (normally the exact test title), so a deleted or renamed
                   test breaks CI;
  PARTIAL        — evidence as above + a stated gap;
  NOT_YET        — a plan step;
  STUDY_NOT_RUN  — a plan for the human study (no product-effect claim);
  SUPERSEDED     — the newer rule that replaces it.
No ID may be missing or invented; open product decisions must be listed with options.

    python3 scripts/validate_design_traceability.py            # check (CI)
    python3 scripts/validate_design_traceability.py --report   # print coverage table
Static only: it proves that tests exist and are referenced, not that the design teaches better.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "docs/design/design-traceability-v1.json"
ID = re.compile(r"\b(R08-MOT-H\d{2}|R0[3-8]-H\d{2}|R04-T\d{2}|SD-H\d{2}|UX-I\d{2}|UX-S\d{2}|PSY-E\d{2}|IV2-AC-\d{2}|IV-AC-\d{2}|IV2-\d{2}|IV-\d{2}|EXV-\d{2}|A11Y-\d{2}|DESIGN-\d{2}a?|COLOR-\d{2}|UIO-\d{2}|UX-0[1-8]|SENS-\d{2}|MULTI-\d{2}|IV-REQ-\d{2}|A10-(?:0[1-9]|1[0-4])"
                r"|COG-\d{2}|PSY-\d{2}|MEM-\d{2}|FEED-\d{2}|ATT-\d{2}|AUD-\d{2}|MSUI-\d{2}|SND-\d{2}|GAM-\d{2}|GL-\d{2}|R(?:0[1-9]|1[0-2])(?!-\d)"
                r"|R[4-8]-\d{2}|R11-\d{2}|M3-\d{2}|SD-G\d{2}|QL-\d{2}|MOT-\d{2}"
                r"|EXAM-PILLAR-\d{2}|EXAM-\d{2}|LEARN-\d{2}|LE-\d{2}|YKI-FID-\d{2}|CURATED-\d{2}|MODE-\d{2}|MVP-\d{2}|PER-\d{2}|SIM-\d{2}|AC-\d{2}"
                r"|ARCH-\d{2}|C-\d{2}|REL-\d{2}|ANDR-\d{2}|WEB-\d{2}|UC-\d{2}|G-EX-\d{2}|UX-L\d{2}|RANGE-\d{2}|MEDIA-IMG-\d{2}|GRAM-TENSE-\d{2}|RIGHTS-\d{2})\b")
STATUSES = {"ENFORCED", "PARTIAL", "NOT_YET", "STUDY_NOT_RUN", "SUPERSEDED"}

# Completeness gate: an ID *defined* anywhere in docs/ or research/ (first table cell, list item or bold) must
# either be a traced requirement or belong to a family that is deliberately not a requirement (reason given).
DEFINITION = re.compile(r"(?:^(?:\|\s*|[-*]\s+|\d+\.\s+)\**`?|\*\*)([A-Z][A-Z0-9]{0,9}(?:-[A-Z0-9]{1,6})?-[A-Z]?[0-9]{2}[a-z]?)\b", re.M)
NOT_REQUIREMENTS = {
    r"(?:EV|VD|UIE)-\d{2}": "evidence-source rows (studies/standards cited), not requirements",
    r"R(?:0[1-9]|1[0-2])(?:-MOT)?-E\d{2}|MOT-E\d{2}": "evidence-source rows of the deep dossiers",
    r"R11-S\d{2}": "R11 evidence-source rows (ADR-024 owns REL-*)",
    r"SD-\d{2}": "design #19 evidence-source rows (its gates are SD-G*)",
    r"Q-\d{2}": "docs/QUALITY.md risk register (own status) and gameplay quest scenarios",
    r"A10-1[5-9]": "R10 cross-references to other research, not norms",
}
SCAN_GLOBS = ("docs/**/*.md", "research/**/*.md")


def scan_definitions(texts: dict[str, str], traced: set[str], sources: set[str]) -> list[str]:
    """Pure: texts = {repo-relative path: markdown}. Returns completeness errors."""
    errors: list[str] = []
    excluded = [re.compile(p) for p in NOT_REQUIREMENTS]
    for path, text in sorted(texts.items()):
        for m in sorted(set(DEFINITION.findall(text))):
            if ID.fullmatch(m):
                if m not in traced:
                    errors.append(f"{path} defines {m} but it is not in the matrix" + ("" if path in sources else " (file is not a listed source)"))
            elif not any(x.fullmatch(m) for x in excluded):
                errors.append(f"{path} defines {m}: untraced requirement family — add it to the matrix or to NOT_REQUIREMENTS with a reason")
    return errors


def repository_texts(root: Path = ROOT) -> dict[str, str]:
    out: dict[str, str] = {}
    for g in SCAN_GLOBS:
        for f in root.glob(g):
            rel = f.relative_to(root).as_posix()
            if "/history/" not in rel:
                out[rel] = f.read_text(encoding="utf-8")
    return out


def defined_ids(sources: list[str], root: Path = ROOT) -> set[str]:
    found: set[str] = set()
    for s in sources:
        found |= set(ID.findall((root / s).read_text(encoding="utf-8")))
    return found


def check(doc: dict, root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    if doc.get("schema") != "hospodar-design-traceability-v1":
        errors.append("schema must be hospodar-design-traceability-v1")
    reqs = doc.get("requirements", [])
    ids = [r.get("id") for r in reqs]
    dup = [i for i, n in Counter(ids).items() if n > 1]
    if dup:
        errors.append(f"duplicate ids: {dup}")
    expected = defined_ids(doc.get("sources", []), root)
    missing, extra = sorted(expected - set(ids)), sorted(set(ids) - expected)
    if missing:
        errors.append(f"requirements defined in sources but missing from the matrix: {missing}")
    if extra:
        errors.append(f"matrix ids not defined in any source: {extra}")
    for r in reqs:
        rid, st = r.get("id"), r.get("status")
        if st not in STATUSES:
            errors.append(f"{rid}: unknown status {st!r}"); continue
        if not str(r.get("summary", "")).strip():
            errors.append(f"{rid}: summary required")
        if r.get("source") not in doc.get("sources", []):
            errors.append(f"{rid}: source must be one of the listed sources")
        evidence = r.get("evidence", [])
        if st in ("ENFORCED", "PARTIAL"):
            if not evidence:
                errors.append(f"{rid}: {st} needs at least one evidence item")
            for e in evidence:
                path = root / e.get("file", "")
                if not path.is_file():
                    errors.append(f"{rid}: evidence file missing: {e.get('file')}")
                elif e.get("contains", "") not in path.read_text(encoding="utf-8") or not e.get("contains"):
                    errors.append(f"{rid}: evidence text not found in {e.get('file')}: {e.get('contains')!r}")
        elif evidence:
            errors.append(f"{rid}: {st} must not list evidence (use PARTIAL)")
        if st == "PARTIAL" and not r.get("gap"):
            errors.append(f"{rid}: PARTIAL needs a gap")
        if st in ("NOT_YET", "STUDY_NOT_RUN") and not r.get("plan"):
            errors.append(f"{rid}: {st} needs a plan")
        if st == "SUPERSEDED" and not r.get("superseded_by"):
            errors.append(f"{rid}: SUPERSEDED needs superseded_by")
    for d in doc.get("decisions", []):
        if d.get("status") not in ("OPEN", "DECIDED") or len(d.get("options", [])) < 2 or not d.get("question"):
            errors.append(f"{d.get('id')}: decision needs question, ≥2 options and OPEN/DECIDED status")
        if d.get("status") == "DECIDED" and not d.get("decided"):
            errors.append(f"{d.get('id')}: DECIDED needs the chosen option in 'decided'")
        for a in d.get("affects", []):
            if a not in ids:
                errors.append(f"{d.get('id')}: affects unknown requirement {a}")
    return errors


def summary(doc: dict) -> str:
    c = Counter(r["status"] for r in doc["requirements"])
    n = len(doc["requirements"])
    open_dec = sum(d["status"] == "OPEN" for d in doc.get("decisions", []))
    return (f"{n} design/UX/pedagogy requirements: ENFORCED {c['ENFORCED']} ({100 * c['ENFORCED'] // n} %), PARTIAL {c['PARTIAL']}, "
            f"NOT_YET {c['NOT_YET']}, STUDY_NOT_RUN {c['STUDY_NOT_RUN']}, SUPERSEDED {c['SUPERSEDED']}; open decisions {open_dec}")


def main(argv: list[str]) -> int:
    doc = json.loads(MATRIX.read_text(encoding="utf-8"))
    errors = check(doc) + scan_definitions(repository_texts(), {r["id"] for r in doc["requirements"]}, set(doc.get("sources", [])))
    if errors:
        print("FAIL design traceability:\n  " + "\n  ".join(errors)); return 1
    if "--report" in argv:
        for r in doc["requirements"]:
            print(f"{r['status']:<14} {r['id']:<10} {r['summary']}")
    print("PASS: " + summary(doc) + " (static: tests exist and are referenced; not a learning-effect claim)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
