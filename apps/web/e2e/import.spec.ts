import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const at = "2026-11-01T10:00:00.000Z";
const V1 = JSON.stringify({
  version: 1,
  attempts: [
    { taskId: "b1-g-001", grammarTag: "illatiivi", firstAnswer: "kirjasto", firstCorrect: false, secondAnswer: "kirjastoon", repairCorrect: true, transferText: "Menen kauppaan.", transferScoring: "ungraded", skill: "grammar", completedAt: at },
    { taskId: "b1-g-002", grammarTag: "inessiivi", firstAnswer: "x", firstCorrect: true, secondAnswer: "", repairCorrect: null, transferText: "Oma.", transferScoring: "ungraded", skill: "grammar", completedAt: at },
  ],
  cards: { "b1-g-001": { stage: 0, due: "2026-11-02", reviews: 1, failures: 1, lastCorrect: false, lastReviewed: "2026-11-01" },
           "b1-g-002": { stage: 1, due: "2026-11-02", reviews: 1, failures: 0, lastCorrect: true, lastReviewed: "2026-11-01" } },
  diagnostics: [{ skill: "reading", taskId: "r1", status: "scored", correct: true, response: "", completedAt: at }],
  errors: [{ taskId: "b1-g-001", grammarTag: "illatiivi", at, resolution: "guided_repair" }],
  retention: [],
});
const seedOld = (page: Page, raw: string) => page.addInitScript(v => { if (!localStorage.getItem("hospodar-yki:mvp:v1")) localStorage.setItem("hospodar-yki:mvp:v1", v); }, raw);

test("imports legacy progress from this device: preview → backup download → confirm → verified; old data untouched", async ({ page }) => {
  await seedOld(page, V1);
  await page.goto("./");
  await page.getByRole("button", { name: "Перенести прогрес з попередньої версії" }).click();
  await page.getByRole("button", { name: /Знайдено на цьому пристрої/ }).click();
  await expect(page.getByText("Дані можна перенести без втрат.")).toBeVisible();
  await expect(page.getByText("Місій:")).toContainText("2");
  await expect(page.getByText("Карток повторення:")).toContainText("2");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  const importBtn = page.getByRole("button", { name: "Перенести прогрес" });
  await expect(importBtn).toBeDisabled();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити копію оригіналу" }).click()]);
  expect(await (await download.createReadStream()).toArray().then(c => Buffer.concat(c).toString("utf8"))).toBe(V1); // exact original bytes
  await page.getByLabel("Я зберіг(-ла) копію оригіналу").check();
  await importBtn.click();
  await expect(page.getByText(/Перенесено й перевірено: 2 місій, 2 карток повторення, 1 діагностик/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("hospodar-yki:mvp:v1"))).toBe(V1);
  await page.getByRole("button", { name: "На головну" }).click();
  await expect(page.getByText("Виконано місій:")).toContainText("2");
  // Second time: destination not empty → refused, nothing changed.
  await page.getByRole("button", { name: "Перенести прогрес з попередньої версії" }).click();
  await expect(page.getByText(/вже є прогрес/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Знайдено на цьому пристрої/ })).toHaveCount(0);
});

test("a backup file with unknown fields or truncation risk is blocked with a clear reason", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Перенести прогрес з попередньої версії" }).click();
  await page.getByLabel(/Або обери файл/).setInputFiles({ name: "old.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...JSON.parse(V1), extra: 1 })) });
  await expect(page.getByRole("alert")).toHaveText(/невідомі дані/);
  await expect(page.getByRole("button", { name: "Перенести прогрес" })).toHaveCount(0);
  const many = { ...JSON.parse(V1), attempts: Array.from({ length: 121 }, (_, i) => ({ ...JSON.parse(V1).attempts[1], taskId: "t" + i })) };
  await page.getByLabel(/Або обери файл/).setInputFiles({ name: "big.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(many)) });
  await expect(page.getByRole("alert")).toHaveText(/обрізано/);
});

test("a valid legacy export file imports the same way", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Перенести прогрес з попередньої версії" }).click();
  await page.getByLabel(/Або обери файл/).setInputFiles({ name: "hospodar-yki-progress.json", mimeType: "application/json", buffer: Buffer.from(V1) });
  await expect(page.getByText(/Джерело: hospodar-yki-progress.json/)).toBeVisible();
  await page.getByLabel("Я зберіг(-ла) копію оригіналу").check();
  await page.getByRole("button", { name: "Перенести прогрес" }).click();
  await expect(page.getByText(/Перенесено й перевірено: 2 місій/)).toBeVisible();
});
