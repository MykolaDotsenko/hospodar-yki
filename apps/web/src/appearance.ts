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

/** SD-G08 colour theme. "system" follows prefers-color-scheme; the palette comes from
 *  brand/tokens.json colors_dark (every contrast pair re-checked by validate_design_tokens.py).
 *  Presentation only, stored per viewer as a convenience. */
export type Theme = "system" | "light" | "dark";
const THEME_KEY = "hospodar-yki:web:theme";
export function readTheme(): Theme {
  try { const t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
}
export function applyTheme(t: Theme) {
  if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { if (t === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, t); } catch { /* preference only */ }
}

/** «Господар» persona visibility (DEC-06 revised 12.11.2026; IV-14). Shown by default outside tasks, one click to hide;
 *  calm mode also hides him. Presentation only, stored per viewer as a convenience. */
const GUIDE_KEY = "hospodar-yki:web:guide";
export function readGuide(): boolean {
  try { return localStorage.getItem(GUIDE_KEY) !== "hidden"; } catch { return true; }
}
export function applyGuide(show: boolean) {
  try { if (show) localStorage.removeItem(GUIDE_KEY); else localStorage.setItem(GUIDE_KEY, "hidden"); } catch { /* preference only */ }
}
