import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const DRAFT = "Hei! Kylpyhuoneen seinässä on tumma läikkä. Voitteko tulla katsomaan?";
const MODEL_START = "Huomasin kylpyhuoneen seinässä tumman läikän";

async function toTransfer(page: Page) {
  await page.goto("./");
  await page.getByTestId("nav-writing").click();
  await page.getByRole("button", { name: /Kosteusvaurio epäilyttää/ }).click();
  await expect(page.getByText(MODEL_START)).toHaveCount(0);
  await expect(page.getByText("Minulla on huono seinä")).toHaveCount(0);
  await page.getByLabel(/Твій текст фінською/).fill(DRAFT);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await page.getByLabel("paikka").check();
  await page.getByRole("button", { name: "Зберегти чернетку й далі" }).click();
  await expect(page.getByRole("heading", { name: "Знайди проблеми в чужій чернетці" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel(/Minulla on huono seinä kylpyhuone/).check();
  await page.getByRole("button", { name: "Показати, що варто змінити" }).click();
  await expect(page.getByText("Ти це помітив(ла).")).toHaveCount(1);
  await expect(page.getByText("Це варто змінити.")).toHaveCount(2);
  await expect(page.getByText(MODEL_START)).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Далі: зразок" }).click();
  await expect(page.getByText(MODEL_START)).toBeVisible();
  await page.getByRole("button", { name: "Переписати свій текст" }).click();
  const rewrite = page.getByLabel(/Твій переписаний текст/);
  await expect(rewrite).toHaveValue(DRAFT);
  await rewrite.fill(DRAFT + " Olen kotona arkisin kello 17 jälkeen.");
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByRole("heading", { name: "Нова ситуація — без зразка" })).toBeVisible();
  await expect(page.getByText(MODEL_START)).toHaveCount(0);
  await expect(page.getByText(DRAFT)).toHaveCount(0);
}

test("IV-REQ-07 writing clinic: own draft first → spot issues → model after attempt → rewrite diff → new task without model, all ungraded", async ({ page }) => {
  await toTransfer(page);
  await page.getByLabel(/Твій новий текст/).fill("Hei! Keittiön ikkunasta vetää kylmää. Sopiiko huolto tiistaina tai torstaina?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByRole("heading", { name: "Готово" })).toBeVisible();
  await expect(page.locator(".diff ins")).toHaveText("Olen kotona arkisin kello 17 jälkeen.");
  expect(await serious(page)).toEqual([]);
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("3 без оцінки");
});

test("final save conflict keeps the learner on the new-task step with their text (no fake 'done')", async ({ page, context }) => {
  await toTransfer(page);
  const other = await context.newPage();
  await other.goto("./");
  await other.getByRole("button", { name: "Стартова діагностика" }).click();
  await other.getByLabel("Tapaamispäivä").check();
  await other.getByRole("button", { name: "Відповісти" }).click();
  await other.getByLabel("Täydellinen kielitaito").check();
  await other.getByRole("button", { name: "Відповісти" }).click();
  await other.getByRole("button", { name: "Зберегти й далі: письмо" }).click();
  await expect(other.getByRole("heading", { name: "Письмо" })).toBeVisible();
  const T = "Hei! Keittiön ikkunasta vetää kylmää. Sopiiko huolto tiistaina?";
  await page.getByLabel(/Твій новий текст/).fill(T);
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(page.getByRole("heading", { name: "Нова ситуація — без зразка" })).toBeVisible();
  await expect(page.getByLabel(/Твій новий текст/)).toHaveValue(T);
});

test("pre-task planning: an optional own plan before writing stays in view while writing, comes back next to the model, and is absent in the new situation", async ({ page }) => {
  const PLAN = "huoltoyhtiölle: läikkä, kauanko, milloin kotona";
  await page.goto("./");
  await page.getByTestId("nav-writing").click();
  await page.getByRole("button", { name: /Kosteusvaurio epäilyttää/ }).click();
  await page.getByRole("button", { name: "Спершу скласти план (за бажанням)" }).click();
  await expect(page.locator(".plan-frame li")).toHaveCount(3);
  await expect(page.getByLabel(/Твій текст фінською/)).toHaveCount(0);                     // plan first, then the text
  expect(await serious(page)).toEqual([]);
  await page.getByLabel(/Твій план/).fill(PLAN);
  await page.getByRole("button", { name: "План готовий — писати" }).click();
  await expect(page.getByTestId("clinic-plan")).toContainText(PLAN);                          // an outline in view while writing
  await page.getByLabel(/Твій текст фінською/).fill(DRAFT);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByTestId("clinic-plan")).toHaveCount(0);                                // not during self-check / spotting
  await page.getByLabel("paikka").check();
  await page.getByRole("button", { name: "Зберегти чернетку й далі" }).click();
  await page.getByRole("button", { name: "Показати, що варто змінити" }).click();
  await page.getByRole("button", { name: "Далі: зразок" }).click();
  await expect(page.getByText(MODEL_START)).toBeVisible();
  await expect(page.getByTestId("clinic-plan")).toContainText(PLAN);                          // back for self-comparison
  await page.getByRole("button", { name: "Переписати свій текст" }).click();
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByRole("heading", { name: "Нова ситуація — без зразка" })).toBeVisible();
  await expect(page.getByTestId("clinic-plan")).toHaveCount(0);                                // independent: no plan, no model
  await expect(page.getByRole("button", { name: /скласти план/ })).toHaveCount(0);
});

test("planning is optional: 'Без плану' goes straight to writing with no plan box", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-writing").click();
  await page.getByRole("button", { name: /Kosteusvaurio epäilyttää/ }).click();
  await page.getByRole("button", { name: "Спершу скласти план (за бажанням)" }).click();
  await page.getByRole("button", { name: "Без плану" }).click();
  await expect(page.getByLabel(/Твій текст фінською/)).toBeVisible();
  await expect(page.getByTestId("clinic-plan")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /скласти план/ })).toHaveCount(0);           // offered once
});
