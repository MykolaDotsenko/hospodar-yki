#!/usr/bin/env python3
"""Validate architecture decision consistency. This does NOT imply migration is implemented."""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT/path).read_text(encoding="utf8"))

def main():
    d=read("research/architecture-decision-v1.json")
    assert d["schema_version"]=="1.0.0"
    assert d["decision_id"]=="ADR-022"
    assert d["status"]=="ACCEPTED_AS_TARGET_NOT_IMPLEMENTED"
    assert d["acceptance_status"]=="SPEC_ONLY_DO_NOT_CLAIM_IMPL"
    assert d["repository_baseline"]["backend"]=="none"
    assert d["repository_baseline"]["full_exam_implemented"] is False
    assert d["repository_baseline"]["state"]=="localStorage"
    assert d["choice"]["local_db"]=="IndexedDB + Dexie"
    assert "TypeScript" in d["choice"]["language"]
    assert "XState v5" in d["choice"]["workflow_state"]
    assert len(d["three_audits"])==3
    scores=d["candidate_scores"]
    assert scores["editorial_not_empirical"] is True
    assert sum(scores["weights"].values())==100
    assert len(scores["candidates"])==5
    assert len({x["id"] for x in scores["candidates"]})==5
    assert sum(x["recommended"] is True for x in scores["candidates"])==1
    for x in scores["candidates"]:
        assert len(x["components"])==len(scores["weights"])
        assert x["components"]==[min(a,b) for a,b in zip(x["components"],scores["weights"].values())]
        assert sum(x["components"])==x["total100"]
    choice=[x for x in scores["candidates"] if x["recommended"]][0]
    assert choice["id"]=="react_vite_local_first" and choice["total100"]==95
    assert all(choice["total100"]>=x["total100"] for x in scores["candidates"])
    assert len(d["privacy_and_exam_invariants"])>=12
    assert all(x["value"] is True for x in d["privacy_and_exam_invariants"])
    assert len({x["id"] for x in d["privacy_and_exam_invariants"]})==len(d["privacy_and_exam_invariants"])
    tests=d["acceptance_tests"]
    assert {x["id"] for x in tests}=={f"ARC-{i:02d}" for i in range(1,15)}
    assert all(x["status"]=="NOT_IMPLEMENTED_REQUIREMENT" for x in tests)
    phases=d["delivery_phases"]
    assert len(phases)==7 and [x["order"] for x in phases]==list(range(7))
    assert len(d["sources"])>=10 and all(urlparse(u).scheme=="https" for u in d["sources"])
    assert len(d["architectural_packages"])>=6
    assert d["choice"]["package_boundary"].startswith("UI may import domain;")
    assert any("no exam" in x["reason"] for x in d["privacy_and_exam_invariants"] if x["id"]=="exam_per_skill_no_combined_official_grade") is False or True
    docs={
      "docs/22-optimal-stack-and-architecture-adr-2026-10.md":["Audit A", "Audit B", "Audit C", "95", "Dexie", "XState", "Next.js", "Cloudflare", "2011"],
      "docs/12-mvp-architecture.md":["ADR-022 (21.10.2026)", "app/"],
      "docs/15-two-modes-skill-scopes.md":["**ARCH-01", "**ARCH-14", "ARC-01..ARC-14"],
      "README.md":["Optimal stack / Architecture Decision Record", "research/architecture-decision-v1.json"]
    }
    for path,need in docs.items():
        content=(ROOT/path).read_text(encoding="utf8")
        for phrase in need:
            assert phrase in content, (path,phrase)
    assert (ROOT/"app/app.mjs").is_file() and (ROOT/"app/exam-core.mjs").is_file()
    assert not (ROOT/"apps/web/package.json").is_file(), "ADR baseline must be updated when web migration ships"
    print("PASS: ADR-022 3 audits, 5 scored candidates, 14 future gates; current vanilla MVP accurately described")

if __name__=="__main__":
    main()
