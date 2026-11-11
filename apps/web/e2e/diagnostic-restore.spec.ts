import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const WRITTEN = "Hei! Puhun suomea vähän. Sopiiko maanantai? Milloin kurssi alkaa?";
const SPOKEN = "Valitettavasti en pääse torstaina. Sopisiko perjantai tai maanantai?";
const PRIVATE = "Tämä on minun henkilökohtainen keskeneräinen diagnostinen vastaukseni.";

async function open(page: Page) {
  await page.getByRole("button", { name: "Стартова діагностика" }).click();
}
async function start(page: Page) { await page.goto("./"); await open(page); }
async function exit(page: Page) {
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
}
async function resume(page: Page) {
  await page.reload(); await open(page);
  await expect(page.getByText("Відновлено незавершену діагностику з цього пристрою.")).toBeVisible();
}

test("Diagnostic v9: independent answers, text, self-check and skill-evidence are replayed across real reloads", async ({ page }) => {
  await start(page);
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel("Tapaamispäivä").check();
  await exit(page);
  await resume(page);
  await expect(page.getByLabel("Tapaamispäivä")).toBeChecked();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Питання 2 з 2/)).toBeVisible();
  await exit(page);
  await resume(page);
  await expect(page.getByText(/Питання 2 з 2/)).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel("Täydellinen kielitaito").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("heading", { name: "Читання: що вийшло" })).toBeVisible();
  await exit(page); await resume(page);
  await expect(page.getByRole("heading", { name: "Читання: що вийшло" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти й далі: письмо" }).click();
  await expect(page.getByRole("heading", { name: "Письмо" })).toBeVisible();
  await page.getByLabel(/Твій текст фінською/).fill(WRITTEN);
  await exit(page); await resume(page);
  await expect(page.getByLabel(/Твій текст фінською/)).toHaveValue(WRITTEN);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByRole("heading", { name: "Письмо: перевір себе" })).toBeVisible();
  await page.getByLabel("kielitaito").check();
  await exit(page); await resume(page);
  await expect(page.getByLabel("kielitaito")).toBeChecked();
  await page.getByRole("button", { name: /Зберегти без оцінки й далі/ }).click();
  await expect(page.getByRole("heading", { name: "Говоріння" })).toBeVisible();
  await page.getByLabel(/усний план/).fill(SPOKEN);
  await exit(page); await resume(page);
  await expect(page.getByLabel(/усний план/)).toHaveValue(SPOKEN);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByRole("heading", { name: "Говоріння: перевір себе" })).toBeVisible();
  await page.getByRole("button", { name: /Зберегти без оцінки й завершити/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /Аудіювання: не перевірялося/ })).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(a11y.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.reload(); await open(page);
  await expect(page.getByRole("heading", { name: "Читання" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("1 без оцінки");
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("1 без оцінки");
});

test("Diagnostic v9: a competing tab cannot rewrite a frozen answer or leak reading keys", async ({ page, context }) => {
  await start(page);
  await page.getByLabel("Tapaamispäivä").check();
  await exit(page); await open(page);
  const stale = await context.newPage();
  await stale.goto("./"); await open(stale);
  await expect(stale.getByLabel("Tapaamispäivä")).toBeChecked();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Питання 2 з 2/)).toBeVisible();
  await stale.getByRole("button", { name: "Відповісти" }).click();
  await expect(stale.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(stale.getByText(/Питання 1 з 2/)).toBeVisible();
  await stale.reload(); await open(stale);
  await expect(stale.getByText(/Питання 2 з 2/)).toBeVisible();
  await expect(stale.locator(".learning-cue")).toHaveCount(0);
});

test("Diagnostic v9: private unfinished text stays outside portable JSON and is removed by typed-confirmation wipe", async ({ page }) => {
  await start(page);
  await page.getByLabel("Tapaamispäivä").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel("Täydellinen kielitaito").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Зберегти й далі: письмо" }).click();
  await page.getByLabel(/Твій текст фінською/).fill(PRIVATE);
  await exit(page);
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("незавершених діагностик 1");
  await expect(page.getByText(/не експортуються незавершені чернетки місій LEARN/)).toContainText("діагностик");
  const [dl] = await Promise.all([
    page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click(),
  ]);
  expect(readFileSync((await dl.path())!, "utf8")).not.toContain(PRIVATE);
  await page.getByRole("radio", { name: /Увесь прогрес навчання/ }).check();
  await page.getByLabel(/Щоб підтвердити/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Прогрес навчання видалено/ })).toBeVisible();
  await page.reload(); await open(page);
  await expect(page.getByRole("heading", { name: "Читання" })).toBeVisible();
});

test("Diagnostic: injected IDB quota abort rolls back evidence AND phase; reload safely retries once", async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    (window as unknown as { __diagnosticQuotaFault: boolean }).__diagnosticQuotaFault = false;
    IDBObjectStore.prototype.put = function (...args) {
      const flag = window as unknown as { __diagnosticQuotaFault: boolean };
      if (this.name === "diagnosticDraft" && flag.__diagnosticQuotaFault) {
        flag.__diagnosticQuotaFault = false;
        this.transaction.abort();
        throw new DOMException("Simulated disk quota during atomic phase write", "QuotaExceededError");
      }
      return Reflect.apply(original, this, args) as IDBRequest;
    };
  });
  await start(page);
  await page.getByLabel("Tapaamispäivä").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel("Täydellinen kielitaito").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("heading", { name: "Читання: що вийшло" })).toBeVisible();
  await page.evaluate(() => { (window as unknown as { __diagnosticQuotaFault: boolean }).__diagnosticQuotaFault = true; });
  await page.getByRole("button", { name: "Зберегти й далі: письмо" }).click();
  await expect(page.getByRole("alert")).toContainText("QUOTA_OR_DISK_FULL");
  await expect(page.getByRole("heading", { name: "Читання: що вийшло" })).toBeVisible();

  // The previous learner write was queued but aborted when the next-stage
  // draft write failed. Both records must still describe the OLD stage.
  await page.reload(); await open(page);
  await expect(page.getByRole("heading", { name: "Читання: що вийшло" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти й далі: письмо" }).click();
  await expect(page.getByRole("heading", { name: "Письмо" })).toBeVisible();
  await exit(page); await resume(page);
  await expect(page.getByRole("heading", { name: "Письмо" })).toBeVisible();
});
