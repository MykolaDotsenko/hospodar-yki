/**
 * Web LEARN persistence on IndexedDB via Dexie (ADR-024: Web = Dexie/IndexedDB).
 * One versioned learner document, compare-and-swap on `revision`, committed in a single
 * readwrite transaction. The UI shows "saved" only after this promise resolves
 * (CONTRACTS rule 8). Separate DB name: never touches the legacy app's localStorage/IDB.
 */
import Dexie, { type Table } from "dexie";
import { blankState, type LearnerState, type WebRestoreImport } from "@hospodar/domain";
import type { MissionDraftPayload } from "./missionDraft.ts";
import type { ClinicDraftPayload } from "./clinicDraft.ts";
import type { ReadingDraftPayload } from "./readingDraft.ts";
import type { ListeningDraftPayload } from "./listeningDraft.ts";

export const WEB_DB_NAME = "hospodar-yki:web:v1";
export type StorageErrorCode = "REVISION_CONFLICT" | "QUOTA_OR_DISK_FULL" | "SAVE_FAILED" | "READ_FAILED" | "DESTINATION_NOT_EMPTY" | "READBACK_MISMATCH" | "DELETE_NOT_VERIFIED";
export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode, message: string) { super(message); this.name = "StorageError"; }
}
interface LearnerRow { id: "current"; revision: number; state: LearnerState; updatedAt: string }
export interface MissionDraftRow extends MissionDraftPayload {
  id: "active"; revision: number; learnerRevision: number; savedAt: string;
}
export interface ClinicDraftRow extends ClinicDraftPayload {
  id: "active"; revision: number; learnerRevision: number; savedAt: string;
}
export interface ReadingDraftRow extends ReadingDraftPayload {
  id: "active"; revision: number; learnerRevision: number; savedAt: string;
}
export interface ListeningDraftRow extends ListeningDraftPayload {
  id: "active"; revision: number; learnerRevision: number; savedAt: string;
}
/** Proof of what was imported from the legacy app: hash of the exact original bytes + counts. */
export interface ImportReceipt {
  id: string; source: "legacy_v1_file" | "legacy_v1_this_device"; originalSha256: string; originalBytes: number;
  counts: { attempts: number; diagnostics: number; errors: number; retention: number; cards: number };
  importedAt: string; revision: number;
}

class WebDb extends Dexie {
  learner!: Table<LearnerRow, string>;
  imports!: Table<ImportReceipt, string>;
  missionDraft!: Table<MissionDraftRow, string>;
  clinicDraft!: Table<ClinicDraftRow, string>;
  readingDraft!: Table<ReadingDraftRow, string>;
  listeningDraft!: Table<ListeningDraftRow, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({ learner: "id" });
    this.version(2).stores({ learner: "id", imports: "id" }); // additive: v1 rows untouched
    this.version(3).stores({ learner: "id", imports: "id", missionDraft: "id" }); // additive: no migrations of LEARN history
    this.version(4).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id" }); // independent writing drafts
    this.version(5).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id", readingDraft: "id" }); // independent Reading drafts
    this.version(6).stores({ learner: "id", imports: "id", missionDraft: "id", clinicDraft: "id", readingDraft: "id", listeningDraft: "id" }); // independent Listening drafts
  }
}

export interface LearnerSnapshot { state: LearnerState; revision: number }
export interface LearnerRepository {
  read(): Promise<LearnerSnapshot>;
  commit(next: LearnerState, expectedRevision: number): Promise<LearnerSnapshot>;
  /** LEARN-16: erase progress AND import receipts in one transaction (CAS), then verify by readback. */
  eraseAll(expectedRevision: number, expectedDraftRevision?: number, expectedClinicRevision?: number, expectedReadingRevision?: number, expectedListeningRevision?: number): Promise<LearnerSnapshot>;
  /** Import legacy V1 progress into an EMPTY new-app profile, atomically with its receipt. */
  importLegacy(state: LearnerState, receipt: Omit<ImportReceipt, "revision" | "importedAt">): Promise<{ snapshot: LearnerSnapshot; receipt: ImportReceipt }>;
  /** Restore only LEARN from a validated new-Web JSON export into an empty profile (never EXAM/audio). */
  restoreWebLearn(state: LearnerState, imports: WebRestoreImport[], expectedRevision: number): Promise<LearnerSnapshot>;
  listImports(): Promise<ImportReceipt[]>;
  /** A paused, ungraded LEARN cloze checkpoint. Not part of EXAM/finished LEARN history. */
  readMissionDraft(): Promise<MissionDraftRow | null>;
  /** CAS the draft AND the underlying completed LEARN revision (multi-tab safe). */
  saveMissionDraft(draft: MissionDraftPayload, expectedLearnerRevision: number, expectedDraftRevision: number): Promise<MissionDraftRow>;
  /** Atomically write finished LEARN history and delete the *matching* checkpoint. */
  finishMissionDraft(next: LearnerState, expectedLearnerRevision: number, expectedDraftRevision: number, taskId: string): Promise<LearnerSnapshot>;
  /** Explicit abandonment only, no automatic lost progress. */
  discardMissionDraft(expectedLearnerRevision: number, expectedDraftRevision: number): Promise<void>;
  /** A separate, ungraded writing-clinic checkpoint (not part of Web JSON export). */
  readClinicDraft(): Promise<ClinicDraftRow | null>;
  saveClinicDraft(draft: ClinicDraftPayload, expectedLearnerRevision: number, expectedDraftRevision: number): Promise<ClinicDraftRow>;
  /** Atomically record independent first writing and transition from self-check to spot. */
  commitClinicDraftEvidence(next: LearnerState, draft: ClinicDraftPayload, expectedLearnerRevision: number, expectedDraftRevision: number): Promise<{ snapshot: LearnerSnapshot; draft: ClinicDraftRow }>;
  /** Atomically record guided rewrite and independent transfer, then remove checkpoint. */
  finishClinicDraft(next: LearnerState, expectedLearnerRevision: number, expectedDraftRevision: number, itemId: string, exactTransfer: string): Promise<LearnerSnapshot>;
  discardClinicDraft(expectedLearnerRevision: number, expectedDraftRevision: number): Promise<void>;
  /** Unfinished Reading answers are device-local drafts, not finished diagnostic evidence. */
  readReadingDraft(): Promise<ReadingDraftRow | null>;
  saveReadingDraft(draft: ReadingDraftPayload, expectedLearnerRevision: number, expectedDraftRevision: number): Promise<ReadingDraftRow>;
  /** Complete reading evidence and delete the matching transfer checkpoint in ONE transaction. */
  finishReadingDraft(next: LearnerState, expectedLearnerRevision: number, expectedDraftRevision: number, itemId: string, exactTransfer: string): Promise<LearnerSnapshot>;
  discardReadingDraft(expectedLearnerRevision: number, expectedDraftRevision: number): Promise<void>;
  /** Paused listening stage and support-attribution are never scored until confirmed completion. */
  readListeningDraft(): Promise<ListeningDraftRow | null>;
  saveListeningDraft(draft: ListeningDraftPayload, expectedLearnerRevision: number, expectedDraftRevision: number): Promise<ListeningDraftRow>;
  finishListeningDraft(next: LearnerState, expectedLearnerRevision: number, expectedDraftRevision: number, lessonId: string): Promise<LearnerSnapshot>;
  discardListeningDraft(expectedLearnerRevision: number, expectedDraftRevision: number): Promise<void>;
}

function mapError(e: unknown): StorageError {
  if (e instanceof StorageError) return e;
  const name = (e as { name?: string; inner?: { name?: string } })?.inner?.name ?? (e as { name?: string })?.name;
  return new StorageError(name === "QuotaExceededError" ? "QUOTA_OR_DISK_FULL" : "SAVE_FAILED", String((e as Error)?.message ?? e));
}

export function createLearnerRepository(dbName: string = WEB_DB_NAME): LearnerRepository {
  const db = new WebDb(dbName);
  return {
    async read() {
      try {
        const row = await db.learner.get("current");
        return row ? { state: row.state, revision: row.revision } : { state: blankState(), revision: 0 };
      } catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async commit(next, expectedRevision) {
      try {
        return await db.transaction("rw", db.learner, async () => {
          const row = await db.learner.get("current");
          const current = row?.revision ?? 0;
          if (current !== expectedRevision) throw new StorageError("REVISION_CONFLICT", "Progress was changed in another tab");
          const revision = current + 1;
          await db.learner.put({ id: "current", revision, state: next, updatedAt: new Date().toISOString() });
          return { state: next, revision };
        });
      } catch (e) { throw mapError(e); }
    },
    async eraseAll(expectedRevision, expectedDraftRevision = 0, expectedClinicRevision = 0, expectedReadingRevision = 0, expectedListeningRevision = 0) {
      try {
        await db.transaction("rw", db.learner, db.imports, db.missionDraft, db.clinicDraft, db.readingDraft, db.listeningDraft, async () => {
          const current = (await db.learner.get("current"))?.revision ?? 0;
          const activeDraftRevision = (await db.missionDraft.get("active"))?.revision ?? 0;
          const clinicRevision = (await db.clinicDraft.get("active"))?.revision ?? 0;
          const readingRevision = (await db.readingDraft.get("active"))?.revision ?? 0;
          const listeningRevision = (await db.listeningDraft.get("active"))?.revision ?? 0;
          if (current !== expectedRevision || activeDraftRevision !== expectedDraftRevision || clinicRevision !== expectedClinicRevision || readingRevision !== expectedReadingRevision || listeningRevision !== expectedListeningRevision)
            throw new StorageError("REVISION_CONFLICT", "LEARN progress or draft changed in another tab");
          await db.learner.clear();
          await db.imports.clear();
          await db.missionDraft.clear();
          await db.clinicDraft.clear();
          await db.readingDraft.clear();
          await db.listeningDraft.clear();
        });
      } catch (e) { throw mapError(e); }
      if ((await db.learner.count()) !== 0 || (await db.imports.count()) !== 0 ||
          (await db.missionDraft.count()) !== 0 || (await db.clinicDraft.count()) !== 0 ||
          (await db.readingDraft.count()) !== 0 || (await db.listeningDraft.count()) !== 0)
        throw new StorageError("DELETE_NOT_VERIFIED", "Some progress is still stored");
      return { state: blankState(), revision: 0 };
    },
    async importLegacy(state, partial) {
      let result: { snapshot: LearnerSnapshot; receipt: ImportReceipt };
      try {
        result = await db.transaction("rw", db.learner, db.imports, db.missionDraft, db.clinicDraft, db.readingDraft, db.listeningDraft, async () => {
          if (await db.missionDraft.count() || await db.clinicDraft.count() || await db.readingDraft.count() || await db.listeningDraft.count()) throw new StorageError("DESTINATION_NOT_EMPTY", "An unfinished LEARN exercise exists");
          const row = await db.learner.get("current");
          // No merge: refuse if the new app already holds any learning history.
          if (row && (row.state.attempts.length || row.state.diagnostics.length || Object.keys(row.state.cards).length || row.state.retention.length))
            throw new StorageError("DESTINATION_NOT_EMPTY", "The new app already has progress");
          const revision = (row?.revision ?? 0) + 1;
          const importedAt = new Date().toISOString();
          const receipt: ImportReceipt = { ...partial, importedAt, revision };
          await db.learner.put({ id: "current", revision, state, updatedAt: importedAt });
          await db.imports.put(receipt);
          return { snapshot: { state, revision }, receipt };
        });
      } catch (e) { throw mapError(e); }
      // Read back in a fresh transaction: counts must match what was previewed.
      const back = await db.learner.get("current");
      const c = back?.state;
      if (!c || back.revision !== result.receipt.revision || c.attempts.length !== partial.counts.attempts ||
          c.diagnostics.length !== partial.counts.diagnostics || c.errors.length !== partial.counts.errors ||
          c.retention.length !== partial.counts.retention || Object.keys(c.cards).length !== partial.counts.cards)
        throw new StorageError("READBACK_MISMATCH", "Imported progress could not be verified");
      return result;
    },
    async restoreWebLearn(state, imports, expectedRevision) {
      let snapshot: LearnerSnapshot;
      try {
        snapshot = await db.transaction("rw", db.learner, db.imports, db.missionDraft, db.clinicDraft, db.readingDraft, db.listeningDraft, async () => {
          const row = await db.learner.get("current");
          if ((row?.revision ?? 0) !== expectedRevision)
            throw new StorageError("REVISION_CONFLICT", "The profile changed in another tab");
          // An existing blank row is still owned by another workflow. Never silently overwrite it.
          if (row || await db.imports.count() || await db.missionDraft.count() || await db.clinicDraft.count() || await db.readingDraft.count() || await db.listeningDraft.count())
            throw new StorageError("DESTINATION_NOT_EMPTY", "Existing LEARN data or receipts must not be overwritten");
          const revision = 1;
          await db.learner.add({ id: "current", revision, state, updatedAt: new Date().toISOString() });
          if (imports.length) await db.imports.bulkAdd(imports as ImportReceipt[]);
          return { state, revision };
        });
      } catch (e) { throw mapError(e); }
      // This is a fresh transaction, not the in-memory object returned by the write.
      try {
        const [back, receipts] = await db.transaction("r", db.learner, db.imports, async () =>
          Promise.all([db.learner.get("current"), db.imports.toArray()]));
        const byId = (xs: WebRestoreImport[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id));
        if (!back || back.revision !== snapshot.revision ||
            JSON.stringify(back.state) !== JSON.stringify(state) ||
            JSON.stringify(byId(receipts)) !== JSON.stringify(byId(imports)))
          throw new StorageError("READBACK_MISMATCH", "Restored LEARN data could not be verified");
        return snapshot;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async listImports() { return db.imports.toArray(); },
    async readMissionDraft() {
      try { return (await db.missionDraft.get("active")) ?? null; }
      catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async saveMissionDraft(draft, expectedLearnerRevision, expectedDraftRevision) {
      let row: MissionDraftRow;
      try {
        row = await db.transaction("rw", db.learner, db.missionDraft, async () => {
          const learnerRevision = (await db.learner.get("current"))?.revision ?? 0;
          const old = await db.missionDraft.get("active");
          if (learnerRevision !== expectedLearnerRevision ||
              (old?.revision ?? 0) !== expectedDraftRevision ||
              (old && old.learnerRevision !== learnerRevision))
            throw new StorageError("REVISION_CONFLICT", "LEARN progress or mission draft changed in another tab");
          const stored: MissionDraftRow = {
            ...structuredClone(draft), id: "active",
            revision: expectedDraftRevision + 1, learnerRevision,
            savedAt: new Date().toISOString(),
          };
          await db.missionDraft.put(stored);
          return stored;
        });
      } catch (e) { throw mapError(e); }
      try {
        const back = await db.missionDraft.get("active");
        if (JSON.stringify(back) !== JSON.stringify(row))
          throw new StorageError("READBACK_MISMATCH", "Mission draft was not durably reread");
        return row;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async finishMissionDraft(next, expectedLearnerRevision, expectedDraftRevision, taskId) {
      let saved: LearnerSnapshot;
      try {
        saved = await db.transaction("rw", db.learner, db.missionDraft, async () => {
          const learner = await db.learner.get("current");
          const draft = await db.missionDraft.get("active");
          if ((learner?.revision ?? 0) !== expectedLearnerRevision ||
              !draft || draft.revision !== expectedDraftRevision ||
              draft.learnerRevision !== expectedLearnerRevision ||
              draft.mission.taskId !== taskId || draft.mission.phase !== "transfer")
            throw new StorageError("REVISION_CONFLICT", "The unfinished draft is missing, stale or belongs to a different task");
          const revision = expectedLearnerRevision + 1;
          await db.learner.put({ id: "current", revision, state: next, updatedAt: new Date().toISOString() });
          await db.missionDraft.delete("active");
          return { state: next, revision };
        });
      } catch (e) { throw mapError(e); }
      try {
        const [learner, draft] = await db.transaction("r", db.learner, db.missionDraft, async () =>
          Promise.all([db.learner.get("current"), db.missionDraft.get("active")]));
        if (!learner || learner.revision !== saved.revision || draft ||
            JSON.stringify(learner.state) !== JSON.stringify(next))
          throw new StorageError("READBACK_MISMATCH", "Completed LEARN progress not confirmed in storage");
        return saved;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async discardMissionDraft(expectedLearnerRevision, expectedDraftRevision) {
      try {
        await db.transaction("rw", db.learner, db.missionDraft, async () => {
          const revision = (await db.learner.get("current"))?.revision ?? 0;
          const current = await db.missionDraft.get("active");
          if (revision !== expectedLearnerRevision || !current ||
              current.revision !== expectedDraftRevision)
            throw new StorageError("REVISION_CONFLICT", "Draft was changed or already discarded");
          await db.missionDraft.delete("active");
        });
        if (await db.missionDraft.get("active"))
          throw new StorageError("READBACK_MISMATCH", "Discard could not be verified");
      } catch (e) { throw mapError(e); }
    },
    async readClinicDraft() {
      try { return (await db.clinicDraft.get("active")) ?? null; }
      catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async saveClinicDraft(payload, expectedLearnerRevision, expectedDraftRevision) {
      let stored: ClinicDraftRow;
      try {
        stored = await db.transaction("rw", db.learner, db.clinicDraft, async () => {
          const learnerRevision = (await db.learner.get("current"))?.revision ?? 0;
          const old = await db.clinicDraft.get("active");
          if (learnerRevision !== expectedLearnerRevision || (old?.revision ?? 0) !== expectedDraftRevision ||
              (old && (old.learnerRevision !== learnerRevision || old.session.itemId !== payload.session.itemId)))
            throw new StorageError("REVISION_CONFLICT", "LEARN profile or writing draft changed in another tab");
          const row: ClinicDraftRow = { ...structuredClone(payload), id: "active",
            revision: expectedDraftRevision + 1, learnerRevision, savedAt: new Date().toISOString() };
          await db.clinicDraft.put(row);
          return row;
        });
      } catch (e) { throw mapError(e); }
      try {
        const reread = await db.clinicDraft.get("active");
        if (JSON.stringify(reread) !== JSON.stringify(stored))
          throw new StorageError("READBACK_MISMATCH", "Writing checkpoint was not confirmed");
        return stored;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async commitClinicDraftEvidence(next, payload, expectedLearnerRevision, expectedDraftRevision) {
      let saved: { snapshot: LearnerSnapshot; draft: ClinicDraftRow };
      try {
        saved = await db.transaction("rw", db.learner, db.clinicDraft, async () => {
          const revision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.clinicDraft.get("active");
          if (revision !== expectedLearnerRevision || !draft || draft.revision !== expectedDraftRevision ||
              draft.learnerRevision !== expectedLearnerRevision || draft.session.phase !== "selfcheck" ||
              payload.session.phase !== "spot" || draft.session.itemId !== payload.session.itemId ||
              draft.session.draft !== payload.session.draft)
            throw new StorageError("REVISION_CONFLICT", "Writing first attempt or profile changed in another tab");
          const newRev = revision + 1;
          const row: ClinicDraftRow = { ...structuredClone(payload), id: "active",
            revision: expectedDraftRevision + 1, learnerRevision: newRev, savedAt: new Date().toISOString() };
          await db.learner.put({ id: "current", revision: newRev, state: next, updatedAt: row.savedAt });
          await db.clinicDraft.put(row);
          return { snapshot: { state: next, revision: newRev }, draft: row };
        });
      } catch (e) { throw mapError(e); }
      try {
        const [learner, draft] = await db.transaction("r", db.learner, db.clinicDraft,
          async () => Promise.all([db.learner.get("current"), db.clinicDraft.get("active")]));
        if (learner?.revision !== saved.snapshot.revision ||
            JSON.stringify(learner?.state) !== JSON.stringify(next) ||
            JSON.stringify(draft) !== JSON.stringify(saved.draft))
          throw new StorageError("READBACK_MISMATCH", "Writing evidence/checkpoint commit not confirmed");
        return saved;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async finishClinicDraft(next, expectedLearnerRevision, expectedDraftRevision, itemId, exactTransfer) {
      let saved: LearnerSnapshot;
      try {
        saved = await db.transaction("rw", db.learner, db.clinicDraft, async () => {
          const revision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.clinicDraft.get("active");
          if (revision !== expectedLearnerRevision || !draft ||
              draft.revision !== expectedDraftRevision || draft.learnerRevision !== revision ||
              draft.session.phase !== "transfer" || draft.session.itemId !== itemId ||
              draft.input !== exactTransfer)
            throw new StorageError("REVISION_CONFLICT", "Writing response is not durably saved or is stale");
          const newRev = revision + 1;
          await db.learner.put({ id: "current", revision: newRev, state: next, updatedAt: new Date().toISOString() });
          await db.clinicDraft.delete("active");
          return { state: next, revision: newRev };
        });
      } catch (e) { throw mapError(e); }
      try {
        const [learner, draft] = await db.transaction("r", db.learner, db.clinicDraft,
          async () => Promise.all([db.learner.get("current"), db.clinicDraft.get("active")]));
        if (learner?.revision !== saved.revision || draft ||
            JSON.stringify(learner?.state) !== JSON.stringify(next))
          throw new StorageError("READBACK_MISMATCH", "Completed writing evidence was not confirmed");
        return saved;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async discardClinicDraft(expectedLearnerRevision, expectedDraftRevision) {
      try {
        await db.transaction("rw", db.learner, db.clinicDraft, async () => {
          const revision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.clinicDraft.get("active");
          if (revision !== expectedLearnerRevision || draft?.revision !== expectedDraftRevision)
            throw new StorageError("REVISION_CONFLICT", "Writing draft was changed or already discarded");
          await db.clinicDraft.delete("active");
        });
        if (await db.clinicDraft.get("active"))
          throw new StorageError("READBACK_MISMATCH", "Writing draft deletion not confirmed");
      } catch (e) { throw mapError(e); }
    },

    async readReadingDraft() {
      try { return (await db.readingDraft.get("active")) ?? null; }
      catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async saveReadingDraft(payload, expectedLearnerRevision, expectedDraftRevision) {
      let stored: ReadingDraftRow;
      try {
        stored = await db.transaction("rw", db.learner, db.readingDraft, async () => {
          const learnerRevision = (await db.learner.get("current"))?.revision ?? 0;
          const old = await db.readingDraft.get("active");
          if (learnerRevision !== expectedLearnerRevision ||
              (old?.revision ?? 0) !== expectedDraftRevision ||
              (old && (old.learnerRevision !== learnerRevision || old.session.itemId !== payload.session.itemId)))
            throw new StorageError("REVISION_CONFLICT", "LEARN profile or reading draft changed in another tab");
          const row: ReadingDraftRow = { ...structuredClone(payload), id: "active",
            revision: expectedDraftRevision + 1, learnerRevision, savedAt: new Date().toISOString() };
          await db.readingDraft.put(row);
          return row;
        });
      } catch (e) { throw mapError(e); }
      try {
        const back = await db.readingDraft.get("active");
        if (JSON.stringify(back) !== JSON.stringify(stored))
          throw new StorageError("READBACK_MISMATCH", "Reading checkpoint was not confirmed");
        return stored;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async finishReadingDraft(next, expectedLearnerRevision, expectedDraftRevision, itemId, exactTransfer) {
      let saved: LearnerSnapshot;
      try {
        saved = await db.transaction("rw", db.learner, db.readingDraft, async () => {
          const revision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.readingDraft.get("active");
          if (revision !== expectedLearnerRevision || !draft ||
              draft.revision !== expectedDraftRevision || draft.learnerRevision !== revision ||
              draft.session.phase !== "transfer" || draft.session.itemId !== itemId ||
              draft.input !== exactTransfer)
            throw new StorageError("REVISION_CONFLICT", "Reading response was not durably saved or is stale");
          const nextRevision = revision + 1;
          await db.learner.put({ id: "current", revision: nextRevision, state: next, updatedAt: new Date().toISOString() });
          await db.readingDraft.delete("active");
          return { state: next, revision: nextRevision };
        });
      } catch (e) { throw mapError(e); }
      try {
        const [learner, draft] = await db.transaction("r", db.learner, db.readingDraft,
          async () => Promise.all([db.learner.get("current"), db.readingDraft.get("active")]));
        if (learner?.revision !== saved.revision || draft ||
            JSON.stringify(learner?.state) !== JSON.stringify(next))
          throw new StorageError("READBACK_MISMATCH", "Completed Reading evidence was not confirmed");
        return saved;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async discardReadingDraft(expectedLearnerRevision, expectedDraftRevision) {
      try {
        await db.transaction("rw", db.learner, db.readingDraft, async () => {
          const learnerRevision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.readingDraft.get("active");
          if (learnerRevision !== expectedLearnerRevision || draft?.revision !== expectedDraftRevision ||
              draft.learnerRevision !== learnerRevision)
            throw new StorageError("REVISION_CONFLICT", "Reading draft was changed or already discarded");
          await db.readingDraft.delete("active");
        });
        if (await db.readingDraft.get("active"))
          throw new StorageError("READBACK_MISMATCH", "Reading draft deletion not confirmed");
      } catch (e) { throw mapError(e); }
    },

    async readListeningDraft() {
      try { return (await db.listeningDraft.get("active")) ?? null; }
      catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async saveListeningDraft(payload, expectedLearnerRevision, expectedDraftRevision) {
      let stored: ListeningDraftRow;
      try {
        stored = await db.transaction("rw", db.learner, db.listeningDraft, async () => {
          const learnerRevision = (await db.learner.get("current"))?.revision ?? 0;
          const old = await db.listeningDraft.get("active");
          if (learnerRevision !== expectedLearnerRevision ||
              (old?.revision ?? 0) !== expectedDraftRevision ||
              (old && (old.learnerRevision !== learnerRevision || old.session.lessonId !== payload.session.lessonId)))
            throw new StorageError("REVISION_CONFLICT", "LEARN profile or Listening draft changed in another tab");
          const row: ListeningDraftRow = { ...structuredClone(payload), id: "active",
            revision: expectedDraftRevision + 1, learnerRevision, savedAt: new Date().toISOString() };
          await db.listeningDraft.put(row);
          return row;
        });
      } catch (e) { throw mapError(e); }
      try {
        const back = await db.listeningDraft.get("active");
        if (JSON.stringify(back) !== JSON.stringify(stored))
          throw new StorageError("READBACK_MISMATCH", "Listening checkpoint was not confirmed");
        return stored;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async finishListeningDraft(next, expectedLearnerRevision, expectedDraftRevision, lessonId) {
      let saved: LearnerSnapshot;
      try {
        saved = await db.transaction("rw", db.learner, db.listeningDraft, async () => {
          const revision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.listeningDraft.get("active");
          if (revision !== expectedLearnerRevision || !draft ||
              draft.revision !== expectedDraftRevision || draft.learnerRevision !== revision ||
              !["feedback", "review"].includes(draft.session.phase) ||
              draft.session.lessonId !== lessonId || draft.input !== "")
            throw new StorageError("REVISION_CONFLICT", "Listening checkpoint is missing, stale or not ready");
          const nextRevision = revision + 1;
          await db.learner.put({ id: "current", revision: nextRevision, state: next, updatedAt: new Date().toISOString() });
          await db.listeningDraft.delete("active");
          return { state: next, revision: nextRevision };
        });
      } catch (e) { throw mapError(e); }
      try {
        const [learner, draft] = await db.transaction("r", db.learner, db.listeningDraft,
          async () => Promise.all([db.learner.get("current"), db.listeningDraft.get("active")]));
        if (learner?.revision !== saved.revision || draft ||
            JSON.stringify(learner?.state) !== JSON.stringify(next))
          throw new StorageError("READBACK_MISMATCH", "Completed Listening evidence was not confirmed");
        return saved;
      } catch (e) {
        if (e instanceof StorageError) throw e;
        throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
      }
    },
    async discardListeningDraft(expectedLearnerRevision, expectedDraftRevision) {
      try {
        await db.transaction("rw", db.learner, db.listeningDraft, async () => {
          const learnerRevision = (await db.learner.get("current"))?.revision ?? 0;
          const draft = await db.listeningDraft.get("active");
          if (learnerRevision !== expectedLearnerRevision || draft?.revision !== expectedDraftRevision ||
              draft.learnerRevision !== learnerRevision)
            throw new StorageError("REVISION_CONFLICT", "Listening draft changed in another tab");
          await db.listeningDraft.delete("active");
        });
        if (await db.listeningDraft.get("active"))
          throw new StorageError("READBACK_MISMATCH", "Listening draft deletion not confirmed");
      } catch (e) { throw mapError(e); }
    },

  };
}
