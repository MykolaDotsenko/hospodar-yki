/**
 * «Де вчитися далі» (CURATED-09): saved link catalogs as link cards in the media library — publisher series, single
 * Yle Areena episodes and open materials. Nothing is downloaded, copied or embedded. Each link passes admitCatalogLink
 * (https, reviewed learning host, not official YKI); competitor platforms kept for product comparison never reach learners.
 * Draft Finnish prompts (S2-pending) are shown only in beta builds.
 */
import { admitCatalogLink } from "@hospodar/domain";
import series from "../../../../sources/publishers/publisher-series-catalog.json";
import episodes from "../../../../sources/publishers/publisher-episode-catalog.json";
import openSources from "../../../../learning/exercises/b1/high-yield/independent-sources.json";

export interface LearnMoreLink { id: string; title: string; by: string; level: string | null; why_uk: string; url: string; host: string; prompt_fi: string | null }
export interface LearnMoreGroup { id: string; title_uk: string; about_uk: string; links: LearnMoreLink[] }
export const refusedLinks: { id: string; reason: string }[] = [];

type Raw = { id: string | number; url: string; official_yki?: boolean; title: string; by: string; level?: string; why_uk: string; prompt_fi?: string };
const admit = (rows: Raw[]): LearnMoreLink[] => rows.flatMap(r => {
  const g = admitCatalogLink(r);
  if (!g.ok) { refusedLinks.push({ id: String(r.id), reason: g.reason }); return []; }
  return [{ id: String(r.id), title: r.title, by: r.by, level: r.level ?? null, why_uk: r.why_uk, url: g.url, host: g.host, prompt_fi: r.prompt_fi ?? null }];
});

type Series = { id: string; url: string; provider: string; title: string; level: string; why_uk: string };
type Episode = { id: string; url: string; title: string; why_uk: string; original_prompt_fi?: string; official_YKI_material: boolean };
type Open = { id: number; url: string; title: string; why_uk: string };

export const learnMore: LearnMoreGroup[] = [
  { id: "series", title_uk: "Серії видавців", about_uk: "Відео й аудіо на сайтах Yle та Kielibuusti. Рівень — як указав видавець або наша оцінка.",
    links: admit((series as unknown as { sources: Series[] }).sources.map(s => ({ id: s.id, url: s.url, title: s.title, by: s.provider, level: s.level, why_uk: s.why_uk }))) },
  { id: "episodes", title_uk: "Yle Areena: Asiointisuomea", about_uk: "Окремі сцени 2013–2014 років на сайті Yle. Спершу подивись, потім спробуй сам(а) ситуацію.",
    links: admit((episodes as unknown as { items: Episode[] }).items.map(e => ({ id: e.id, url: e.url, official_yki: e.official_YKI_material, title: e.title, by: "Yle Areena", why_uk: e.why_uk, prompt_fi: e.original_prompt_fi }))) },
  { id: "open", title_uk: "Відкриті й безкоштовні матеріали", about_uk: "Підручники з відкритою ліцензією й безкоштовні вправи. Права на копіювання є не всюди, тому тут лише посилання.",
    links: admit((openSources as unknown as { entries: Open[] }).entries.map(o => ({ id: `open-${o.id}`, url: o.url, title: o.title, by: "", why_uk: o.why_uk }))) },
];
