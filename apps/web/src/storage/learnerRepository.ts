/**
 * Web LEARN persistence on IndexedDB via Dexie (ADR-024: Web = Dexie/IndexedDB).
 * One versioned learner document, compare-and-swap on `revision`, committed in a single
 * readwrite transaction. The UI shows "saved" only after this promise resolves
 * (CONTRACTS rule 8). Separate DB name: never touches the legacy app's localStorage/IDB.
 */
import Dexie, { type Table } from "dexie";
import { blankState, type LearnerState } from "@hospodar/domain";

export const WEB_DB_NAME = "hospodar-yki:web:v1";
export type StorageErrorCode = "REVISION_CONFLICT" | "QUOTA_OR_DISK_FULL" | "SAVE_FAILED" | "READ_FAILED" | "DESTINATION_NOT_EMPTY" | "READBACK_MISMATCH";
export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode, message: string) { super(message); this.name = "StorageError"; }
}
interface LearnerRow { id: "current"; revision: number; state: LearnerState; updatedAt: string }
/** Proof of what was imported from the legacy app: hash of the exact original bytes + counts. */
export interface ImportReceipt {
  id: string; source: "legacy_v1_file" | "legacy_v1_this_device"; originalSha256: string; originalBytes: number;
  counts: { attempts: number; diagnostics: number; errors: number; retention: number; cards: number };
  importedAt: string; revision: number;
}

class WebDb extends Dexie {
  learner!: Table<LearnerRow, string>;
  imports!: Table<ImportReceipt, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({ learner: "id" });
    this.version(2).stores({ learner: "id", imports: "id" }); // additive: v1 rows untouched
  }
}

export interface LearnerSnapshot { state: LearnerState; revision: number }
export interface LearnerRepository {
  read(): Promise<LearnerSnapshot>;
  commit(next: LearnerState, expectedRevision: number): Promise<LearnerSnapshot>;
  deleteAll(): Promise<void>;
  /** Import legacy V1 progress into an EMPTY new-app profile, atomically with its receipt. */
  importLegacy(state: LearnerState, receipt: Omit<ImportReceipt, "revision" | "importedAt">): Promise<{ snapshot: LearnerSnapshot; receipt: ImportReceipt }>;
  listImports(): Promise<ImportReceipt[]>;
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
    async deleteAll() { await db.delete(); },
    async importLegacy(state, partial) {
      let result: { snapshot: LearnerSnapshot; receipt: ImportReceipt };
      try {
        result = await db.transaction("rw", db.learner, db.imports, async () => {
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
    async listImports() { return db.imports.toArray(); },
  };
}
