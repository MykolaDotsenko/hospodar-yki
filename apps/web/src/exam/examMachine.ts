/**
 * EXAM practice rehearsal — XState transition layer over the pure, parity-tested policies in @hospodar/domain
 * (ADR-027: "XState for complex transitions + separate pure policies"; ARCH-03, EXAM-01/05, SIM-01).
 *
 * Invariants:
 *  - No key, hint, coaching or result before a DURABLE finish (scoreSession is only read in `finished`).
 *  - Every navigation and the finish are persisted BEFORE the machine moves on (persist-before-navigation, C-04);
 *    a failed save keeps the learner on the same item with their text (saveError → RETRY), never a fake success.
 *  - Practice deadline (E04): once expired, answers/navigation are refused and only "finish" is possible.
 *  - Unofficial: practice timer only from the allowed set; never an official YKI grade.
 */
import { assign, fromPromise, setup } from "xstate";
import { createSession, finishSession, goToIndex, isPracticeExpired, withElapsedHighWater, writeAnswer,
  type ExamItem, type ExamSession } from "@hospodar/domain";
import type { ExamCheckpoint, ExamRepository } from "../storage/examRepository.ts";

export interface ExamContext {
  items: ExamItem[]; session: ExamSession | null; revision: number; after: "active" | "finished";
  error: string | null; blueprintIds: string[];
}
export type ExamEvent =
  | { type: "START"; blueprintId: string; minutes: number; now: number; sessionId: string }
  | { type: "ANSWER"; itemId: string; value: string; now: number }
  | { type: "GOTO"; index: number; now: number }
  | { type: "TICK"; now: number; elapsedMs: number }
  | { type: "REQUEST_FINISH" } | { type: "CANCEL_FINISH" } | { type: "CONFIRM_FINISH"; now: number }
  | { type: "RETRY" } | { type: "NEW_REHEARSAL" };

const codeOf = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");
const expired = (c: ExamContext, now: number) => Boolean(c.session) && isPracticeExpired(c.session, new Date(now));

export function createExamMachine(repo: ExamRepository, itemsFor: (blueprintId: string) => ExamItem[], blueprintIds: string[]) {
  return setup({
    types: { context: {} as ExamContext, events: {} as ExamEvent },
    actors: {
      load: fromPromise(async () => repo.read()),
      persist: fromPromise(async ({ input }: { input: { session: ExamSession; revision: number } }) => repo.commit(input.session, input.revision)),
      clear: fromPromise(async ({ input }: { input: { revision: number } }) => repo.clear(input.revision)),
    },
    guards: {
      runningExpired: ({ context, event }) => "now" in event && expired(context, (event as { now: number }).now),
    },
  }).createMachine({
    id: "exam",
    initial: "loading",
    context: { items: [], session: null, revision: 0, after: "active", error: null, blueprintIds },
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: [
            { guard: ({ event }) => !event.output || !blueprintIds.includes((event.output as ExamCheckpoint).session.blueprintId), target: "setup",
              actions: assign({ revision: ({ event }) => (event.output as ExamCheckpoint | null)?.revision ?? 0 }) },
            { guard: ({ event }) => Boolean((event.output as ExamCheckpoint).session.finishedAt), target: "finished",
              actions: assign(({ event }) => { const cp = event.output as ExamCheckpoint;
                return { session: cp.session, revision: cp.revision, items: itemsFor(cp.session.blueprintId) }; }) },
            { target: "active", actions: assign(({ event }) => { const cp = event.output as ExamCheckpoint;
                return { session: cp.session, revision: cp.revision, items: itemsFor(cp.session.blueprintId) }; }) },
          ],
          onError: { target: "setup", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
      setup: {
        on: {
          START: { target: "saving", actions: assign(({ event }) => ({
            items: itemsFor(event.blueprintId), after: "active" as const, error: null,
            session: createSession(event.blueprintId, event.minutes, new Date(event.now), event.sessionId) })) },
        },
      },
      saving: {
        invoke: {
          src: "persist",
          input: ({ context }) => ({ session: context.session!, revision: context.revision }),
          onDone: [
            { guard: ({ context }) => context.after === "finished", target: "finished",
              actions: assign({ revision: ({ event }) => event.output.revision, error: null }) },
            { target: "active", actions: assign({ revision: ({ event }) => event.output.revision, error: null }) },
          ],
          onError: { target: "saveError", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
      saveError: { on: { RETRY: "saving" } },
      active: {
        on: {
          ANSWER: [
            { guard: "runningExpired", target: "expired" },
            { actions: assign({ session: ({ context, event }) => writeAnswer(context.session!, event.itemId, event.value, new Date(event.now)) }) },
          ],
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
        },
      },
      confirming: {
        on: {
          CANCEL_FINISH: "active",
          CONFIRM_FINISH: { target: "saving", actions: assign(({ context, event }) => ({ after: "finished" as const,
            session: finishSession(context.session!, new Date(event.now)) })) },
        },
      },
      expired: {
        on: {
          CONFIRM_FINISH: { target: "saving", actions: assign(({ context, event }) => ({ after: "finished" as const,
            session: finishSession(context.session!, new Date(event.now)) })) },
        },
      },
      finished: { on: { NEW_REHEARSAL: "clearing" } },
      clearing: {
        invoke: {
          src: "clear", input: ({ context }) => ({ revision: context.revision }),
          onDone: { target: "setup", actions: assign({ session: null, items: [], revision: 0, error: null }) },
          onError: { target: "finished", actions: assign({ error: ({ event }) => codeOf(event.error) }) },
        },
      },
    },
  });
}
