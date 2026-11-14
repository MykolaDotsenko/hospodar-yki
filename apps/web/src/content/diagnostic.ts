/** Starting diagnostic, read from its single physical owner (learning/exercises/b1/diagnostics). */
import { validateBaseline, type DiagnosticBaseline } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/diagnostics/baseline-v1.json";
import { learnerPool } from "./release.ts";

const b = data as unknown as DiagnosticBaseline;
if (!validateBaseline(b)) throw new Error("diagnostics/baseline-v1.json is invalid");
export const baseline = b;
/** The parts the starting diagnostic shows: its reading block, first writing and first speaking task. A release build
 *  offers it only when all of them are published. */
export const diagnosticAvailable = learnerPool([b], x => [x.reading, x.writing[0], x.speaking[0]]).length === 1;
