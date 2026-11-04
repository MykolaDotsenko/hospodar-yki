/** Calm / low-stimulation appearance (DESIGN-16, COLOR-07/18, MULTI-03, UIO-07).
 *  Changes presentation only — never content, keys, scoring or SRS. Stored per viewer
 *  in localStorage as a convenience; the app works identically if storage is blocked. */
export type Appearance = "standard" | "calm";
const KEY = "hospodar-yki:web:appearance";
export function readAppearance(): Appearance {
  try { return localStorage.getItem(KEY) === "calm" ? "calm" : "standard"; } catch { return "standard"; }
}
export function applyAppearance(a: Appearance) {
  document.documentElement.dataset.appearance = a;
  try { localStorage.setItem(KEY, a); } catch { /* preference only */ }
}
