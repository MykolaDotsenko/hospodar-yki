/**
 * S2 reviewer sandbox: the real LEARN repository on a separate, throwaway IndexedDB database. A reviewer walks a task on
 * the very screen a learner uses, every save lands here, and the database is deleted when the walk ends. The learner's
 * own database (WEB_DB_NAME) is never opened by the workspace, so reviewing cannot change learner progress.
 * Each walk gets its own database name, so ending one walk can never delete another's.
 */
import Dexie from "dexie";
import { createLearnerRepository, type LearnerRepository, type LearnerSnapshot } from "./learnerRepository.ts";

export const REVIEW_SANDBOX_PREFIX = "hospodar-yki:review-sandbox:";
const STALE_MS = 12 * 60 * 60 * 1000;

export interface ReviewSandbox { name: string; repository: LearnerRepository; snapshot: LearnerSnapshot; dispose(): Promise<void> }

/** A fresh, empty learner profile for one walk. */
export async function openReviewSandbox(now = Date.now()): Promise<ReviewSandbox> {
  const name = `${REVIEW_SANDBOX_PREFIX}${now}-${Math.random().toString(36).slice(2, 8)}`;
  const repository = createLearnerRepository(name);
  try {
    const snapshot = await repository.read();
    return { name, repository, snapshot, async dispose() { repository.close(); await Dexie.delete(name); } };
  } catch (e) { repository.close(); await Dexie.delete(name).catch(() => undefined); throw e; }
}

/** Delete sandboxes a closed tab left behind (older than 12 h, so another tab's live walk is never touched). */
export async function cleanupReviewSandboxes(now = Date.now()): Promise<number> {
  const list = await indexedDB.databases?.().catch(() => []) ?? [];
  const stale = list.map(d => d.name ?? "").filter(n => n.startsWith(REVIEW_SANDBOX_PREFIX))
    .filter(n => now - Number(n.slice(REVIEW_SANDBOX_PREFIX.length).split("-")[0]) > STALE_MS);
  await Promise.all(stale.map(n => Dexie.delete(n).catch(() => undefined)));
  return stale.length;
}
