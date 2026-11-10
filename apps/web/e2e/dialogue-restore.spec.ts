import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const FIRST = "Hei, haluan harjoitella suomea uudessa kielikahvilassa.";
const DRAFT = "Tämä on yksityinen keskeneräinen vastaus dialogiin.";

async function open(page: Page) {
  await page.getByRole("button", { name: "💬 Діалоги" }).click();
}
async function start(page: Page) {
  await page.goto("./"); await open(page);
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
}
async function saveExit(page: Page) {
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  // The home transition is the durable-readback acknowledgement, not an optimistic click.
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
}
async function resume(page: Page) {
  await page.reload(); await open(page);
  await expect(page.getByText(/Незавершений діалог відновлено/)).toBeVisible();
}

test("Dialogue v7 reload: independent first reply and typed draft restored; no early script or graded result", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твоя репліка фінською/).fill(FIRST);
  await saveExit(page);
  await resume(page);
  await expect(page.getByLabel(/Твоя репліка фінською/)).toHaveValue(FIRST);
  await expect(page.getByText("Hei! Onko tässä kielikahvila?")).toHaveCount(0);
  await expect(page.getByText("Hän haluaa harjoitella puhumista.")).toHaveCount(0);
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByText(FIRST)).toBeVisible();
  await expect(page.getByText("Hei! Onko tässä kielikahvila?")).toBeVisible();
  await saveExit(page);
  await resume(page);
  await expect(page.getByText(FIRST)).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(a11y.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
});

test("Dialogue v7: stale tab cannot replace a learner's reply or change the checkpoint", async ({ page, context }) => {
  await start(page);
  await page.getByLabel(/Твоя репліка фінською/).fill(FIRST);
  await saveExit(page);
  await open(page);
  const stale = await context.newPage();
  await stale.goto("./"); await open(stale);
  await expect(stale.getByLabel(/Твоя репліка фінською/)).toHaveValue(FIRST);
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByText(FIRST)).toBeVisible();
  await stale.getByRole("button", { name: "Сказати" }).click();
  await expect(stale.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await stale.reload(); await open(stale);
  await expect(stale.getByText(FIRST)).toBeVisible();
});

test("Dialogue v7 privacy inventory: unfinished text omitted from export and erased explicitly", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твоя репліка фінською/).fill(DRAFT);
  await saveExit(page);
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("незавершених діалогів 1");
  await expect(page.getByText(/не експортуються незавершені чернетки місій LEARN/)).toContainText("діалогів");
  const [dl] = await Promise.all([
    page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click(),
  ]);
  expect(readFileSync((await dl.path())!, "utf8")).not.toContain(DRAFT);
  await page.getByRole("radio", { name: /Увесь прогрес навчання/ }).check();
  await page.getByLabel(/Щоб підтвердити/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Прогрес навчання видалено/ })).toBeVisible();
  await page.reload(); await open(page);
  await expect(page.getByRole("heading", { name: "Діалоги: твоя репліка" })).toBeVisible();
});
