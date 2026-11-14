/**
 * Starting diagnostic. The reading block comes from its physical owner (learning/exercises/b1/diagnostics); the writing
 * and speaking tasks are theme tasks (learning/exercises/b1/themes).
 *
 * EXAM-11: the baseline file's own production tasks (d-w1/d-w2, d-s1/d-s2) are the writing and speaking parts of the
 * EXAM mini rehearsals, so the LEARN diagnostic must never show them — a learner would meet the exam prompt before the
 * exam. It uses the closest theme tasks instead (a formal message about language courses; a call to move an appointment),
 * none of which an EXAM blueprint or the withheld delayed checks use (content/diagnostic.test.ts).
 */
import { validateBaseline, type DiagnosticBaseline, type DiagnosticProductionTask } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/diagnostics/baseline-v1.json";
import { learnerPool } from "./release.ts";

const themeFiles = import.meta.glob("../../../../learning/exercises/b1/themes/*.json", { eager: true, import: "default" }) as
  Record<string, { writing: DiagnosticProductionTask[]; speaking: DiagnosticProductionTask[] }>;
export const DIAGNOSTIC_PRODUCTION_IDS = { writing: "09-yhteiskunta-writing-01", speaking: "06-terveys-ja-hyvinvointi-speaking-01" } as const;
const themeTask = (part: "writing" | "speaking") => {
  const t = Object.values(themeFiles).flatMap(f => f[part]).find(x => x.id === DIAGNOSTIC_PRODUCTION_IDS[part]);
  if (!t) throw new Error(`diagnostic ${part} task ${DIAGNOSTIC_PRODUCTION_IDS[part]} is missing from the theme files`);
  return t;
};

const b: DiagnosticBaseline = { ...(data as unknown as DiagnosticBaseline), writing: [themeTask("writing")], speaking: [themeTask("speaking")] };
if (!validateBaseline(b)) throw new Error("the LEARN diagnostic is invalid");
export const baseline = b;
/** The parts the starting diagnostic shows: its reading block, the writing and the speaking task. A release build offers
 *  it only when all of them are published. */
export const diagnosticAvailable = learnerPool([b], x => [x.reading, x.writing[0], x.speaking[0]]).length === 1;
