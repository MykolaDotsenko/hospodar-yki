import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** «План заняття» on 10, 20 or 30 minutes (docs/29 stage 3; DEC-01; UIO-07; R6-04; R6-10; MOT-02/04/11). */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const startPlan = async (page: Page, minutes: 10 | 20 | 30) => {
  await expect(page.locator(".today")).toBeVisible();                                    // Home has loaded the stored progress
  await page.getByRole("group", { name: "Або склади план заняття:" }).getByRole("button", { name: `${minutes} хв` }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`План заняття · ≈ \\d+ хв із ${minutes}`) })).toBeVisible();
};
const blocks = (page: Page) => page.getByTestId("plan-block");

test("session plan: a fresh learner's 30 minutes are new tasks in different skills with reasons; one main action; nothing stored", async ({ page }) => {
  await page.goto("./");
  await startPlan(page, 30);
  await expect(page.getByRole("heading", { name: "Твій наступний крок" })).toHaveCount(0);   // the plan replaces the card: one main action
  const n = await blocks(page).count();
  expect(n).toBeGreaterThanOrEqual(2);
  const kinds = await blocks(page).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.kind));
  expect(new Set(kinds)).toEqual(new Set(["new_task"]));                                 // nothing due yet, no weak spot
  const skills = await blocks(page).locator(".plan-kind").allInnerTexts();
  expect(new Set(skills.map(s => s.split(" · ")[1])).size).toBe(n);                      // a different skill for each new task
  await expect(blocks(page).first()).toContainText("з цієї навички ще немає жодної твоєї відповіді");
  await expect(page.locator(".session-plan .btn:not(.secondary)")).toHaveCount(1);
  await expect(page.locator(".session-plan")).toContainText("таймера немає");
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%|рівень|бал:|серія|streak/i);
  expect(await serious(page)).toEqual([]);
  const small = await page.locator(".session-plan button:visible, .session-plan select:visible").evaluateAll(els => els.filter(e => e.getBoundingClientRect().height < 44).length);
  expect(small).toBe(0);

  const stored = await page.evaluate(() => Object.keys(localStorage).filter(k => /plan|session/i.test(k)));
  expect(stored).toEqual([]);                                                             // MOT-11: the plan is not written anywhere
  await page.reload();
  await expect(page.getByRole("group", { name: "Або склади план заняття:" })).toBeVisible();
  await expect(page.getByTestId("plan-block")).toHaveCount(0);
});

test("a plan block opens its exact task", async ({ page }) => {
  await page.goto("./");
  await startPlan(page, 20);
  const title = (await blocks(page).first().locator(".today-title [lang=fi]").innerText()).trim();
  await blocks(page).first().getByRole("button", { name: "Почати" }).click();
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /План заняття/ })).toHaveCount(0);
});

test("review first: a phrase due today opens directly; back on Home the block is done and the next block becomes the main action", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-11T09:00:00+02:00") });
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Фрази для життя/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await page.getByRole("textbox").fill("mennä Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Цю фразу повторимо завтра/)).toBeVisible();

  await page.clock.setFixedTime(new Date("2026-11-12T09:00:00+02:00"));
  await page.reload();
  await startPlan(page, 10);
  const review = blocks(page).first();
  await expect(review).toHaveAttribute("data-kind", "review");
  await expect(review).toContainText("Повтори: фрази — 1");
  await expect(review).toContainText("≈ 2 хв");
  await expect(review).toContainText("настав запланований день повторення");
  await expect(blocks(page).nth(1)).toHaveAttribute("data-kind", "new_task");            // 10 − 2 = 8 min: a reading or listening task fits
  await review.getByRole("button", { name: "Почати" }).click();

  await expect(page.getByText("Повторення: згадай без зразка.")).toBeVisible();          // the due card itself, not a list
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Haluan muuttaa Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Наступне повторення — через довший проміжок/)).toBeVisible();
  await page.getByRole("button", { name: "До списку карток" }).click();
  await page.getByRole("button", { name: "На головну" }).click();

  await expect(blocks(page).first()).toHaveAttribute("data-done", "yes");                 // the same plan, kept in memory
  await expect(blocks(page).first()).toContainText("Зроблено");
  await expect(blocks(page).first().getByRole("button")).toHaveCount(0);
  await expect(blocks(page).nth(1).locator(".btn:not(.secondary)")).toHaveText("Почати");  // the next block is now the main action
});

test("manual choice: a chosen skill that does not fit the time is said honestly; a longer session offers it; a chosen place filters", async ({ page }) => {
  await page.goto("./");
  await startPlan(page, 10);
  await page.getByLabel("Нова справа — навичка").selectOption({ label: "Письмо" });
  await expect(page.locator(".session-plan")).toContainText("не вміщується в час, що лишився");
  await expect(blocks(page)).toHaveCount(0);
  await page.getByRole("group", { name: "Скільки часу на заняття" }).getByRole("button", { name: "20 хв" }).click();
  await expect(blocks(page).first()).toContainText("Нова справа · Письмо · ≈ 15 хв");
  await expect(blocks(page).first()).toContainText("ти обрав(-ла) цю навичку");
  await page.getByLabel("Місце").selectOption({ label: "Робота та навчання" });
  await expect(blocks(page).first()).toContainText("ти обрав(-ла) це місце");
  await expect(blocks(page).first().locator(".today-title small")).toContainText("Робота та навчання");
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Закрити план" }).click();
  await expect(page.getByRole("heading", { name: "Твій наступний крок" })).toBeVisible();
});
