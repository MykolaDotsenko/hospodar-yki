import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PREDICTION = "Luulen, että puhutaan vesikatkosta ja korjaustöistä.";
async function choose(page: Page) {
  await page.getByRole("button", { name: "🎧 Аудіювання" }).click();
  await page.getByRole("button", { name: /Vesikatko ja huoltokäynti/ }).click();
}
async function start(page: Page) {
  await page.goto("./");
  await choose(page);
}
async function resume(page: Page) {
  // Only reload after the save-and-exit receipt, never race an in-flight IndexedDB transaction.
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "🎧 Аудіювання" }).click();
}
async function answerAll(page: Page) {
  for (let i = 0; i < 4; i++) {
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
}
test("LEARN Listening: exact prediction survives reload; no first answer or key shown early", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твій прогноз/).fill(PREDICTION);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("heading", { name: /Про що, на твою думку/ })).toBeVisible();
  await expect(page.getByLabel(/Твій прогноз/)).toHaveValue(PREDICTION);
  await page.getByRole("button", { name: "Далі: слухати" }).click();
  await expect(page.getByRole("heading", { name: "Слухай" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByRole("button", { name: "До питань" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу прослухай");
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(a11y.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.locator("audio").evaluate(a => a.dispatchEvent(new Event("play")));
  await page.getByRole("button", { name: "До питань" }).click();
  await expect(page.getByRole("heading", { name: "Головне: про що це?" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.locator('input[name="lq"]').first().check();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("heading", { name: "Головне: про що це?" })).toBeVisible();
  await expect(page.locator('input[name="lq"]').first()).toBeChecked();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("heading", { name: "Деталі" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("heading", { name: "Деталі" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
  await expect(page.locator(".learning-cue").first()).toHaveText("Rikkoutunut vesiputki");
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "🎧 Аудіювання" }).click();
  await expect(page.getByRole("heading", { name: "Обери запис" })).toBeVisible();
});

test("LEARN Listening: persisted transcript support stays ungraded after reload and finish", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await page.getByRole("button", { name: "Показати текст (підтримка)" }).click();
  await expect(page.locator(".transcript")).toContainText("Tiistaiaamuna");
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.locator(".transcript")).toContainText("Tiistaiaamuna");
  await expect(page.getByText(/З підтримкою відповіді зберігаються без оцінки/)).toBeVisible();
  await page.getByRole("button", { name: "До питань" }).click();
  await answerAll(page);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/збережено без оцінки/)).toBeVisible();
  await page.getByRole("button", { name: "До списку записів" }).click();
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Аудіювання" })).toContainText("0 з 0 перевірених відповідей правильні; 4 без оцінки");
});

test("LEARN Listening: slow-speed support persists and cannot be reclassified as independent", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await page.getByRole("button", { name: "0,75× (підтримка)" }).click();
  await expect.poll(() => page.locator("audio").evaluate(a => (a as HTMLAudioElement).playbackRate)).toBe(0.75);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await resume(page);
  await expect(page.getByRole("button", { name: "0,75× (підтримка)" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.locator("audio").evaluate(a => (a as HTMLAudioElement).playbackRate)).toBe(0.75);
  await page.locator("audio").evaluate(a => a.dispatchEvent(new Event("play")));
  await page.getByRole("button", { name: "До питань" }).click();
  await answerAll(page);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/збережено без оцінки/)).toBeVisible();
});

test("LEARN Listening: stale second tab never advances the checkpoint or discards a newer choice", async ({ page, context }) => {
  await start(page);
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByRole("button", { name: "🎧 Аудіювання" }).click();
  const stale = await context.newPage();
  await stale.goto("./");
  await stale.getByRole("button", { name: "🎧 Аудіювання" }).click();
  await expect(stale.getByRole("heading", { name: "Слухай" })).toBeVisible();
  await page.getByRole("button", { name: "Показати текст (підтримка)" }).click();
  await expect(page.locator(".transcript")).toBeVisible();
  await stale.getByRole("button", { name: "Показати текст (підтримка)" }).click();
  await expect(stale.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(stale.locator(".transcript")).toHaveCount(0);
  await stale.reload();
  await stale.getByRole("button", { name: "🎧 Аудіювання" }).click();
  await expect(stale.locator(".transcript")).toBeVisible();
});

test("LEARN Listening: data inventory and typed LEARN erase account for paused audio", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твій прогноз/).fill(PREDICTION);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByText(/незавершених вправ аудіювання 1/)).toBeVisible();
  await expect(page.getByText(/не експортуються незавершені чернетки місій LEARN/)).toBeVisible();
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "🎧 Аудіювання" }).click();
  await expect(page.getByRole("heading", { name: "Обери запис" })).toBeVisible();
});
