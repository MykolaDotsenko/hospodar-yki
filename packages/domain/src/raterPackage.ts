/**
 * A package for a human S2 rater after an EXAM rehearsal (TZ-EXAM-16; R04 research №31, R04-E01/E02). The learner may
 * download their own writing and typed speaking answers with the prompts, the OPH criterion dimensions (names as in the
 * official PDFs, with links) and an empty rating form. The app never fills the rating: no level, no score, no estimate.
 *
 *  - criteria: only the dimension names documented from the OPH PDFs (page 2) in research №31 — no invented descriptors;
 *    OPH rates holistically, not as a sum of the dimensions, and the package says so;
 *  - voice recordings stay on the learner's device and are not included (the package says that a recording exists);
 *  - a self-contained HTML file escapes every learner text; nothing is sent anywhere.
 */
export const OPH_CRITERIA = Object.freeze({
  speaking: Object.freeze({
    source: "https://www.oph.fi/sites/default/files/documents/Puhumisen_arviointikriteerit.pdf",
    dimensions_fi: Object.freeze(["sujuvuus", "joustavuus", "koherenssi / sidosteisuus", "ilmaisun tarkkuus, laajuus ja idiomaattisuus", "ääntäminen / fonologinen hallinta", "rakenteiden tarkkuus"]),
  }),
  writing: Object.freeze({
    source: "https://www.oph.fi/sites/default/files/documents/Kirjoittamisen_arviointikriteerit.pdf",
    dimensions_fi: Object.freeze(["joustavuus", "koherenssi / sidosteisuus", "ilmaisun tarkkuus, laajuus ja idiomaattisuus", "rakenteiden tarkkuus"]),
  }),
});
/** Choices for the rater only (keskitaso gives levels 3 and 4); the app never preselects or computes one. */
export const RATER_LEVEL_CHOICES = Object.freeze(["alle 3", "3", "4", "ei arvioitavissa"]);

export interface RaterItem { id: string; skill: "reading" | "listening" | "writing" | "speaking"; prompt: string }
export interface RaterProduction { id: string; skill: "writing" | "speaking"; prompt_fi: string; response_fi: string; voiceRecorded: boolean }
export interface RaterPackage {
  schema: "hospodar-rater-package-v1"; created: string; set_title: string; productions: RaterProduction[];
  criteria: typeof OPH_CRITERIA; level_choices: readonly string[]; holistic_note_uk: string; not_official_uk: string;
}

/** The finished attempt's writing and speaking only; refuses when there is nothing to rate. */
export function raterPackage(items: readonly RaterItem[], answers: Readonly<Record<string, string>>, voiceIds: ReadonlySet<string>,
  setTitle: string, created: string): RaterPackage {
  const productions = items.filter((i): i is RaterItem & { skill: "writing" | "speaking" } => i.skill === "writing" || i.skill === "speaking")
    .map(i => ({ id: i.id, skill: i.skill, prompt_fi: i.prompt, response_fi: String(answers[i.id] ?? "").trim(), voiceRecorded: voiceIds.has(i.id) }))
    .filter(p => p.response_fi || p.voiceRecorded);
  if (!productions.length) throw new Error("NOTHING_TO_RATE");
  return {
    schema: "hospodar-rater-package-v1", created, set_title: setTitle, productions, criteria: OPH_CRITERIA, level_choices: RATER_LEVEL_CHOICES,
    holistic_note_uk: "OPH оцінює цілісно: рівень не є сумою окремих вимірів. Виміри — орієнтир для коментаря.",
    not_official_uk: "Тренувальна репетиція Hospodar YKI, не офіційний YKI. Застосунок не ставив жодної оцінки; рівень може визначити лише підготовлений оцінювач.",
  };
}

const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A self-contained, printable HTML page: prompts, answers, criteria with sources and an empty form. Every text is escaped. */
export function raterPackageHtml(p: RaterPackage): string {
  const block = (x: RaterProduction, n: number) => {
    const c = p.criteria[x.skill];
    return `<section><h2>${n}. ${x.skill === "writing" ? "Kirjoittaminen · письмо" : "Puhuminen · говоріння"}</h2>
<p><strong>Tehtävä:</strong> <span lang="fi">${esc(x.prompt_fi)}</span></p>
<p><strong>Vastaus${x.skill === "speaking" ? " (kirjoitettu suunnitelma / muistiinpanot)" : ""}:</strong></p><pre lang="fi">${esc(x.response_fi || "—")}</pre>
${x.voiceRecorded ? `<p><em>Äänitys on oppijan laitteella, ei mukana tässä tiedostossa · запис голосу лишився на пристрої учня.</em></p>` : ""}
<p><strong>Arviointikriteerit (OPH):</strong> ${c.dimensions_fi.map(esc).join(" · ")} — <a href="${esc(c.source)}">${esc(c.source)}</a></p>
<p><strong>Taso (arvioija valitsee):</strong> ${p.level_choices.map(l => `☐ ${esc(l)}`).join("&nbsp;&nbsp; ")}</p>
<p><strong>Kommentti:</strong></p><div class="box"></div></section>`;
  };
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hospodar YKI · пакет для оцінювача</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#111;background:#fff}pre{white-space:pre-wrap;border:1px solid #999;padding:.75rem}.box{border:1px solid #999;min-height:6rem}section{border-top:1px solid #999;margin-top:1.5rem;padding-top:.5rem}</style></head>
<body><h1>Пакет для оцінювача · Arvioijan paketti</h1>
<p>${esc(p.set_title)} · ${esc(p.created)}</p>
<p><strong>${esc(p.not_official_uk)}</strong></p><p>${esc(p.holistic_note_uk)}</p>
${p.productions.map((x, i) => block(x, i + 1)).join("\n")}
</body></html>`;
}
