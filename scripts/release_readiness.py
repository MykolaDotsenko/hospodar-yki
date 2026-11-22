#!/usr/bin/env python3
"""Single pre-release check for the Web app (docs/29 stage 8; R11-20 «green tests are never a release gate on their own»;
docs/RELEASE.md go/no-go matrix).

Every gate ends PASS, FAIL, NOT_RUN or BLOCKED — never PASS without evidence:

  RG-CONTENT   the content publication gate passes AND the release build would carry at least one S2-published item
  RG-CLAIMS    the automated forbidden-claims checks ran and passed (UI never calls itself the official YKI; no
               competitor efficacy ranking) — only with --run-tests, otherwise NOT_RUN
  RG-BUILD     a release build (VITE_HOSPODAR_CHANNEL=release) exists at --dist: no source maps, the whole build within the
               documented budget — NOT_RUN without --dist
  rows         every human row of docs/operations/release-readiness-v1.json in scope (real-device accessibility
               sessions, privacy/legal and hosting sign-offs): PASS only with a dated record; NOT_RUN = BLOCKED

    python3 scripts/release_readiness.py                     # report; exits 1 only when the data itself is invalid
    python3 scripts/release_readiness.py --run-tests --dist apps/web/dist-release
    python3 scripts/release_readiness.py --strict ...        # exits 1 unless the verdict is READY

Static and local: it cannot prove that a named session took place; it only refuses a PASS that has no record.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = Path("docs/operations/release-readiness-v1.json")
STATUSES = {"PASS", "FAIL", "NOT_RUN"}
KINDS = {"manual", "signoff"}
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CLAIM_CHECKS = (
    ("UI never claims to be the official YKI (TZ-EXAM-20)", ["pnpm", "--filter", "@hospodar/web", "exec", "vitest", "run", "src/ui/claims.test.ts"]),
    ("No competitor efficacy ranking (R12)", ["node", "--test", "app/tests/r12-benchmark-evidence.test.mjs"]),
)


def gate(gid: str, title: str, status: str, evidence: list[str], blocker: str = "") -> dict:
    return {"id": gid, "title": title, "status": status, "evidence": evidence, "blocker": blocker}


def row_errors(row: dict, root: Path) -> list[str]:
    """A row may claim PASS/FAIL only with a dated record that exists (repo path) or is an https link."""
    rid = row.get("id", "?")
    errs = []
    if not isinstance(row.get("id"), str) or not row["id"]:
        errs.append("row without id")
    if row.get("kind") not in KINDS:
        errs.append(f"{rid}: kind must be one of {sorted(KINDS)}")
    if row.get("status") not in STATUSES:
        errs.append(f"{rid}: status must be one of {sorted(STATUSES)}")
    if not isinstance(row.get("title_uk"), str) or not row["title_uk"].strip():
        errs.append(f"{rid}: title_uk missing")
    if row.get("status") == "NOT_RUN":
        if row.get("evidence") not in (None, {}):
            errs.append(f"{rid}: NOT_RUN must not carry evidence")
        return errs
    ev = row.get("evidence")
    if not isinstance(ev, dict):
        return errs + [f"{rid}: {row.get('status')} needs evidence (date, role, record)"]
    if not DATE.match(str(ev.get("date", ""))):
        errs.append(f"{rid}: evidence.date must be YYYY-MM-DD")
    if not str(ev.get("role", "")).strip():
        errs.append(f"{rid}: evidence.role missing (who did it, by role — no personal data)")
    if row.get("kind") == "manual" and not str(ev.get("environment", "")).strip():
        errs.append(f"{rid}: evidence.environment missing (device, OS/browser and assistive technology versions)")
    record = str(ev.get("record", ""))
    if not (record.startswith("https://") or (record and (root / record).is_file())):
        errs.append(f"{rid}: evidence.record must be an existing repository file or an https link")
    return errs


def load_rows(root: Path) -> tuple[dict, list[str]]:
    try:
        data = json.loads((root / DATA).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        return {}, [f"{DATA}: unreadable ({e})"]
    errs = []
    if data.get("schema") != "hospodar-release-readiness-v1":
        errs.append(f"{DATA}: wrong schema")
    if not isinstance(data.get("build_budget_bytes"), int) or data["build_budget_bytes"] <= 0:
        errs.append(f"{DATA}: build_budget_bytes must be a positive integer")
    rows = data.get("rows")
    if not isinstance(rows, list) or not rows:
        errs.append(f"{DATA}: rows missing")
        rows = []
    ids = [r.get("id") for r in rows if isinstance(r, dict)]
    if len(ids) != len(set(ids)):
        errs.append(f"{DATA}: duplicate row ids")
    for r in rows:
        errs.extend(row_errors(r, root) if isinstance(r, dict) else ["row is not an object"])
    return data, errs


def content_gate(root: Path) -> dict:
    sys.path.insert(0, str(root / "scripts"))
    import validate_content_publication as cp  # noqa: E402
    errors, s = cp.check(cp.load_files())
    ev = [f"{s['files']} content files, {s['cards']} review cards, {s['reviewed']} S2-reviewed, {s['published']} published"]
    if errors:
        return gate("RG-CONTENT", "Content: S2 publication gate", "FAIL", ev + errors[:5])
    if s["published"] == 0:
        return gate("RG-CONTENT", "Content: S2 publication gate", "BLOCKED", ev,
                    "no item is S2-published: a release build would carry no learning content (human S2 review)")
    return gate("RG-CONTENT", "Content: S2 publication gate", "PASS", ev)


def claims_gate(root: Path, run: bool) -> dict:
    title = "Forbidden claims (automated part)"
    if not run:
        return gate("RG-CLAIMS", title, "NOT_RUN", ["run with --run-tests"])
    ev, ok = [], True
    for name, cmd in CLAIM_CHECKS:
        try:
            r = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=600)
        except (OSError, subprocess.TimeoutExpired) as e:
            return gate("RG-CLAIMS", title, "NOT_RUN", [f"{name}: could not run ({e})"])
        ev.append(f"{name}: {'PASS' if r.returncode == 0 else 'FAIL'} ({' '.join(cmd)})")
        ok &= r.returncode == 0
    return gate("RG-CLAIMS", title, "PASS" if ok else "FAIL", ev)


def build_gate(dist: Path | None, budget: int) -> dict:
    title = "Release build: no source maps, whole build within budget"
    if dist is None:
        return gate("RG-BUILD", title, "NOT_RUN", ["pass --dist with a VITE_HOSPODAR_CHANNEL=release build"])
    if not (dist / "index.html").is_file():
        return gate("RG-BUILD", title, "FAIL", [f"{dist}: no index.html — not a build"])
    files = [p for p in dist.rglob("*") if p.is_file()]
    maps = [str(p.relative_to(dist)) for p in files if p.suffix == ".map"]
    mapped = [str(p.relative_to(dist)) for p in files if p.suffix == ".js" and "sourceMappingURL=" in p.read_text(encoding="utf-8", errors="ignore")]
    size = sum(p.stat().st_size for p in files)
    ev = [f"{len(files)} files, {size / 1048576:.1f} MiB (budget {budget / 1048576:.0f} MiB)"]
    problems = ([f"source maps published: {', '.join(maps[:3])}"] if maps else []) + \
               ([f"scripts point to source maps: {', '.join(mapped[:3])}"] if mapped else []) + \
               ([f"over budget by {(size - budget) / 1048576:.1f} MiB"] if size > budget else [])
    return gate("RG-BUILD", title, "FAIL" if problems else "PASS", ev + problems)


def row_gate(row: dict) -> dict:
    ev = row.get("evidence") or {}
    st = row["status"]
    evidence = [f"{ev.get('date')} · {ev.get('role')}{' · ' + ev['environment'] if ev.get('environment') else ''} · {ev.get('record')}"] if st != "NOT_RUN" else [f"source: {row.get('source', '')}"]
    return gate(row["id"], row["title_uk"], "BLOCKED" if st == "NOT_RUN" else st, evidence,
                "needs a real session or a written sign-off by a person" if st == "NOT_RUN" else "")


def evaluate(root: Path, run_tests: bool = False, dist: Path | None = None) -> tuple[list[dict], list[str], str]:
    data, errs = load_rows(root)
    if errs:
        return [], errs, "INVALID"
    gates = [content_gate(root), claims_gate(root, run_tests), build_gate(dist, data["build_budget_bytes"])]
    gates += [row_gate(r) for r in data["rows"] if r.get("scope") == data.get("scope", "web")]
    verdict = "READY" if all(g["status"] == "PASS" for g in gates) else "NOT_READY"
    return gates, [], verdict


def main(argv: list[str]) -> int:
    run_tests = "--run-tests" in argv
    strict = "--strict" in argv
    dist = Path(argv[argv.index("--dist") + 1]).resolve() if "--dist" in argv and argv.index("--dist") + 1 < len(argv) else None
    gates, errs, verdict = evaluate(ROOT, run_tests, dist)
    if errs:
        print("FAIL release readiness data:\n  " + "\n  ".join(errs))
        return 1
    print("| Gate | Status | Evidence / blocker |\n| --- | --- | --- |")
    for g in gates:
        detail = "; ".join(g["evidence"]) + (f" — BLOCKER: {g['blocker']}" if g["blocker"] else "")
        print(f"| {g['id']} {g['title']} | {g['status']} | {detail} |")
    counts = {s: sum(g["status"] == s for g in gates) for s in ("PASS", "FAIL", "NOT_RUN", "BLOCKED")}
    print(f"\nVERDICT: {verdict} ({', '.join(f'{k} {v}' for k, v in counts.items())}). "
          "Automated gates alone never make a release ready; human rows need dated records.")
    return 1 if strict and verdict != "READY" else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
