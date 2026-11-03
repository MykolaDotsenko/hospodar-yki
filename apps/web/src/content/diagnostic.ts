/** Starting diagnostic, read from its single physical owner (learning/exercises/b1/diagnostics). */
import { validateBaseline, type DiagnosticBaseline } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/diagnostics/baseline-v1.json";

const b = data as unknown as DiagnosticBaseline;
if (!validateBaseline(b)) throw new Error("diagnostics/baseline-v1.json is invalid");
export const baseline = b;
