/**
 * Keyboard check before an EXAM rehearsal (method digital-task-literacy; TZ-EXAM-17 device part). Pure and deterministic.
 *
 * A digital YKI answer is typed. A learner who cannot type ä and ö, or who types with the Ukrainian layout on (Cyrillic
 * «о», «а», «е», «і» look like Latin letters but are different characters), loses time and produces words that read
 * as wrong. The check asks for one short sample sentence and says only what the keyboard did:
 *
 *   ok          the sample came out exactly (after Unicode NFC normalisation, so a combining ¨ counts as ä)
 *   cyrillic    Cyrillic letters were typed — the Ukrainian layout is on
 *   umlauts     ä/ö came out as a/o — the learner needs a way to type them
 *   different   something else differs (a typo); the learner compares and may try again
 *
 * It never grades Finnish, never blocks the start and stores nothing. No OPH editor behaviour (special-letter buttons,
 * keyboard layout) is claimed; the 2027 editor is unverified.
 */
export const KEYBOARD_SAMPLE_FI = "Hyvää päivää, söin jäätelöä.";
export const KEYBOARD_MAX_CHARS = 200;
export type KeyboardVerdict = "ok" | "cyrillic" | "umlauts" | "different";

const CYRILLIC = /[\u0400-\u04FF]/;                 // the Cyrillic block, U+0400–U+04FF
const flat = (t: string) => t.replace(/ä/g, "a").replace(/ö/g, "o").replace(/Ä/g, "A").replace(/Ö/g, "O");

export function keyboardCheck(typed: string, sample: string = KEYBOARD_SAMPLE_FI): { verdict: KeyboardVerdict; cyrillicChars: string[] } {
  const t = String(typed ?? "").slice(0, KEYBOARD_MAX_CHARS).normalize("NFC").trim().replace(/\s+/g, " ");
  const cyrillicChars = [...new Set([...t].filter(c => CYRILLIC.test(c)))];
  if (cyrillicChars.length) return { verdict: "cyrillic", cyrillicChars };
  if (t === sample) return { verdict: "ok", cyrillicChars: [] };
  if (flat(t) === flat(sample)) return { verdict: "umlauts", cyrillicChars: [] };     // only ä/ö ↔ a/o differ
  return { verdict: "different", cyrillicChars: [] };
}
