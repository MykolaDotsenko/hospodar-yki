/**
 * «Як виглядає іспит» (CURATED-09, docs/29 stage 4): links shown on the rehearsal set-up screen only — never inside an
 * attempt. From sources/official/yki-mock-simulation-sources.json: OPH's own pages, the organizer's example pages
 * (SOLKI, University of Jyväskylä) and a few third-party practice videos. All link-only, all labelled for what they are:
 * examples are not past exam items, old formats are not the 2027 digital exam, and a practice video with model answers
 * says where the answers start so the learner can answer first. The A1–A2 story videos the catalog lists as "not full B1
 * mocks" are left out on purpose: they would be mistaken for an exam simulation.
 */
export const EXAM_LOOK_HOSTS = Object.freeze(["www.oph.fi", "ykitesti.solki.jyu.fi", "www.youtube.com"]);

export interface ExamLookLink { id: string; group: "oph" | "organizer" | "practice"; title_uk: string; note_uk: string; by: string; url: string; host: string; answersFrom: string | null }
type Entry = { id: string; url: string; title_uk?: string; note_uk?: string; creator?: string; model_answers_start_seconds?: number; is_verified_digital_2027_mock?: boolean };
export interface ExamLookCatalog {
  official_2027_policy: { source: string; reference_explanation: string };
  official_organizer_samples: Entry[]; mock_youtube_videos: Entry[]; other_video_references: Entry[];
}

export function admitExamLookLink(url: unknown): { ok: true; url: string; host: string } | { ok: false; reason: string } {
  const raw = String(url ?? "");
  const m = /^https:\/\/([a-z0-9.-]+)(\/[^\s"'<>]*)?$/i.exec(raw);
  if (!m) return { ok: false, reason: "invalid or non-https url" };
  const host = m[1]!.toLowerCase();
  if (!EXAM_LOOK_HOSTS.includes(host)) return { ok: false, reason: `host not allowed: ${host}` };
  return { ok: true, url: raw, host };
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function examLookLinks(c: ExamLookCatalog): { links: ExamLookLink[]; refused: { id: string; reason: string }[] } {
  const refused: { id: string; reason: string }[] = [];
  const out: ExamLookLink[] = [];
  const add = (e: Entry, group: ExamLookLink["group"]) => {
    const g = admitExamLookLink(e.url);
    if (!g.ok) { refused.push({ id: e.id, reason: g.reason }); return; }
    if (!e.title_uk || !e.note_uk) { refused.push({ id: e.id, reason: "no Ukrainian title or note" }); return; }
    if (e.is_verified_digital_2027_mock === true) { refused.push({ id: e.id, reason: "a verified 2027 mock claim needs its own evidence" }); return; }
    const answersFrom = typeof e.model_answers_start_seconds === "number" && e.model_answers_start_seconds > 0 ? mmss(e.model_answers_start_seconds) : null;
    out.push({ id: e.id, group, title_uk: e.title_uk, note_uk: e.note_uk, by: e.creator ?? "", url: g.url, host: g.host, answersFrom });
  };
  add({ id: "oph-before-yki", url: c.official_2027_policy.reference_explanation, creator: "Opetushallitus",
    title_uk: "OPH: перед тестом YKI", note_uk: "Офіційна сторінка OPH про те, як підготуватися до тесту і що буде в день тесту." }, "oph");
  add({ id: "oph-choose-test", url: c.official_2027_policy.source, creator: "Opetushallitus",
    title_uk: "OPH: вибір тесту й дати", note_uk: "OPH: з весни 2027 усі тести YKI з фінської — цифрові. Дати й реєстрація — тут." }, "oph");
  for (const e of c.official_organizer_samples) add(e, "organizer");
  for (const e of [...c.mock_youtube_videos, ...c.other_video_references]) add(e, "practice");
  return { links: out, refused };
}
