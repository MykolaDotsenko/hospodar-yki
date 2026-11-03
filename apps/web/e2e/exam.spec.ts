import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
/** EXAM firewall: no learning cue, evidence highlight, feedback, key or result anywhere during the attempt. */
async function noLearningAids(page: Page) {
  await expect(page.locator(".learning-cue, .evidence-span, .feedback:not(.error), .draft-note")).toHaveCount(0);
  await expect(page.getByText(/Правильно|ключ:|Tulokset|Підказка/)).toHaveCount(0);
}

test("EXAM rehearsal (XState): no aids before finish, persisted navigation survives reload, results only after a durable finish", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
  await expect(page.getByText(/Не офіційний YKI/).first()).toBeVisible();
  await expect(page.locator(".pill", { hasText: "02 · Симуляція YKI" })).toBeVisible();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  await expect(page.getByText("Harjoituskoe · epävirallinen")).toBeVisible();
  await noLearningAids(page);
  expect(await serious(page)).toEqual([]);
  const first = page.locator('input[type="radio"]').first();
  await first.check();
  await page.getByRole("button", { name: "Seuraava" }).click();
  await expect(page.getByText("Tehtävä 2 / 9")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Tehtävä 2 / 9")).toBeVisible();          // resumed from the persisted checkpoint
  await page.getByRole("button", { name: "Edellinen" }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeChecked();
  for (let i = 1; i < 9; i++) {
    await page.getByRole("button", { name: "Seuraava" }).click();
    await expect(page.getByText(`Tehtävä ${i + 1} / 9`)).toBeVisible();
    await noLearningAids(page);
  }
  await page.getByRole("textbox").fill("Valitettavasti en pääse torstaina. Sopisiko perjantai?");
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Haluatko lopettaa\? Vastaamatta: 7/)).toBeVisible();
  await noLearningAids(page);
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await expect(page.getByText(/не оцінюються автоматично/)).toBeVisible();
  await expect(page.locator(".skill-lines li", { hasText: "Говоріння" }).first()).toContainText("1 без оцінки");
  await expect(page.getByText(/%|B1|taitotaso 3/)).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();   // finished state is durable
  await page.getByRole("button", { name: "Нова репетиція" }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
});

test("EXAM practice timer is labelled unofficial and visible; LEARN progress is untouched by the rehearsal", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await page.getByLabel("15 хв").check();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.locator(".pill", { hasText: /Harjoitusaika 1[45]:/ })).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  for (const skill of ["Читання", "Аудіювання", "Письмо", "Говоріння"])
    await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: new RegExp(`^${skill}$`) }) })).toContainText("Ще не тренувалося");
});
