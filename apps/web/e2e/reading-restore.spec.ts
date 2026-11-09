import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const FIRST_TEXT = "He tutustuvat toisiinsa.";
const TRANSFER = "Hei! Haluaisin tulla kielikahvilaan keskiviikkona, koska haluan puhua enemmän.";
async function openReading(page: Page) {
  await page.getByRole("button", { name: "📖 Читання" }).click();
}
async function start(page: Page) {
  await page.goto("./");
  await openReading(page);
  await page.getByRole("button", { name: /Kirjaston kielikahvila/ }).click();
}
async function resume(page: Page) {
  await page.reload();
  await openReading(page);
}

test("Reading: save first answer and editorial phase checkpoints; reload cannot reveal keys early", async ({ page }) => {
  await start(page);
  await page.getByLabel("Ei tarvitse").check();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("heading", { name: "Прочитай і відповідай" })).toBeVisible();
  await expect(page.getByLabel("Ei tarvitse")).toBeChecked();
  await expect(page.locator("mark.evidence-span")).toHaveCount(0);
  await expect(page.getByText("Lyhyt tutustumisharjoitus.", { exact: true })).toHaveCount(0);
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(a11y.violations.filter(v => ["critical", "serious"].includes(v.impact ?? ""))).toEqual([]);
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Питання 2 з 3/)).toBeVisible();
  await page.getByLabel("Oikein").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel(/Mitä tehdään tapaamisen alussa/).fill(FIRST_TEXT);
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.locator("mark.evidence-span")).toHaveCount(3);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("heading", { name: "Що вийшло і де це в тексті" })).toBeVisible();
  await expect(page.locator("mark.evidence-span")).toHaveCount(3);
  await expect(page.getByText(FIRST_TEXT)).toBeVisible();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("button", { name: "Частково" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Далі: написати" }).click();
  await expect(page.getByRole("heading", { name: "Нове завдання — без тексту" })).toBeVisible();
  await expect(page.locator(".reading-text")).toHaveCount(0);
  await page.getByLabel(/Твій текст фінською/).fill(TRANSFER);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByLabel(/Твій текст фінською/)).toHaveValue(TRANSFER);
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await openReading(page);
  await expect(page.getByRole("heading", { name: "Читання з доказами" })).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Читання$/ }) })).toContainText("1 з 2 перевірених відповідей правильні; 1 без оцінки");
});

test("Reading: stale second tab cannot silently advance, discard or overwrite an independently answered question", async ({ page, context }) => {
  await start(page);
  await page.getByLabel("Ei tarvitse").check();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await openReading(page);
  const stale = await context.newPage();
  await stale.goto("./");
  await openReading(stale);
  await expect(stale.getByLabel("Ei tarvitse")).toBeChecked();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Питання 2 з 3/)).toBeVisible();
  await stale.getByRole("button", { name: "Відповісти" }).click();
  await expect(stale.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(stale.getByRole("heading", { name: "Прочитай і відповідай" })).toBeVisible();
  await stale.reload();
  await openReading(stale);
  await expect(stale.getByText(/Питання 2 з 3/)).toBeVisible();
});

test("Reading: privacy inventory, fail-closed restore and explicit erasure include unfinished checkpoints", async ({ page }) => {
  await start(page);
  await page.getByLabel("Ei tarvitse").check();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByRole("button", { name: "Мої дані" }).click();
  await expect(page.getByText(/незавершених вправ читання 1/)).toBeVisible();
  await expect(page.getByText(/не експортуються незавершені чернетки/)).toBeVisible();
  await page.getByRole("radio", { name: /Увесь прогрес навчання/ }).check();
  await page.getByLabel(/Щоб підтвердити/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Прогрес навчання видалено/ })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "📖 Читання" }).click();
  await expect(page.getByRole("heading", { name: "Читання з доказами" })).toBeVisible();
});
