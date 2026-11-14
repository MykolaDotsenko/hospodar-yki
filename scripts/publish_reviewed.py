#!/usr/bin/env python3
"""Publish S2-approved content: review_card `s2_reviewed` -> `published` (docs/29 stage 1, QL-01, GL-01).

Publishing is the release decision taken by the editor/owner after a human S2 approval. Only a `published` item
reaches learners in a release build (apps/web, VITE_HOSPODAR_CHANNEL=release).

    python3 scripts/publish_reviewed.py --dry-run           # what would be published, and what cannot be
    python3 scripts/publish_reviewed.py                     # publish every eligible s2_reviewed item
    python3 scripts/publish_reviewed.py FILE#ID [FILE#ID…]  # publish exactly these (all or nothing)

An item is eligible when its card is `s2_reviewed` and the item's hash is still the reviewed one. Publishing then
  * turns the item's own pending review markers into their approved value (teacher_review -> approved,
    linguistic_review / quality_status -> s2_approved, review_status / meaning_review_status -> approved_S2,
    answerKeyReviewed -> true with an approved R08 review_status) — these markers are not part of the hash, so the
    card still certifies exactly what the reviewer saw;
  * sets the card status to `published`.
It refuses an item that still says something no review can lift (e.g. audio_status=script_only…,
scoring_status=NOT_VALID…): that needs a recording or an editorial change, then a new review.
Afterwards the whole publication gate must pass, otherwise every file is restored byte for byte.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_review_decisions import dump, write_atomic  # noqa: E402
from validate_content_publication import (  # noqa: E402
    BLOCKING_VALUES, REVIEW_MARKER_KEYS, card_errors, check, content_hash, items_with_id, load_files,
)

ROOT = Path(__file__).resolve().parents[1]
APPROVED_VALUE = {"teacher_review": "approved", "teacher_audio_review": "approved", "linguistic_review": "s2_approved",
                  "quality_status": "s2_approved", "review_status": "approved_S2", "meaning_review_status": "approved_S2"}
assert set(APPROVED_VALUE) | {"answerKeyReviewed"} == set(REVIEW_MARKER_KEYS)


def published_copy(item: dict) -> dict:
    """The item as it will be stored once published (markers approved, card published)."""
    out = dict(item)
    for k, v in item.items():
        if k in APPROVED_VALUE and isinstance(v, str) and BLOCKING_VALUES.search(v):
            out[k] = APPROVED_VALUE[k]
    if "answerKeyReviewed" in out and out.get("review_status") == "approved_S2":
        out["answerKeyReviewed"] = True
    out["review_card"] = {**item["review_card"], "status": "published"}
    return out


def why_not(item: dict) -> str | None:
    card = item.get("review_card")
    if not isinstance(card, dict) or card.get("status") != "s2_reviewed":
        return "no s2_reviewed card"
    if card.get("content_hash") != content_hash(item):
        return "changed after the S2 review — review it again"
    candidate = published_copy(item)
    blockers = [f"{k}={v!r}" for k, v in candidate.items()
                if k != "review_card" and ("review" in k or "status" in k) and isinstance(v, str) and BLOCKING_VALUES.search(v)]
    if blockers:
        return "still says " + ", ".join(blockers) + " (needs a recording or an editorial change, then a new review)"
    problems = card_errors(candidate)
    return "; ".join(problems) if problems else None


def candidates(files: dict[str, object]) -> list[tuple[str, dict]]:
    out: list[tuple[str, dict]] = []

    def walk(node, f):
        if isinstance(node, dict):
            if isinstance(node.get("review_card"), dict) and node["review_card"].get("status") == "s2_reviewed":
                out.append((f, node))
            for k, v in node.items():
                if k != "review_card":
                    walk(v, f)
        elif isinstance(node, list):
            for v in node:
                walk(v, f)
    for f, data in files.items():
        walk(data, f)
    return out


def item_id(item: dict) -> str:
    return str(item.get("id") or item.get("lesson_id") or item.get("task_id") or "?")


def publish(selected: list[str] | None, root: Path = ROOT, dry_run: bool = False) -> tuple[list[str], list[str], str]:
    """Returns (errors, skipped-with-reasons, summary)."""
    files = load_files() if root == ROOT else {
        str(p.relative_to(root)): json.loads(p.read_text(encoding="utf-8"))
        for g in ("learning/exercises/**/*.json", "knowledge/dictionaries/**/*.json") for p in sorted(root.glob(g))}
    errors: list[str] = []
    chosen: list[tuple[str, dict]] = []
    before, _ = check(files)
    if before:                                    # e.g. a reviewed item edited without a new review: fix that first
        stale = [f"{f}#{item_id(it)}: {why_not(it)}" for f, it in candidates(files) if why_not(it)]
        return ["publication gate already fails — nothing published: " + "; ".join(before[:5])], stale, "nothing written"
    if selected:
        for ref in selected:
            f, _, iid = ref.partition("#")
            hits = items_with_id(files[f], iid) if f in files else []
            if len(hits) != 1:
                errors.append(f"{ref}: {len(hits)} items with this id in a known content file (need exactly one)")
                continue
            reason = why_not(hits[0])
            if reason:
                errors.append(f"{ref}: {reason}")
            else:
                chosen.append((f, hits[0]))
        if errors:
            return errors, [], "nothing written"
        skipped: list[str] = []
    else:
        skipped = []
        for f, it in candidates(files):
            reason = why_not(it)
            (skipped.append(f"{f}#{item_id(it)}: {reason}") if reason else chosen.append((f, it)))
    summary = f"{len(chosen)} item(s) to publish, {len(skipped)} s2_reviewed item(s) not eligible"
    if dry_run or not chosen:
        return [], skipped, summary + (" — dry run, nothing written" if dry_run else " — nothing to write")
    touched = sorted({f for f, _ in chosen})
    originals = {f: (root / f).read_bytes() for f in touched}
    for _, it in chosen:
        new = published_copy(it)
        it.clear()
        it.update(new)
    try:
        for f in touched:
            write_atomic(root / f, dump(files[f]))
        gate_errors, _ = check(files)
        if gate_errors:
            raise RuntimeError("publication gate failed after publishing: " + "; ".join(gate_errors[:5]))
    except Exception as exc:
        for f, raw in originals.items():
            (root / f).write_bytes(raw)
        return [str(exc)], skipped, "restored original files"
    return [], skipped, summary + f" — written to {len(touched)} file(s); run the content validators and commit"


def main(argv: list[str]) -> int:
    refs = [a for a in argv if not a.startswith("--")]
    errors, skipped, summary = publish(refs or None, dry_run="--dry-run" in argv)
    for s in skipped:
        print("  not eligible: " + s)
    if errors:
        print("FAIL nothing published (" + summary + "):\n  " + "\n  ".join(errors)); return 1
    print("PASS " + summary)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
