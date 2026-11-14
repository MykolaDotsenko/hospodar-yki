/**
 * The build's release channel (docs/29 stage 1, code queue 2). `VITE_HOSPODAR_CHANNEL=release` at build time makes a
 * release build: every learner pool keeps only S2-published items, the reviewer workspace is not reachable, and an
 * empty pool is shown as "not reviewed yet". Any other value (or none) is the beta build used today: all drafts, labelled.
 */
import { isPublishedItem, releaseChannelOf, releasePool, type ReleaseChannel } from "@hospodar/domain";

export const CHANNEL: ReleaseChannel = releaseChannelOf(import.meta.env.VITE_HOSPODAR_CHANNEL);
export const IN_RELEASE = CHANNEL === "release";
/** The learner pool of a bank in this build (see packages/domain/src/release.ts). */
export const learnerPool = <T,>(items: readonly T[], parts?: (t: T) => readonly unknown[]): T[] => releasePool(items, CHANNEL, parts);
export { isPublishedItem };
