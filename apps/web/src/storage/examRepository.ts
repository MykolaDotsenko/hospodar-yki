/**
 * EXAM checkpoint persistence (ADR-024: Web = Dexie/IndexedDB). A SEPARATE database from LEARN, so exam drafts can
 * never mix with learning evidence (ExamCheckpoint ≠ FirstAttemptEvent). One current rehearsal, compare-and-swap on
 * `revision`, committed in one readwrite transaction; the machine moves on only after this promise resolves.
 */
import Dexie, { type Table } from "dexie";
import type { ExamSession } from "@hospodar/domain";
import { StorageError } from "./learnerRepository.ts";

export const EXAM_DB_NAME = "hospodar-yki:web-exam:v1";
interface CheckpointRow { id: "current"; revision: number; session: ExamSession; updatedAt: string }

class ExamDb extends Dexie {
  checkpoints!: Table<CheckpointRow, string>;
  constructor(name: string) { super(name); this.version(1).stores({ checkpoints: "id" }); }
}

export interface ExamCheckpoint { session: ExamSession; revision: number }
export interface ExamRepository {
  read(): Promise<ExamCheckpoint | null>;
  commit(session: ExamSession, expectedRevision: number): Promise<ExamCheckpoint>;
  clear(expectedRevision: number): Promise<void>;
}

function mapError(e: unknown): StorageError {
  if (e instanceof StorageError) return e;
  const name = (e as { name?: string; inner?: { name?: string } })?.inner?.name ?? (e as { name?: string })?.name;
  return new StorageError(name === "QuotaExceededError" ? "QUOTA_OR_DISK_FULL" : "SAVE_FAILED", String((e as Error)?.message ?? e));
}

export function createExamRepository(dbName: string = EXAM_DB_NAME): ExamRepository {
  const db = new ExamDb(dbName);
  return {
    async read() {
      try {
        const row = await db.checkpoints.get("current");
        return row ? { session: row.session, revision: row.revision } : null;
      } catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async commit(session, expectedRevision) {
      try {
        return await db.transaction("rw", db.checkpoints, async () => {
          const current = (await db.checkpoints.get("current"))?.revision ?? 0;
          if (current !== expectedRevision) throw new StorageError("REVISION_CONFLICT", "The rehearsal was changed in another tab");
          const revision = current + 1;
          await db.checkpoints.put({ id: "current", revision, session, updatedAt: new Date().toISOString() });
          return { session, revision };
        });
      } catch (e) { throw mapError(e); }
    },
    async clear(expectedRevision) {
      try {
        await db.transaction("rw", db.checkpoints, async () => {
          const current = (await db.checkpoints.get("current"))?.revision ?? 0;
          if (current !== expectedRevision) throw new StorageError("REVISION_CONFLICT", "The rehearsal was changed in another tab");
          await db.checkpoints.delete("current");
        });
      } catch (e) { throw mapError(e); }
    },
  };
}
