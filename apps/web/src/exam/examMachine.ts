/**
 * EXAM practice rehearsal — XState transition layer over the pure, parity-tested policies in @hospodar/domain
 * (ADR-027: "XState for complex transitions + separate pure policies"; ARCH-03, EXAM-01/03/05/09, SIM-01).
 *
 * Invariants:
 *  - No key, hint, coaching or result before a DURABLE finish (scoreSession is only read in `finished`).
 *  - Every navigation and the finish are persisted BEFORE the machine moves on (persist-before-navigation, C-04);
 *    a failed save keeps the learner on the same item with their text (saveError → RETRY), never a fake success.
 *  - Draft autosave (AUTOSAVE) persists typed text WITHOUT blocking input; while it runs, navigation waits.
 *    An autosave failure is shown and the draft stays dirty — the next navigation retries (fail closed).
 *  - Scope: full four-skill rehearsal or a chosen subset (EXAM-03/04, AC-11–15) — always practice, never an
 *    "official partial YKI". The scope is stored with the checkpoint so a reload restores the same items.
 *  - Finish writes the checkpoint AND an attempt-history record atomically (EXAM-09); no grade, no pass prediction.
 *  - Practice deadline (E04): once expired, answers/navigation are refused and only "finish" is possible.
 *  - Voice (E06): consent is persisted first; a recording counts as STORED only via a verified receipt (bytes already
 *    written + read back + hashed by the voice store) committed with the checkpoint; without consent it is EPHEMERAL
 *    (this page only). A receipt whose bytes no longer verify is dropped (VOICE_UNVERIFIED), never kept as an answer.
 *    A new rehearsal deletes the previous session's clips before clearing the checkpoint.
 */
import { assign, fromPromise, setup } from "xstate";
import { attachVoiceReceipt, createSession, finishSession, goToIndex, isPracticeExpired, recordVoiceEvidence, removeVoiceReceipt, scoreSession,
  setVoiceConsent, withElapsedHighWater, writeAnswer, type ExamItem, type ExamSession, type ExamSkill, type SpeakingReceipt } from "@hospodar/domain";
import type { ExamCheckpoint, ExamHistoryRecord, ExamRepository } from "../storage/examRepository.ts";

export interface ExamContext {
  items: ExamItem[]; session: ExamSession | null; skills: ExamSkill[] | null; revision: number; after: "active" | "finished";
  error: string | null; autosaveError: string | null; dirty: boolean; blueprintIds: string[];
}
export type ExamEvent =
  | { type: "START"; blueprintId: string; minutes: number; now: number; sessionId: string; skills?: ExamSkill[] | null }
  | { type: "ANSWER"; itemId: string; value: string; now: number }
  | { type: "AUTOSAVE" }
  | { type: "GOTO"; index: number; now: number }
  | { type: "TICK"; now: number; elapsedMs: number }
  | { type: "REQUEST_FINISH" } | { type: "CANCEL_FINISH" } | { type: "CONFIRM_FINISH"; now: number }
  | { type: "RETRY" } | { type: "NEW_REHEARSAL" }
  | { type: "CONSENT"; consent: boolean; now: number }
  | { type: "VOICE_STORED"; itemId: string; receipt: SpeakingReceipt; now: number }
  | { type: "VOICE_EPHEMERAL"; itemId: string; now: number }
  | { type: "VOICE_REMOVED"; itemId: string; now: number }
  | { type: "VOICE_UNVERIFIED"; itemId: string };

/** The part of the voice store the machine needs: deleting a session's clips when a new rehearsal starts. */
export interface VoiceCleanup { pruneSession(sessionId: string, keepStorageKeys?: string[]): Promise<number> }

const SKILLS: ExamSkill[] = ["reading", "listening", "writing", "speaking"];
/** null = full rehearsal; otherwise a non-empty, ordered subset of the four skills. */
export const normaliseSkills = (s: ExamSkill[] | null | undefined): ExamSkill[] | null => {
  const set = SKILLS.filter(k => (s ?? []).includes(k));
  return set.length === 0 || set.length === SKILLS.length ? null : set;
};
const codeOf = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");
const expired = (c: ExamContext, now: number) => Boolean(c.session) && isPracticeExpired(c.session, new Date(now));

export function createExamMachine(repo: ExamRepository, itemsFor: (blueprintId: string, skills: ExamSkill[] | null) => ExamItem[],
  blueprintIds: string[], contentVersion = "unversioned", voice: VoiceCleanup | null = null) {
  const tryAttach = (c: ExamContext, e: { itemId: string; receipt: SpeakingReceipt; now: number }) => {
    if (c.items.find(i => i.id === e.itemId)?.skill !== "speaking") return null;
    try { return attachVoiceReceipt(c.session!, e.itemId, e.receipt, new Date(e.now)); } catch { return null; }
  };
  const record = (c: ExamContext): ExamHistoryRecord => {
    const s = c.session!;
    return { sessionId: s.sessionId, blueprintId: s.blueprintId, contentVersion, skills: c.skills, startedAt: s.startedAt,
      finishedAt: s.finishedAt!, timeLimitMinutes: s.timeLimitMinutes, bySkill: scoreSession(c.items, s).bySkill };
  };
  // An unconsented recording lived only in that page: after a reload it is gone, so it must not count as an answer.
  const restore = (cp: ExamCheckpoint) => ({ session: { ...cp.session, voiceRecorded: Object.fromEntries(Object.keys(cp.session.voiceReceipts ?? {}).map(k => [k, true])) },
    revision: cp.revision, skills: cp.skills,
    items: itemsFor(cp.session.blueprintId, cp.skills), dirty: false });
  return setup({
    types: { context: {} as ExamContext, events: {} as ExamEvent },
    actors: {
      load: fromPromise(async () => repo.read()),
      persist: fromPromise(async ({ input }: { input: { session: ExamSession; revision: number; skills: ExamSkill[] | null } }) =>
        repo.commit(input.session, input.revision, input.skills)),
      finish: fromPromise(async ({ input }: { input: { session: ExamSession; revision: number; skills: ExamSkill[] | null; record: ExamHistoryRecord } }) =>
        repo.finish(input.session, input.revision, input.skills, input.record)),
      clear: fromPromise(async ({ input }: { input: { revision: number; sessionId: string | null } }) => {
        if (voice && input.sessionId) await voice.pruneSession(input.sessionId, []);   // audio first: never orphan a recording
        await repo.clear(input.revision);
      }),
    },
    guards: {
      runningExpired: ({ context, event }) => "now" in event && expired(context, (event as { now: number }).now),
    },
  }).createMachine({
    id: "exam",
    initial: "loading",
    context: { items: [], session: null, skills: null, revision: 0, after: "active", error: null, autosaveError: null, dirty: false, blueprintIds },
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: [
            { guard: ({ event }) => !event.output || !blueprintIds.includes((event.output as ExamCheckpoint).session.blueprintId), target: "setup",
              actions: assign({ revision: ({ event }) => (event.output as ExamCheckpoint | null)?.revision ?? 0 }) },
            { guard: ({ event }) => Boolean((event.output as ExamCheckpoint).session.finishedAt), target: "finished",
              actions: assign(({ event }) => restore(event.output as ExamCheckpoint)) },
            { target: "active", actions: assign(({ event }) => restore(event.output as ExamCheckpoint)) },
          ],
          onError: { target: "setup", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
      setup: {
        on: {
          START: { target: "saving", actions: assign(({ event }) => {
            const skills = normaliseSkills(event.skills);
            return { items: itemsFor(event.blueprintId, skills), skills, after: "active" as const, error: null, autosaveError: null, dirty: false,
              session: createSession(event.blueprintId, event.minutes, new Date(event.now), event.sessionId) };
          }) },
        },
      },
      saving: {
        invoke: {
          src: "persist",
          input: ({ context }) => ({ session: context.session!, revision: context.revision, skills: context.skills }),
          onDone: { target: "active", actions: assign({ revision: ({ event }) => event.output.revision, error: null, autosaveError: null, dirty: false }) },
          onError: { target: "saveError", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
      finishing: {
        invoke: {
          src: "finish",
          input: ({ context }) => ({ session: context.session!, revision: context.revision, skills: context.skills, record: record(context) }),
          onDone: { target: "finished", actions: assign({ revision: ({ event }) => event.output.revision, error: null, dirty: false }) },
          onError: { target: "saveError", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
      saveError: {
        on: { RETRY: [{ guard: ({ context }) => context.after === "finished", target: "finishing" }, { target: "saving" }] },
      },
      active: {
        on: {
          ANSWER: [
            { guard: "runningExpired", target: "expired" },
            { actions: assign({ dirty: true, session: ({ context, event }) => writeAnswer(context.session!, event.itemId, event.value, new Date(event.now)) }) },
          ],
          AUTOSAVE: { guard: ({ context }) => context.dirty, target: "autosaving" },
          GOTO: [
            { guard: "runningExpired", target: "expired" },
            { guard: ({ context, event }) => event.index < 0 || event.index >= context.items.length || event.index === context.session!.index },
            { target: "saving", actions: assign(({ context, event }) => ({ after: "active" as const,
                session: goToIndex(context.session!, event.index, context.items.length, new Date(event.now)) })) },
          ],
          TICK: [
            { guard: "runningExpired", target: "expired" },
            { actions: assign({ session: ({ context, event }) => withElapsedHighWater(context.session!, event.elapsedMs) }) },
          ],
          REQUEST_FINISH: "confirming",
          CONSENT: [
            { guard: "runningExpired", target: "expired" },
            { guard: ({ context, event }) => context.session!.voiceConsent !== event.consent && !(event.consent === false &&
                Object.keys(context.session!.voiceReceipts ?? {}).length > 0) ,                       // delete stored clips first
              target: "saving", actions: assign(({ context, event }) => ({ after: "active" as const, session: setVoiceConsent(context.session!, event.consent) })) },
          ],
          VOICE_STORED: [
            { guard: "runningExpired", target: "expired" },
            { guard: ({ context, event }) => tryAttach(context, event) !== null, target: "saving",
              actions: assign(({ context, event }) => ({ after: "active" as const, session: tryAttach(context, event)! })) },
          ],
          VOICE_EPHEMERAL: [
            { guard: "runningExpired", target: "expired" },
            { guard: ({ context, event }) => context.items.find(i => i.id === event.itemId)?.skill === "speaking",
              actions: assign({ dirty: true, session: ({ context, event }) => recordVoiceEvidence(context.session!, event.itemId, true, new Date(event.now)) }) },
          ],
          VOICE_REMOVED: [
            { guard: "runningExpired", target: "expired" },
            { guard: ({ context, event }) => Boolean(context.session!.voiceReceipts?.[event.itemId] || context.session!.voiceRecorded?.[event.itemId]),
              target: "saving", actions: assign(({ context, event }) => ({ after: "active" as const, session: removeVoiceReceipt(context.session!, event.itemId) })) },
          ],
          VOICE_UNVERIFIED: { guard: ({ context, event }) => Boolean(context.session!.voiceReceipts?.[event.itemId]), target: "saving",
            actions: assign(({ context, event }) => ({ after: "active" as const, session: removeVoiceReceipt(context.session!, event.itemId) })) },
        },
      },
      autosaving: {
        invoke: {
          src: "persist",
          input: ({ context }) => ({ session: context.session!, revision: context.revision, skills: context.skills }),
          onDone: { target: "active", actions: assign(({ context, event }) => ({ revision: event.output.revision, autosaveError: null,
            dirty: context.session !== event.output.session })) },        // typed again while saving → still dirty
          onError: { target: "active", actions: assign({ autosaveError: ({ event }) => codeOf(event.error) }) },
        },
        on: {                                                            // typing never blocks; navigation waits for the save
          ANSWER: [
            { guard: "runningExpired" },
            { actions: assign({ dirty: true, session: ({ context, event }) => writeAnswer(context.session!, event.itemId, event.value, new Date(event.now)) }) },
          ],
        },
      },
      confirming: {
        on: {
          CANCEL_FINISH: "active",
          CONFIRM_FINISH: { target: "finishing", actions: assign(({ context, event }) => ({ after: "finished" as const,
            session: finishSession(context.session!, new Date(event.now)) })) },
        },
      },
      expired: {
        on: {
          CONFIRM_FINISH: { target: "finishing", actions: assign(({ context, event }) => ({ after: "finished" as const,
            session: finishSession(context.session!, new Date(event.now)) })) },
        },
      },
      finished: { on: {
        NEW_REHEARSAL: "clearing",
        // finished results must not show a recording that no longer verifies; the finished checkpoint itself is not rewritten
        VOICE_UNVERIFIED: { actions: assign({ session: ({ context, event }) => removeVoiceReceipt(context.session!, event.itemId) }) },
      } },
      clearing: {
        invoke: {
          src: "clear", input: ({ context }) => ({ revision: context.revision, sessionId: context.session?.sessionId ?? null }),
          onDone: { target: "setup", actions: assign({ session: null, items: [], skills: null, revision: 0, error: null, dirty: false }) },
          onError: { target: "finished", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
    },
  });
}
