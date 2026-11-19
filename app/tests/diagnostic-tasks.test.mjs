import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DIAGNOSTIC_PRODUCTION_IDS, DIAGNOSTIC_THEME_FILES, learnDiagnosticBaseline } from "../diagnostic-tasks.mjs";

const root = new URL("../../", import.meta.url);
const json = p => JSON.parse(readFileSync(new URL(p, root), "utf8"));

test("EXAM-11 legacy diagnostic: writing and speaking come from theme tasks, never the EXAM mini rehearsals' prompts", () => {
  const baseline = json("learning/exercises/b1/diagnostics/baseline-v1.json");
  const themes = { writing: json(DIAGNOSTIC_THEME_FILES.writing), speaking: json(DIAGNOSTIC_THEME_FILES.speaking) };
  const d = learnDiagnosticBaseline(baseline, themes);
  assert.equal(d.writing[0].id, DIAGNOSTIC_PRODUCTION_IDS.writing);
  assert.equal(d.speaking[0].id, DIAGNOSTIC_PRODUCTION_IDS.speaking);
  assert.equal(d.reading.id, baseline.reading.id);                        // reading block unchanged
  const exam = json("learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json");
  const examIds = new Set(exam.blueprints.flatMap(b => b.skill_blocks.map(s => s.item_id)));
  for (const t of [...d.writing, ...d.speaking]) assert.equal(examIds.has(t.id), false, `${t.id} is an EXAM item`);
  assert.equal(JSON.stringify(d).includes("d-w1") || JSON.stringify(d).includes("d-s1"), false);
});

test("EXAM-11 legacy diagnostic: the same theme tasks as apps/web, and a missing task fails closed", () => {
  const web = readFileSync(new URL("apps/web/src/content/diagnostic.ts", root), "utf8");
  assert.match(web, new RegExp(`writing: "${DIAGNOSTIC_PRODUCTION_IDS.writing}"`));
  assert.match(web, new RegExp(`speaking: "${DIAGNOSTIC_PRODUCTION_IDS.speaking}"`));
  assert.throws(() => learnDiagnosticBaseline({ writing: [], speaking: [] }, { writing: { writing: [] }, speaking: { speaking: [] } }), /missing/);
});
