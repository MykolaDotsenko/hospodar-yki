/**
 * Web LEARN persistence on IndexedDB via Dexie (ADR-024: Web = Dexie/IndexedDB).
 * One versioned learner document, compare-and-swap on `revision`, committed in a single
 * readwrite transaction. The UI shows "saved" only after this promise resolves
 * (CONTRACTS rule 8). Separate DB name: never touches the legacy app's localStorage/IDB.
 */
import Dexie, { type Table } from "dexie";
import { blankState, type LearnerState } from "@hospodar/domain";

export const WEB_DB_NAME = "hospodar-yki:web:v1";
export type StorageErrorCode = "REVISION_CONFLICT" | "QUOTA_OR_DISK_FULL" | "SAVE_FAILED" | "READ_FAILED";
export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode, message: string) { super(message); this.name = "StorageError"; }
}
interface LearnerRow { id: "current"; revision: number; state: LearnerState; updatedAt: string }

class WebDb extends Dexie {
  learner!: Table<LearnerRow, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({ learner: "id" });
  }
}

export interface LearnerSnapshot { state: LearnerState; revision: number }
export interface LearnerRepository {
  read(): Promise<LearnerSnapshot>;
  commit(next: LearnerState, expectedRevision: number): Promise<LearnerSnapshot>;
  deleteAll(): Promise<void>;
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
  };
}
