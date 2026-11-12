import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const FIRST = "Tässä on tori ja monia ihmisiä. He ostavat ruokaa.";
const TRANSFER = "Anteeksi, paljonko yksi omena maksaa?";
const PRIVATE = "Tämä on minun keskeneräinen yksityinen kuvavastaukseni.";

async function open(page: Page) {
  await page.getByTestId("nav-pictures").click();
}
async function start(page: Page) {
  await page.goto("./"); await open(page);
  await page.getByRole("button", { name: /Ринкова площа Турку/ }).click();
}
async function saveExit(page: Page) {
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  // Home visibility is the CAS/readback acknowledgement, not an optimistic button click.
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
}
async function resume(page: Page) {
  await page.reload(); await open(page);
  await expect(page.getByText(/Незавершену фото-місію відновлено/)).toBeVisible();
}

test("Picture v8: independent first text/phase, support and unguided transfer survive reload", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твоя відповідь фінською \(без підказок\)/).fill(FIRST);
  await saveExit(page);
  await resume(page);
  await expect(page.getByRole("heading", { name: "Що на фото?" })).toBeVisible();
  await expect(page.getByLabel(/Твоя відповідь фінською \(без підказок\)/)).toHaveValue(FIRST);
  await expect(page.getByText("Torilla voi ostaa ruokaa.")).toHaveCount(0);
  await expect(page.getByText(/Переклад \(лише на цьому кроці\)/)).toHaveCount(0);
  await page.getByRole("button", { name: "Готово" }).click();
  await expect(page.getByRole("heading", { name: "Приклади й переклад" })).toBeVisible();
  await expect(page.getByText("Torilla voi ostaa ruokaa.")).toBeVisible();
  await saveExit(page);
  await resume(page);
  await expect(page.getByRole("heading", { name: "Приклади й переклад" })).toBeVisible();
  await expect(page.getByText(FIRST)).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(a11y.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByRole("heading", { name: "Нова ситуація — без фото" })).toBeVisible();
  await expect(page.locator(".picture-figure")).toHaveCount(0);
  await expect(page.getByText("Torilla voi ostaa ruokaa.")).toHaveCount(0);
  await expect(page.getByText(/Переклад \(лише на цьому кроці\)/)).toHaveCount(0);
  await page.getByLabel(/без фото й перекладу/).fill(TRANSFER);
  await saveExit(page);
  await resume(page);
  await expect(page.getByRole("heading", { name: "Нова ситуація — без фото" })).toBeVisible();
  await expect(page.getByLabel(/без фото й перекладу/)).toHaveValue(TRANSFER);
  await expect(page.locator(".picture-figure")).toHaveCount(0);
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();
  await page.reload(); await open(page);
  await expect(page.getByRole("heading", { name: "Фото-місії" })).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("2 без оцінки");
});

test("Picture v8: second tab stale checkpoint cannot overwrite or reveal newer phase", async ({ page, context }) => {
  await start(page);
  await page.getByLabel(/Твоя відповідь фінською \(без підказок\)/).fill(FIRST);
  await saveExit(page);
  await open(page);
  const stale = await context.newPage();
  await stale.goto("./"); await open(stale);
  await expect(stale.getByLabel(/Твоя відповідь фінською \(без підказок\)/)).toHaveValue(FIRST);
  await page.getByRole("button", { name: "Готово" }).click();
  await expect(page.getByRole("heading", { name: "Приклади й переклад" })).toBeVisible();
  await stale.getByRole("button", { name: "Готово" }).click();
  await expect(stale.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(stale.getByRole("heading", { name: "Що на фото?" })).toBeVisible();
  await stale.reload(); await open(stale);
  await expect(stale.getByRole("heading", { name: "Приклади й переклад" })).toBeVisible();
});

test("Picture v8: unpublished unfinished text is excluded from export, counted and erased with confirmation", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твоя відповідь фінською \(без підказок\)/).fill(PRIVATE);
  await saveExit(page);
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("незавершених фото-місій 1");
  await expect(page.getByText(/не експортуються незавершені чернетки/)).toBeVisible();
  const [dl] = await Promise.all([
    page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click(),
  ]);
  expect(readFileSync((await dl.path())!, "utf8")).not.toContain(PRIVATE);
  await page.getByRole("radio", { name: /Увесь прогрес навчання/ }).check();
  await page.getByLabel(/Щоб підтвердити/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Прогрес навчання видалено/ })).toBeVisible();
  await page.reload(); await open(page);
  await expect(page.getByRole("heading", { name: "Фото-місії" })).toBeVisible();
});
