import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => `${v.id}: ${v.nodes.length}`);
}

test("R06: mission explains why it was chosen and lets the learner pick another", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await page.getByText("Чому це завдання зараз?").click();          // collapsed: the Finnish task stays the focus
  await expect(page.getByText("Ти ще не пробував(-ла) це завдання.")).toBeVisible();
  await expect(page.getByText(/без оцінки рівня/)).toBeVisible();
  await expect(page.locator(".why")).not.toContainText(/B1|YKI|%/);
  const before = await page.locator(".prompt[lang=fi]").textContent();
  await page.getByRole("button", { name: "Обрати інше завдання" }).click();
  await page.getByRole("list", { name: "Інші завдання" }).getByRole("button").first().click();
  await expect(page.locator(".prompt[lang=fi]")).not.toHaveText(before!);
  expect(await axe(page)).toEqual([]);
});

test("R06: an item answered wrongly is not re-served the same day (spacing, not massed repetition)", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  const first = await page.locator(".prompt[lang=fi]").textContent();
  await page.getByLabel("Впиши пропущену форму фінською").fill("väärä");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("väärä");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await page.getByLabel(/Твоє власне речення/).fill("Oma lause.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.getByRole("button", { name: "Наступна місія" }).click();
  await expect(page.locator(".prompt[lang=fi]")).not.toHaveText(first!);
});

test("R03/R08 reviewer preview: meaning → form → editor-tagged cause; learner progress untouched", async ({ page }) => {
  await page.goto("./#review");
  await expect(page.getByRole("note")).toContainText("не показуються учням");
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: /Olen ___ \(kauppa\)/ }).click();
  await expect(page.getByRole("note")).toContainText("не для учнів");
  await expect(page.locator("body")).not.toContainText("kaupassa");                 // key hidden before feedback
  await page.getByRole("button", { name: /куди\?/ }).click();                         // wrong meaning on purpose
  await expect(page.getByRole("heading", { name: "Тепер форма" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("kaupassa");
  await page.getByLabel(/Впиши форму слова/).fill("kaupasta");                        // editor-listed wrong form
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();   // DEC-02: repair first
  await expect(page.getByText("Обрано не той відмінок для цього значення (M01).")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("kaupassa");                             // still no key
  expect(await axe(page)).toEqual([]);
  await page.getByLabel(/Ще раз форма слова/).fill("kaupassa");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.getByText(/керована спроба, не самостійна/)).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveText("kaupassa");
  await expect(page.getByText("Основа: kauppa → kaupassa")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel(/Твоє речення фінською/).fill("Odotan asemalla.");
  await page.getByRole("button", { name: "Завершити" }).click();
  await expect(page.getByText("Перегляд завершено. Нічого не збережено.")).toBeVisible();
  await page.goto("./");
  await expect(page.getByText("Виконано місій:")).toContainText("0");
});

test("R08 unknown wrong form is 'unclassified', never guessed", async ({ page }) => {
  await page.goto("./#review");
  await page.getByRole("button", { name: /Olen ___ \(kauppa\)/ }).click();
  await page.getByRole("button", { name: /де\?/ }).click();
  await page.getByLabel(/Впиши форму слова/).fill("kaupassax");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText(/не класифіковано/)).toBeVisible();
});
