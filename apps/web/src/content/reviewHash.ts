/** Content hash of a review unit in the browser — the same bytes scripts/validate_content_publication.py hashes. */
import { canonicalReviewJson, formatSha256 } from "@hospodar/domain";

/** null when the page is not a secure context (no crypto.subtle): the workspace then refuses to record decisions. */
export async function reviewHash(item: Record<string, unknown>): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalReviewJson(item)));
  return formatSha256(new Uint8Array(digest));
}
