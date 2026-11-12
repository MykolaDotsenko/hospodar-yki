import { expect, test, type Page } from "@playwright/test";

/**
 * Exam conditions (EXAM-PILLAR-04, EXAM-05, TZ-EXAM-09/12, EXV-14): inside an attempt the interface is Finnish and
 * offers no aids — no Ukrainian text outside clearly marked system notices (privacy, consent, save failures), no browser
 * translation, no spellcheck/autocorrect/autocomplete or writing-assistant extensions in the answer fields.
 */
const CYRILLIC = /[А-Яа-яІіЇїЄєҐґ]/;
const attemptText = (page: Page) => page.locator("section[data-exam-attempt]").evaluate(el => {
  const copy = el.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("[data-system-notice], [role=alert]").forEach(n => n.remove());
  return copy.textContent ?? "";
});

test("EXV-14 / TZ-EXAM-09: every task screen of a full rehearsal is Finnish-only outside marked system notices, and never browser-translated", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  for (let n = 1; n <= 9; n++) {
    await expect(page.getByText(`Tehtävä ${n} / 9`)).toBeVisible();
    await expect(page.locator("section[data-exam-attempt]")).toHaveAttribute("translate", "no");
    const text = await attemptText(page);
    expect(text.match(CYRILLIC)?.[0] ?? "", `task ${n}: Ukrainian text inside the attempt: …${text.slice(Math.max(0, text.search(CYRILLIC) - 40), text.search(CYRILLIC) + 40)}…`).toBe("");
    if (n < 9) await page.getByRole("button", { name: "Seuraava" }).click();
  }
});

test("TZ-EXAM-12: exam answer fields switch off spellcheck, autocorrect, autocomplete, translation and writing assistants", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  for (const s of ["Читання", "Аудіювання", "Говоріння"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await page.getByRole("button", { name: /Aloita/ }).click();
  const field = page.locator("section[data-exam-attempt] textarea");
  await expect(field).toHaveAttribute("spellcheck", "false");
  await expect(field).toHaveAttribute("autocorrect", "off");
  await expect(field).toHaveAttribute("autocapitalize", "off");
  await expect(field).toHaveAttribute("autocomplete", "off");
  await expect(field).toHaveAttribute("translate", "no");
  await expect(field).toHaveAttribute("data-gramm", "false");
  await field.fill("Hyvä isännöitsijä, keittiön hana vuotaa.");                       // ä/ö input still exact
  await expect(field).toHaveValue("Hyvä isännöitsijä, keittiön hana vuotaa.");
});
