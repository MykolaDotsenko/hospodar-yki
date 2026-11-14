/**
 * Release channel (docs/29 stage 1, code queue 2; QL-01, CURATED-01): which content a learner may meet.
 *  - "release": only items whose review_card says `published` (scripts/validate_content_publication.py guarantees such a
 *    card is complete and its hash matches the item). Everything else is withheld — an empty pool is shown as
 *    "not reviewed yet", never filled with drafts.
 *  - "beta": every item, and the screens label unpublished ones as drafts (TrustNote).
 */
export type ReleaseChannel = "beta" | "release";

export const RELEASE_CHANNELS: readonly ReleaseChannel[] = ["beta", "release"];
/** Unknown or missing values fall back to beta: the build only becomes a release build when it says so exactly. */
export const releaseChannelOf = (value: unknown): ReleaseChannel => (value === "release" ? "release" : "beta");

/** True only for an item that carries a review card with status `published`. */
export function isPublishedItem(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const card = (item as { review_card?: unknown }).review_card;
  return Boolean(card && typeof card === "object" && (card as { status?: unknown }).status === "published");
}

/**
 * The learner pool for a channel. `parts` names the raw stored items a pool entry depends on (an entry built from
 * several items — a dialogue and its partner moves, an exam form and its tasks — is releasable only if all are published).
 */
export function releasePool<T>(items: readonly T[], channel: ReleaseChannel, parts: (t: T) => readonly unknown[] = t => [t]): T[] {
  if (channel === "beta") return [...items];
  return items.filter(t => { const p = parts(t); return p.length > 0 && p.every(isPublishedItem); });
}
