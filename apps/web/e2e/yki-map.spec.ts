import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** yki-constructive-alignment: the 9 YKI themes × 4 skills map, counts only; listening lessons now live in their places. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const map = (page: Page) => page.locator(".yki-map");
async function openProgress(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.getByRole("heading", { name: "Карта підготовки: 9 тем YKI × 4 навички" })).toBeVisible();
}

test("YKI map: 9 themes × 4 skills, honest content gaps, counts only — and a listening lesson opened from its place fills its cell", async ({ page }) => {
  await openProgress(page);
  await expect(map(page).locator("tbody tr")).toHaveCount(9);
  await expect(map(page).locator("tbody td")).toHaveCount(36);
  await expect(map(page).locator("td[data-cell=gap]")).toHaveCount(9);
  await expect(page.getByTestId("yki-map-summary")).toContainText("0 з 27 доступних");
  await expect(map(page)).toContainText("це не твоя слабкість");
  expect(await map(page).innerText()).not.toMatch(/\d\s*%|рівень [A-C]|B1|прогноз/);
  expect(await serious(page)).toEqual([]);

  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByTestId("place-services").click();
  await page.getByRole("button", { name: /Аудіювання · Kun verkkokaupan tilaus meni pieleen/ }).click();
  await expect(page.getByRole("button", { name: "Пропустити й слухати" })).toBeVisible();         // the lesson itself, not the list
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await page.locator("audio").evaluate(a => a.dispatchEvent(new Event("play")));
  await page.getByRole("button", { name: "До питань" }).click();
  for (let i = 0; i < 4; i++) {
    await expect(page.getByText(`Питання ${i + 1} з 4`)).toBeVisible();
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();

  await openProgress(page);
  const services = map(page).locator("tr[data-place=services] td").nth(1);                         // listening column
  await expect(services).toHaveAttribute("data-cell", "tried");
  await expect(services).toContainText("1/1");
  await expect(page.getByTestId("yki-map-summary")).toContainText("1 з 27 доступних");
  await map(page).getByRole("button", { name: "Магазини та послуги" }).click();
  await expect(page.getByRole("heading", { name: "Магазини та послуги", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /Аудіювання · Kun verkkokaupan/ })).toContainText("ти вже пробував(ла)");
});
