import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** task-based: «Ціла справа» — one life situation per place, understand → say → write; done = own attempt, never a grade. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const scenario = (page: Page) => page.locator("section.scenario");
async function openServices(page: Page) {
  await page.goto("./");
  await page.getByTestId("place-services").click();
  await expect(page.getByRole("heading", { name: "Магазини та послуги", level: 1 })).toBeVisible();
}

test("whole task in a place: ordered steps, the first opens its lesson directly, an own attempt moves the task to the next step", async ({ page }) => {
  await openServices(page);
  await expect(scenario(page).locator("li")).toHaveCount(3);
  await expect(scenario(page).locator("li").nth(0)).toContainText("Зрозумій на слух · Kun verkkokaupan tilaus meni pieleen");
  await expect(scenario(page).locator("li").nth(1)).toContainText("Скажи · Kahvinkeittimen palauttaminen");
  await expect(scenario(page).locator("li").nth(2)).toContainText("Напиши · Toimituksesta puuttuu osa");
  await expect(scenario(page).locator("li[data-status=todo]")).toHaveCount(3);
  expect(await scenario(page).innerText()).not.toMatch(/\d\s*%|рівень|бал|B1/);
  expect(await serious(page)).toEqual([]);

  await scenario(page).getByRole("button", { name: "Почати справу" }).click();
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await page.locator("audio").evaluate(a => a.dispatchEvent(new Event("play")));
  await page.getByRole("button", { name: "До питань" }).click();
  for (let i = 0; i < 4; i++) {
    await expect(page.getByText(`Питання ${i + 1} з 4`)).toBeVisible();
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();

  await openServices(page);
  await expect(scenario(page).locator("li").nth(0)).toHaveAttribute("data-status", "done");
  await expect(scenario(page).locator("li").nth(1)).toContainText("наступний крок");
  await scenario(page).getByRole("button", { name: "Продовжити: крок 2 з 3" }).click();
  await expect(page.locator(".eyebrow")).toContainText("Kahvinkeittimen palauttaminen");        // the dialogue of this situation
});

test("places without something to understand, say AND write offer no whole task (no fake scenario)", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("place-identity").click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(scenario(page)).toHaveCount(0);
});
