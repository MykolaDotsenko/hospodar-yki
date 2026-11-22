/**
 * YouTube and other external links of the media library (sources/youtube): link-only, never embedded. Kept apart from
 * content/media.ts so screens that only need illustrations do not load the whole link catalog.
 */
import { admitExternalLink } from "@hospodar/domain";
import youtube from "../../../../sources/youtube/youtube-catalog.json";
import { refused } from "./media.ts";

type LinkEntry = Parameters<typeof admitExternalLink>[0] & { creator: string; title: string; cefr_estimate?: string; skills?: string[];
  why_useful?: string; original_question_seeds?: { id: string; prompt_fi: string }[] };
export const externalLinks = (youtube as unknown as { items: LinkEntry[] }).items.flatMap(l => {
  const g = admitExternalLink(l);
  if (!g.ok) { refused.push({ id: l.id, reason: g.reason }); return []; }
  return [{ ...l, url: g.url, host: g.host }];
});

