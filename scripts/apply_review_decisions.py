#!/usr/bin/env python3
"""Apply an S2 reviewer's decisions file to the content (docs/29 stage 1, QL-01, CURATED, LE-13).

The file comes from the reviewer workspace in apps/web (`#review`, schema hospodar-review-decisions-v1). It is a human
decision; this script only carries it into the repository, all or nothing:

    python3 scripts/apply_review_decisions.py DECISIONS.json            # write review cards
    python3 scripts/apply_review_decisions.py DECISIONS.json --dry-run  # check only, write nothing

For every decision it requires that the file is a known content file, that exactly one item has the id, and that the
item's content hash is still the one the reviewer saw (an item edited after review must be reviewed again).
  * approve -> review_card status `s2_reviewed` with every field the publication gate needs; the item itself is not
    touched, so the card's content_hash is the reviewed one. Moving to `published` (and clearing the item's own
    pending markers) belongs to the release step, not to this script.
  * return  -> review_card status `draft` that records who returned it, when, the categories and the reason; the
    author fixes the item and it is reviewed again.
Afterwards the whole publication gate must pass, otherwise every file is restored byte for byte.
It cannot verify that the reviewer is a qualified S2 teacher: that stays a human/organisational check (docs/29 §8).
"""
from __future__ import annotations

import json
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_content_publication import (  # noqa: E402
    RETURN_CATEGORIES, REVIEWER_ID, SCHEMA as CARD_SCHEMA, card_errors, check, content_hash, items_with_id, load_files,
)

ROOT = Path(__file__).resolve().parents[1]
DECISIONS_SCHEMA = "hospodar-review-decisions-v1"
CONTENT_FILE = re.compile(r"^(learning/exercises|knowledge/dictionaries)/[A-Za-z0-9_./-]+\.json$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
HASH = re.compile(r"^sha256:[0-9a-f]{64}$")
APPROVAL_FIELDS = ("level", "skills", "communicative_outcome_uk", "source", "answer_variants_reviewed",
                   "transcript_reviewed", "content_version")


def card_from(d: dict, current_hash: str) -> dict:
    rev = {"reviewer_role": "S2_teacher", "reviewer_id": d.get("reviewer_id"), "reviewed_at": d.get("reviewed_at")}
    if d.get("decision") == "return":
        rev.update(decision="returned", return_categories=d.get("return_categories"), reason_uk=d.get("reason_uk"))
        return {"schema": CARD_SCHEMA, "status": "draft", "s2_review": rev, "content_hash": current_hash}
    a = d.get("approval") or {}
    card = {"schema": CARD_SCHEMA, "status": "s2_reviewed", **{k: a.get(k) for k in APPROVAL_FIELDS}}
    card["s2_review"] = {"decision": "approved", **rev}
    card["content_hash"] = current_hash
    return card


def plan(decisions_doc: dict, files: dict[str, object]) -> tuple[list[str], list[tuple[str, dict, dict]]]:
    """Validate everything first; return (errors, [(file, item, new_card)]). Nothing is written here."""
    errors: list[str] = []
    changes: list[tuple[str, dict, dict]] = []
    if not isinstance(decisions_doc, dict) or decisions_doc.get("schema") != DECISIONS_SCHEMA:
        return [f"not a {DECISIONS_SCHEMA} file"], []
    decisions = decisions_doc.get("decisions")
    if not isinstance(decisions, list) or not decisions:
        return ["the file has no decisions"], []
    seen = set()
    for i, d in enumerate(decisions):
        label = f"decision {i + 1}"
        if not isinstance(d, dict):
            errors.append(f"{label}: not an object"); continue
        f, item_id = str(d.get("file", "")), str(d.get("item_id", ""))
        label = f"{f} {item_id}"
        if (f, item_id) in seen:
            errors.append(f"{label}: two decisions for the same item"); continue
        seen.add((f, item_id))
        if not CONTENT_FILE.match(f) or ".." in f or f not in files:
            errors.append(f"{label}: unknown content file"); continue
        if d.get("decision") not in ("approve", "return"):
            errors.append(f"{label}: decision must be approve or return"); continue
        if not REVIEWER_ID.fullmatch(str(d.get("reviewer_id", ""))) or ".." in str(d.get("reviewer_id", "")):
            errors.append(f"{label}: reviewer_id must be a pseudonymous id"); continue
        if not DATE.match(str(d.get("reviewed_at", ""))):
            errors.append(f"{label}: reviewed_at must be YYYY-MM-DD"); continue
        if not HASH.match(str(d.get("content_hash", ""))):
            errors.append(f"{label}: content_hash missing"); continue
        hits = items_with_id(files[f], item_id)
        if len(hits) != 1:
            errors.append(f"{label}: {len(hits)} items have this id/lesson_id/task_id (need exactly one)"); continue
        item = hits[0]
        current = content_hash(item)
        if current != d["content_hash"]:
            errors.append(f"{label}: the item changed after the reviewer saw it — review it again"); continue
        if d["decision"] == "return":
            cats = d.get("return_categories")
            if not isinstance(cats, list) or not cats or not set(cats) <= RETURN_CATEGORIES:
                errors.append(f"{label}: return needs return_categories"); continue
            if not isinstance(d.get("reason_uk"), str) or len(d["reason_uk"].strip()) < 10:
                errors.append(f"{label}: return needs reason_uk (what to fix)"); continue
        card = card_from(d, current)
        problems = card_errors({**item, "review_card": card})
        if problems:
            errors.extend(f"{label}: {p}" for p in problems); continue
        changes.append((f, item, card))
    return errors, changes


def dump(data) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def write_atomic(path: Path, text: str) -> None:
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def apply(decisions_doc: dict, root: Path = ROOT, dry_run: bool = False) -> tuple[list[str], str]:
    files = load_files() if root == ROOT else {
        str(p.relative_to(root)): json.loads(p.read_text(encoding="utf-8"))
        for g in ("learning/exercises/**/*.json", "knowledge/dictionaries/**/*.json") for p in sorted(root.glob(g))}
    errors, changes = plan(decisions_doc, files)
    if errors:
        return errors, "nothing written"
    approved = sum(c["status"] == "s2_reviewed" for _, _, c in changes)
    summary = f"{len(changes)} decisions: {approved} approved (s2_reviewed), {len(changes) - approved} returned"
    if dry_run:
        return [], summary + " — dry run, nothing written"
    touched = sorted({f for f, _, _ in changes})
    originals = {f: (root / f).read_bytes() for f in touched}
    for f, item, card in changes:
        item["review_card"] = card
    try:
        for f in touched:
            write_atomic(root / f, dump(files[f]))
        gate_errors, _ = check(files)
        if gate_errors:
            raise RuntimeError("publication gate failed after applying: " + "; ".join(gate_errors[:5]))
    except Exception as exc:                                  # restore every touched file exactly
        for f, raw in originals.items():
            (root / f).write_bytes(raw)
        return [str(exc)], "restored original files"
    return [], summary + f" — written to {len(touched)} file(s); run the content validators and commit"


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 1:
        print(__doc__.split("\n\n")[1]); return 2
    try:
        doc = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"FAIL cannot read decisions file: {exc}"); return 2
    errors, summary = apply(doc, dry_run="--dry-run" in argv)
    if errors:
        print("FAIL review decisions not applied (" + summary + "):\n  " + "\n  ".join(errors)); return 1
    print("PASS " + summary)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
