/**
 * EXAM checkpoint persistence (ADR-024: Web = Dexie/IndexedDB). A SEPARATE database from LEARN, so exam drafts can
 * never mix with learning evidence (ExamCheckpoint ≠ FirstAttemptEvent). One current rehearsal, compare-and-swap on
 * `revision`, committed in one readwrite transaction; the machine moves on only after this promise resolves.
 * v2 (additive): `history` — one summary per finished rehearsal, written in the SAME transaction as the finish.
 */
import Dexie, { type Table } from "dexie";
import type { ExamSession, ExamSkill } from "@hospodar/domain";
import { StorageError } from "./learnerRepository.ts";

export const EXAM_DB_NAME = "hospodar-yki:web-exam:v1";
interface CheckpointRow { id: "current"; revision: number; session: ExamSession; skills: ExamSkill[] | null; updatedAt: string }
/** Attempt history (EXAM-09/AC-21): objective counts only — never a grade or pass prediction. */
export interface ExamHistoryRecord {
  sessionId: string; blueprintId: string; contentVersion: string; skills: ExamSkill[] | null;
  startedAt: string; finishedAt: string; timeLimitMinutes: number;
  bySkill: Record<ExamSkill, { correct: number; objective: number; ungraded: number; unanswered: number }>;
  /** TZ-EXAM-02: profile id + content hash the attempt ran on (absent for attempts before profiles existed). */
  profileId?: string; profileHash?: string;
}

class ExamDb extends Dexie {
  checkpoints!: Table<CheckpointRow, string>;
  history!: Table<ExamHistoryRecord, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({ checkpoints: "id" });
    this.version(2).stores({ checkpoints: "id", history: "sessionId, finishedAt" });   // additive: v1 rows untouched
  }
}

export interface ExamCheckpoint { session: ExamSession; revision: number; skills: ExamSkill[] | null }
export interface ExamRepository {
  read(): Promise<ExamCheckpoint | null>;
  commit(session: ExamSession, expectedRevision: number, skills: ExamSkill[] | null): Promise<ExamCheckpoint>;
  /** Finish = checkpoint + history record, atomically. */
  finish(session: ExamSession, expectedRevision: number, skills: ExamSkill[] | null, record: ExamHistoryRecord): Promise<ExamCheckpoint>;
  clear(expectedRevision: number): Promise<void>;
  history(): Promise<ExamHistoryRecord[]>;
  /** LEARN-16 control for exam data: erase the current rehearsal AND all history in one transaction (CAS), then verify. */
  eraseAll(expectedRevision: number): Promise<void>;
}

function mapError(e: unknown): StorageError {
  if (e instanceof StorageError) return e;
  const name = (e as { name?: string; inner?: { name?: string } })?.inner?.name ?? (e as { name?: string })?.name;
  return new StorageError(name === "QuotaExceededError" ? "QUOTA_OR_DISK_FULL" : "SAVE_FAILED", String((e as Error)?.message ?? e));
}

export function createExamRepository(dbName: string = EXAM_DB_NAME): ExamRepository {
  const db = new ExamDb(dbName);
  const cas = async (expectedRevision: number) => {
    const current = (await db.checkpoints.get("current"))?.revision ?? 0;
    if (current !== expectedRevision) throw new StorageError("REVISION_CONFLICT", "The rehearsal was changed in another tab");
    return current + 1;
  };
  /** A successful transaction alone is not an E07 readback receipt. Re-open stored bytes
   * and compare the exact session (including composed Unicode), scope and finish history.
   * A competing tab or ambiguous read is reported, never shown as a successful save. */
  const verifyCommitted = async (session: ExamSession, revision: number, skills: ExamSkill[] | null, record?: ExamHistoryRecord) => {
    try {
      const { row, history } = await db.transaction("r", db.checkpoints, db.history, async () => ({
        row: await db.checkpoints.get("current"),
        history: record ? await db.history.get(record.sessionId) : undefined,
      }));
      if (!row || row.revision !== revision ||
          JSON.stringify(row.session) !== JSON.stringify(session) ||
          JSON.stringify(row.skills ?? null) !== JSON.stringify(skills) ||
          (record && JSON.stringify(history) !== JSON.stringify(record)))
        throw new StorageError("READBACK_MISMATCH", "Committed EXAM checkpoint differs from persisted data");
    } catch (e) {
      if (e instanceof StorageError) throw e;
      throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e));
    }
  };
  return {
    async read() {
      try {
        const row = await db.checkpoints.get("current");
        return row ? { session: row.session, revision: row.revision, skills: row.skills ?? null } : null;
      } catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
    async commit(session, expectedRevision, skills) {
      try {
        const saved = await db.transaction("rw", db.checkpoints, async () => {
          const revision = await cas(expectedRevision);
          await db.checkpoints.put({ id: "current", revision, session, skills, updatedAt: new Date().toISOString() });
          return { session, revision, skills };
        });
        await verifyCommitted(session, saved.revision, skills);
        return saved;
      } catch (e) { throw mapError(e); }
    },
    async finish(session, expectedRevision, skills, record) {
      try {
        const saved = await db.transaction("rw", db.checkpoints, db.history, async () => {
          const revision = await cas(expectedRevision);
          await db.checkpoints.put({ id: "current", revision, session, skills, updatedAt: new Date().toISOString() });
          await db.history.put(record);
          return { session, revision, skills };
        });
        await verifyCommitted(session, saved.revision, skills, record);
        return saved;
      } catch (e) { throw mapError(e); }
    },
    async clear(expectedRevision) {
      try {
        await db.transaction("rw", db.checkpoints, async () => {
          await cas(expectedRevision);
          await db.checkpoints.delete("current");
        });
      } catch (e) { throw mapError(e); }
    },
    async eraseAll(expectedRevision) {
      try {
        await db.transaction("rw", db.checkpoints, db.history, async () => {
          await cas(expectedRevision);
          await db.checkpoints.clear();
          await db.history.clear();
        });
      } catch (e) { throw mapError(e); }
      if ((await db.checkpoints.count()) !== 0 || (await db.history.count()) !== 0)
        throw new StorageError("DELETE_NOT_VERIFIED", "Some exam data is still stored");
    },
    async history() {
      try { return (await db.history.orderBy("finishedAt").reverse().toArray()); }
      catch (e) { throw new StorageError("READ_FAILED", String((e as Error)?.message ?? e)); }
    },
  };
}
