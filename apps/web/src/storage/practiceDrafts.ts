/** Unfinished practice cards kept on this device (COG-11; first answer frozen). See draftStore.ts for the rules. */
import type { ExternalDraft, MasterclassDraft, PracticeDraft } from "@hospodar/domain";
import { createDraftStore } from "./draftStore.ts";

export const PRACTICE_DRAFTS_KEY = "hospodar-yki:web:practice-drafts:v1";
export const MASTERCLASS_DRAFTS_KEY = "hospodar-yki:web:masterclass-drafts:v1";
export const EXTERNAL_DRAFTS_KEY = "hospodar-yki:web:external-drafts:v1";
export const PRACTICE_DRAFT_LIMIT = 20;
const practice = createDraftStore<PracticeDraft>(PRACTICE_DRAFTS_KEY, PRACTICE_DRAFT_LIMIT);
export const masterclassDrafts = createDraftStore<MasterclassDraft>(MASTERCLASS_DRAFTS_KEY);
export const externalDrafts = createDraftStore<ExternalDraft>(EXTERNAL_DRAFTS_KEY);

export const readPracticeDrafts = practice.read;
export const writePracticeDraft = (d: PracticeDraft) => practice.write(d.cardId, d);
export const clearPracticeDraft = practice.clear;
/** Any unfinished LEARN lesson of these three kinds on this device. */
export const hasPracticeDrafts = () => practice.has() || masterclassDrafts.has() || externalDrafts.has();
/** Erases all three; throws when anything is still there afterwards. */
export function clearPracticeDrafts(): void { practice.clearAll(); masterclassDrafts.clearAll(); externalDrafts.clearAll(); }
/** Count per kind, for «Мої дані». */
export const lessonDraftCounts = () => ({ practice: Object.keys(practice.read()).length, masterclass: Object.keys(masterclassDrafts.read()).length, external: Object.keys(externalDrafts.read()).length });
