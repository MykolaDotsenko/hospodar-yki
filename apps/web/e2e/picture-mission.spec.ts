import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

test("IV-REQ-06 picture mission: unassisted first, models + Ukrainian gloss only after, transfer without photo or translation; ungraded", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-pictures").click();
  await page.getByRole("button", { name: /Ринкова площа Турку/ }).click();
  await expect(page.getByRole("img", { name: /Turun kauppatori/ })).toBeVisible();
  await expect(page.getByText("Torilla voi ostaa ruokaa.")).toHaveCount(0);
  await expect(page.getByText(/Переклад \(лише на цьому кроці\)/)).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Готово" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  await page.getByLabel(/Твоя відповідь фінською \(без підказок\)/).fill("Tässä on tori ja ihmisiä.");
  await page.getByRole("button", { name: "Готово" }).click();
  await expect(page.getByText("Torilla voi ostaa ruokaa.")).toBeVisible();
  await expect(page.getByText(/Переклад \(лише на цьому кроці\)/)).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByRole("heading", { name: "Нова ситуація — без фото" })).toBeVisible();
  await expect(page.locator("img")).toHaveCount(1);                         // only the brand mark remains
  await expect(page.getByText(/Ринкова площа/)).toHaveCount(0);
  await expect(page.getByText("Torilla voi ostaa ruokaa.")).toHaveCount(0);
  await page.getByLabel(/без фото й перекладу/).fill("Anteeksi, paljonko yksi omena maksaa?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("2 без оцінки");
});
