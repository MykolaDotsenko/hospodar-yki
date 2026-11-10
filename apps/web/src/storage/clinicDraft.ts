/**
 * Unfinished LEARN writing clinic state is not independent writing evidence.
 * Rebuild its phase using the pure reducer before displaying editorial models.
 * Fingerprint is a content-version guard, not an authenticity signature.
 */
import { clinicReducer, startClinic, CLINIC_MAX_CHARS, type ClinicItem, type ClinicSession } from "@hospodar/domain";

export interface ClinicDraftPayload { session: ClinicSession; input: string; contentFingerprint: string }
const phases = ["write", "selfcheck", "spot", "issues", "model", "rewrite", "transfer"] as const;
export function clinicFingerprint(item: ClinicItem): string {
  const content = JSON.stringify([item.id, item.title_fi, item.prompt_fi, item.required, item.first_draft_fi,
    item.issues, item.model_fi, item.transfer_fi, item.feedback_uk, item.model_visibility, item.model_note_uk, item.self_check_uk]);
  let h = 2166136261;
  for (let i = 0; i < content.length; i++) h = Math.imul(h ^ content.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
export const clinicPayload = (session: ClinicSession, input: string, item: ClinicItem): ClinicDraftPayload =>
  ({ session, input, contentFingerprint: clinicFingerprint(item) });

/** Refuse corrupt, outdated, contradictory and prematurely unlocked drafts without exposing model text. */
export function validClinicDraft(value: unknown, item: ClinicItem): value is ClinicDraftPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  if (Object.keys(d).sort().join("|") !== "contentFingerprint|input|session" ||
      d.contentFingerprint !== clinicFingerprint(item) ||
      typeof d.input !== "string" || d.input.length > CLINIC_MAX_CHARS ||
      !d.session || typeof d.session !== "object" || Array.isArray(d.session)) return false;
  const s = d.session as ClinicSession;
  if (Object.keys(s).sort().join("|") !== "checked|draft|draftSaved|itemId|marked|phase|rewrite|transfer" ||
      s.itemId !== item.id || !phases.some(p => p === s.phase) ||
      typeof s.draft !== "string" || typeof s.rewrite !== "string" || s.transfer !== "" ||
      s.draft.length > CLINIC_MAX_CHARS || s.rewrite.length > CLINIC_MAX_CHARS ||
      typeof s.draftSaved !== "boolean" || !Array.isArray(s.checked) || !Array.isArray(s.marked) ||
      (!["write", "rewrite", "transfer"].includes(s.phase) && d.input !== "")) return false;
  try {
    const after = (phase: string) => phases.indexOf(s.phase as typeof phases[number]) > phases.indexOf(phase as typeof phases[number]);
    let expected = startClinic(item);
    if (s.phase !== "write") {
      expected = clinicReducer(expected, item, { type: "SUBMIT_DRAFT", text: s.draft });
      expected = clinicReducer(expected, item, { type: "SELF_CHECK", points: s.checked });
      if (s.draftSaved) expected = clinicReducer(expected, item, { type: "DRAFT_SAVED" });
      if (after("selfcheck")) expected = clinicReducer(expected, item, { type: "CONTINUE" });
      if (after("selfcheck")) expected = clinicReducer(expected, item, { type: "MARK", sentences: s.marked });
      if (after("spot")) expected = clinicReducer(expected, item, { type: "CONTINUE" });
      if (after("issues")) expected = clinicReducer(expected, item, { type: "CONTINUE" });
      if (after("model")) expected = clinicReducer(expected, item, { type: "CONTINUE" });
      if (after("rewrite")) expected = clinicReducer(expected, item, { type: "SUBMIT_REWRITE", text: s.rewrite });
    }
    return JSON.stringify(expected) === JSON.stringify(s);
  } catch { return false; }
}
