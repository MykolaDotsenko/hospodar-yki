/** Web UI display language. This does NOT change Finnish learning/exam content or persisted attempts. */
export type UiLocale = "uk" | "nl";

const STORAGE_KEY = "hospodar-yki:web:ui-locale";

export function readUiLocale(): UiLocale {
  try { return localStorage.getItem(STORAGE_KEY) === "nl" ? "nl" : "uk"; }
  catch { return "uk"; }
}

export function storeUiLocale(locale: UiLocale): void {
  try { localStorage.setItem(STORAGE_KEY, locale); }
  catch { /* A blocked preference store never blocks LEARN or EXAM. */ }
}

/** Explicit translated UI copy; no machine translations of learning/exam tasks. */
export function tr(locale: UiLocale, uk: string, nl: string): string {
  return locale === "nl" ? nl : uk;
}
