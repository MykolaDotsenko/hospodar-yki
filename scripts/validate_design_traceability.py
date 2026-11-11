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

The matrix also carries `methods`: one honest status for EVERY method of the canonical registry
(research/pedagogy/learning-methods-v1.json) — ENFORCED / PARTIAL / NOT_YET / EXCLUDED — so research on
learning effectiveness cannot silently stay unused. `--next` prints what an AI agent should build next.

    python3 scripts/validate_design_traceability.py            # check (CI)
    python3 scripts/validate_design_traceability.py --report   # print coverage table
    python3 scripts/validate_design_traceability.py --next     # research not yet used: what to build next
    python3 scripts/validate_design_traceability.py --human    # work only people can do: S2 review, audio, raters, studies
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
ID = re.compile(r"\b(YTP-\d{2}|V3-AC-\d{2}|IV4-AC-\d{2}|V5-AC-\d{2}|MOCK-VID-\d{2}|R10-\d{2}|R-L\d{2}|E0[3567]-G\d{2}|R08-MOT-H\d{2}|R0[3-8]-H\d{2}|R04-T\d{2}|SD-H\d{2}|UX-I\d{2}|UX-S\d{2}|PSY-E\d{2}|IV2-AC-\d{2}|IV-AC-\d{2}|IV2-\d{2}|IV-\d{2}|EXV-\d{2}|A11Y-\d{2}|DESIGN-\d{2}a?|COLOR-\d{2}|UIO-\d{2}|UX-0[1-8]|SENS-\d{2}|MULTI-\d{2}|IV-REQ-\d{2}|A10-(?:0[1-9]|1[0-4])"
                r"|COG-\d{2}|PSY-\d{2}|MEM-\d{2}|FEED-\d{2}|ATT-\d{2}|AUD-\d{2}|MSUI-\d{2}|SND-\d{2}|GAM-\d{2}|GL-\d{2}|R(?:0[1-9]|1[0-2])(?!-\d)"
                r"|R[4-8]-\d{2}|R11-\d{2}|M3-\d{2}|SD-G\d{2}|QL-\d{2}|MOT-\d{2}"
                r"|TZ-EXAM-\d{2}|EXAM-PILLAR-\d{2}|EXAM-\d{2}|LEARN-\d{2}|LE-\d{2}|YKI-FID-\d{2}|CURATED-\d{2}|MODE-\d{2}|MVP-\d{2}|PER-\d{2}|SIM-\d{2}|AC-\d{2}"
                r"|ARCH-\d{2}|C-\d{2}|REL-\d{2}|ANDR-\d{2}|WEB-\d{2}|UC-\d{2}|G-EX-\d{2}|UX-L\d{2}|RANGE-\d{2}|MEDIA-IMG-\d{2}|GRAM-TENSE-\d{2}|RIGHTS-\d{2})\b")
STATUSES = {"ENFORCED", "PARTIAL", "NOT_YET", "STUDY_NOT_RUN", "SUPERSEDED"}

# Completeness gate: an ID *defined* anywhere in docs/ or research/ (first table cell, list item or bold) must
# either be a traced requirement or belong to a family that is deliberately not a requirement (reason given).
_IDSHAPE = r"[A-Z][A-Z0-9]{0,9}(?:-[A-Z0-9]{1,6})?-[A-Z]?[0-9]{2}[a-z]?"
DEFINITION = re.compile(
    r"(?:^(?:\|\s*|[-*]\s+|\d+\.\s+)\**`?|\*\*(?:[A-Z][a-z]+ )?|`)(" + _IDSHAPE + r")\b"      # cell, list, bold (opt. leading word), code
    r"|\b(" + _IDSHAPE + r")\s*(?:…|\.\.\.?)\s*(?:[A-Z][A-Z0-9-]*-)?[A-Z]?[0-9]{2}\b"          # declared range X-01…X-12 / X-01..12
    r"|\"id\"\s*:\s*\"(" + _IDSHAPE + r")\"", re.M)                                             # JSON "id": "X-01"
NOT_REQUIREMENTS = {
    r"(?:EV|VD|UIE)-\d{2}": "evidence-source rows (studies/standards cited), not requirements",
    r"R(?:0[1-9]|1[0-2])(?:-MOT)?-E\d{2}|MOT-E\d{2}": "evidence-source rows of the deep dossiers",
    r"R11-S\d{2}": "R11 evidence-source rows (ADR-024 owns REL-*)",
    r"SD-\d{2}": "design #19 evidence-source rows (its gates are SD-G*)",
    r"Q-\d{2}": "docs/QUALITY.md risk register (own status) and gameplay quest scenarios",
    r"A10-1[5-9]": "R10 cross-references to other research, not norms",
    r"ARC-\d{2}": "machine acceptance-test IDs mirroring ARCH-01…14 (traced as ARCH-*); NOTE their JSON statuses are stale",
    r"R05-S\d{2}": "R05 audio material candidates (sources), not requirements",
    r"E0[467]-R\d{2}": "E04/E06/E07 risk registers with their own mitigation status",
    r"UTF-\d{2}": "character-encoding names (UTF-16), not requirements",
    r"DEC-\d{2}": "product decisions, tracked in the matrix 'decisions' section",
    r"(?:OPH|MIGRI|YLE|KIELI|RESEARCH|OTAVA|FINN|SUOMI|OPE|NIKONEN|LEXIE|JYU|HAAGA|GIMARA)-\d{2}": "source-catalogue IDs in sources/learning",
    r"[A-Z]+-B1-\d{2}|PUHEKIELI-\d{2}": "content item IDs (missions such as HOUSING-B1-01, PUHEKIELI-01)",
    r"R02-\d{2}": "R02 audit finding headings (findings, not requirements)",
    r"([A-Z])\d{2}-\1\d{2}": "code ranges such as R06-R10, T01-T09, F01-F06 (span, not an ID)",
    r"[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-20\d\d(?:-\d{2})?": "dated document/file names (…-2026-10)",
}
SCAN_GLOBS = ("docs/**/*.md", "research/**/*.md", "research/**/*.json", "sources/**/*.md")


def scan_definitions(texts: dict[str, str], traced: set[str], sources: set[str]) -> list[str]:
    """Pure: texts = {repo-relative path: markdown}. Returns completeness errors."""
    errors: list[str] = []
    excluded = [re.compile(p) for p in NOT_REQUIREMENTS]
    for path, text in sorted(texts.items()):
        for m in sorted({x for groups in DEFINITION.findall(text) for x in groups if x}):
            if ID.fullmatch(m):
                if m not in traced:
                    errors.append(f"{path} defines {m} but it is not in the matrix" + ("" if path in sources else " (file is not a listed source)"))
            elif not any(x.fullmatch(m) for x in excluded):
                errors.append(f"{path} defines {m}: untraced requirement family — add it to the matrix or to NOT_REQUIREMENTS with a reason")
    return errors


MENTION = re.compile(r"\b(" + _IDSHAPE + r")\b")


def scan_mentions(texts: dict[str, str], traced: set[str]) -> list[str]:
    """Full-text mode: every ID-shaped token anywhere (even once in prose) must be traced or a listed non-requirement."""
    excluded = [re.compile(p) for p in NOT_REQUIREMENTS]
    errors: list[str] = []
    for path, text in sorted(texts.items()):
        for m in sorted(set(MENTION.findall(text))):
            if m in traced or any(x.fullmatch(m) for x in excluded):
                continue
            errors.append(f"{path} mentions {m}: neither a traced requirement nor a listed non-requirement family")
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


METHOD_STATUSES = {"ENFORCED", "PARTIAL", "NOT_YET", "EXCLUDED"}
BLOCKERS = {"S2_REVIEW", "LICENSED_HUMAN_AUDIO", "HUMAN_RATERS_OR_STUDY", "OTHER_LEARNERS_OR_TEACHER"}
EXAM_FAMILIES = re.compile(r"^(TZ-EXAM|EXAM(-PILLAR)?|EXV|YKI-FID|SIM|G-EX|E0[3567]-G|MOCK-VID)-?\d")
CONTENT_GLOBS = ("learning/exercises/**/*.json", "knowledge/dictionaries/**/*.json")
CONTENT_USERS = ("apps/web/src/content/*.ts", "app/*.mjs", "app/*.html")


def check_methods(doc: dict, registry: list[dict], root: Path = ROOT) -> list[str]:
    """Every registry method has exactly one honest implementation status with checkable evidence."""
    errors: list[str] = []
    rows = doc.get("methods", [])
    ids, reg = [m.get("id") for m in rows], [m["id"] for m in registry]
    if len(set(ids)) != len(ids):
        errors.append(f"methods: duplicate ids {[i for i, n in Counter(ids).items() if n > 1]}")
    if sorted(set(reg) - set(ids)):
        errors.append(f"methods in the registry without an implementation status: {sorted(set(reg) - set(ids))}")
    if sorted(set(ids) - set(reg)):
        errors.append(f"methods not in the canonical registry: {sorted(set(ids) - set(reg))}")
    for m in rows:
        mid, st, evidence = m.get("id"), m.get("status"), m.get("evidence", [])
        if st not in METHOD_STATUSES:
            errors.append(f"method {mid}: unknown status {st!r}"); continue
        if st in ("ENFORCED", "PARTIAL"):
            if not evidence:
                errors.append(f"method {mid}: {st} needs at least one evidence item")
            for e in evidence:
                path = root / e.get("file", "")
                if not path.is_file():
                    errors.append(f"method {mid}: evidence file missing: {e.get('file')}")
                elif not e.get("contains") or e["contains"] not in path.read_text(encoding="utf-8"):
                    errors.append(f"method {mid}: evidence text not found in {e.get('file')}: {e.get('contains')!r}")
        elif evidence:
            errors.append(f"method {mid}: {st} must not list evidence (use PARTIAL)")
        if st == "PARTIAL" and not m.get("gap"):
            errors.append(f"method {mid}: PARTIAL needs a gap")
        if st == "NOT_YET" and not m.get("plan"):
            errors.append(f"method {mid}: NOT_YET needs a plan")
        if st == "EXCLUDED" and not m.get("reason"):
            errors.append(f"method {mid}: EXCLUDED needs a reason")
        if "blocked_by" in m and (m["blocked_by"] not in BLOCKERS or st not in ("PARTIAL", "NOT_YET")):
            errors.append(f"method {mid}: blocked_by must be one of {sorted(BLOCKERS)} on a PARTIAL/NOT_YET method")
    return errors


def unused_content(root: Path = ROOT) -> list[str]:
    """Authored exercise/dictionary JSON that no app loads (report only: some files are indexes or drafts)."""
    users = "".join(f.read_text(encoding="utf-8") for g in CONTENT_USERS for f in root.glob(g))
    def loaded(f: Path) -> bool:                                   # by file name, or by an import.meta.glob of its folder
        return f"{f.parent.name}/{f.name}" in users or f"{f.parent.name}/*.json" in users
    return sorted(f.relative_to(root).as_posix() for g in CONTENT_GLOBS for f in root.glob(g)
                  if not loaded(f) and f.name not in ("index.json", "available.json"))


def next_steps(doc: dict, registry: list[dict], root: Path = ROOT) -> str:
    """What research is not (fully) used yet, most valuable first. For humans and AI agents before LEARN/EXAM work."""
    reg = {m["id"]: m for m in registry}
    order = {"P0": 0, "P1": 1, "P2": 2}
    open_rows = [m for m in doc.get("methods", []) if m["status"] in ("PARTIAL", "NOT_YET") and reg[m["id"]]["priority"] in order]
    open_rows.sort(key=lambda m: (order[reg[m["id"]]["priority"]], -reg[m["id"]]["score"], m["id"]))
    def line(m: dict) -> str:
        r = reg[m["id"]]
        return f"  {r['priority']} {r['score']:>3} {m['status']:<8} {m['id']}: {m.get('gap') or m.get('plan')}"
    free = [m for m in open_rows if "blocked_by" not in m]
    out = [f"LEARN methods buildable now, no human dependency ({len(free)}):"] + [line(m) for m in free]
    for b in sorted(BLOCKERS):
        rows = [m for m in open_rows if m.get("blocked_by") == b]
        if rows:
            out += [f"LEARN methods waiting for {b} ({len(rows)}):"] + [line(m) for m in rows]
    exam = [r for r in doc["requirements"] if EXAM_FAMILIES.match(r["id"]) and r["status"] in ("PARTIAL", "NOT_YET")]
    out += [f"EXAM simulator requirements not fully met ({len(exam)}):"] + [
        f"  {r['status']:<8} {r['id']}: {r.get('gap') or r.get('plan')}" for r in exam]
    files = unused_content(root)
    out += [f"Authored content no app loads ({len(files)}):"] + [f"  {f}" for f in files]
    c = Counter(m["status"] for m in doc.get("methods", []))
    out.append(f"Methods: ENFORCED {c['ENFORCED']}, PARTIAL {c['PARTIAL']}, NOT_YET {c['NOT_YET']}, EXCLUDED {c['EXCLUDED']} of {len(registry)}. "
               "ENFORCED means a test guards the rule, not a measured learning effect.")
    return "\n".join(out)


HUMAN_GATE = re.compile(r"\bS2\b|human|manual|reviewer|rater|consent|legal|recording|walkthrough", re.I)


def loaded_content(root: Path = ROOT) -> list[tuple[str, int]]:
    """Exercise/dictionary JSON that learners can already meet, with its item count (all of it is S2-pending today)."""
    unused, out = set(unused_content(root)), []
    for g in CONTENT_GLOBS:
        for f in sorted(root.glob(g)):
            rel = f.relative_to(root).as_posix()
            if rel in unused or f.name in ("index.json", "available.json"):
                continue
            data = json.loads(f.read_text(encoding="utf-8"))
            rows = next((v for k, v in data.items() if k in ("items", "lessons", "exercises") and isinstance(v, list)), None) if isinstance(data, dict) else None
            if rows is None and isinstance(data, dict):                       # e.g. a theme file: reading + speaking + writing + chunks
                rows = [x for v in data.values() if isinstance(v, list) for x in v] or [data]
            out.append((rel, len(rows) if rows is not None else 1))
    return sorted(out, key=lambda x: -x[1])


def human_queue(doc: dict, registry: list[dict], root: Path = ROOT) -> str:
    """Everything code cannot close. The product cannot be called effective before these are done (docs/28, R12)."""
    reg = {m["id"]: m for m in registry}
    content = loaded_content(root)
    out = [f"1. S2 teacher review — content learners already see, none approved yet ({sum(n for _, n in content)} items in {len(content)} files):"]
    out += [f"   {n:>4}  {f}" for f, n in content]
    labels = {"S2_REVIEW": "2. Methods that need S2-reviewed or licensed content",
              "LICENSED_HUMAN_AUDIO": "3. Methods that need licensed recordings of several human Finnish speakers",
              "HUMAN_RATERS_OR_STUDY": "4. Methods that need calibrated human raters",
              "OTHER_LEARNERS_OR_TEACHER": "5. Methods that need a partner or teacher"}
    for b, label in labels.items():
        rows = sorted((m for m in doc.get("methods", []) if m.get("blocked_by") == b), key=lambda m: -reg[m["id"]]["score"])
        out += [f"{label} ({len(rows)}):"] + [f"   {reg[m['id']]['priority']} {reg[m['id']]['score']:>3} {m['id']}: {m.get('gap') or m.get('plan')}" for m in rows]
    exam = [r for r in doc["requirements"] if EXAM_FAMILIES.match(r["id"]) and r["status"] in ("PARTIAL", "NOT_YET")
            and HUMAN_GATE.search(str(r.get("gap") or r.get("plan")))]
    out += [f"6. EXAM simulator gates that need a person ({len(exam)}):"] + [f"   {r['id']}: {r.get('gap') or r.get('plan')}" for r in exam]
    studies = [r for r in doc["requirements"] if r["status"] == "STUDY_NOT_RUN"]
    out += [f"7. Human studies not run: {len(studies)}. Until a consented, equal-time study with blind S2 scoring on day 14/30 exists, "
            "no claim of better learning than competitors is allowed (R12, docs/28)."]
    return "\n".join(out)


def summary(doc: dict) -> str:
    c = Counter(r["status"] for r in doc["requirements"])
    n = len(doc["requirements"])
    open_dec = sum(d["status"] == "OPEN" for d in doc.get("decisions", []))
    m = Counter(x["status"] for x in doc.get("methods", []))
    return (f"{n} design/UX/pedagogy requirements: ENFORCED {c['ENFORCED']} ({100 * c['ENFORCED'] // n} %), PARTIAL {c['PARTIAL']}, "
            f"NOT_YET {c['NOT_YET']}, STUDY_NOT_RUN {c['STUDY_NOT_RUN']}, SUPERSEDED {c['SUPERSEDED']}; open decisions {open_dec}; "
            f"{sum(m.values())} learning methods: ENFORCED {m['ENFORCED']}, PARTIAL {m['PARTIAL']}, NOT_YET {m['NOT_YET']}, EXCLUDED {m['EXCLUDED']}")


def main(argv: list[str]) -> int:
    doc = json.loads(MATRIX.read_text(encoding="utf-8"))
    texts, traced = repository_texts(), {r["id"] for r in doc["requirements"]}
    registry = json.loads((ROOT / doc.get("method_registry", "research/pedagogy/learning-methods-v1.json")).read_text(encoding="utf-8"))["methods"]
    errors = check(doc) + check_methods(doc, registry) + scan_definitions(texts, traced, set(doc.get("sources", [])))
    errors += [e for e in scan_mentions(texts, traced) if not any(e.split(" mentions ")[1].split(":")[0] in x for x in errors)]
    if errors:
        print("FAIL design traceability:\n  " + "\n  ".join(errors)); return 1
    if "--next" in argv:
        print(next_steps(doc, registry)); return 0
    if "--human" in argv:
        print(human_queue(doc, registry)); return 0
    if "--report" in argv:
        for r in doc["requirements"]:
            print(f"{r['status']:<14} {r['id']:<10} {r['summary']}")
    print("PASS: " + summary(doc) + " (static: tests exist and are referenced; not a learning-effect claim)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
