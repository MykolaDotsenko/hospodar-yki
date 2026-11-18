import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** «Перший запуск» (docs/29 stage 3, code queue 8; MOT-02, MOT-11; R08-MOT §3). A truly new learner: nothing stored. */
test.use({ storageState: { cookies: [], origins: [] } });

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const GOALS = "hospodar-yki:web:goals:v1";
const stored = (page: Page) => page.evaluate(k => localStorage.getItem(k), GOALS);
const welcome = (page: Page) => page.getByRole("region", { name: "Перший раз тут" });

test("first run: what the app is, the two modes, an optional real-life goal and an optional diagnostic; no level asked; one main action", async ({ page }) => {
  await page.goto("./");
  await expect(welcome(page)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Перший раз тут" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Твій наступний крок" })).toHaveCount(0);   // the first run takes the card's place
  await expect(welcome(page)).toContainText("01 · Навчання");
  await expect(welcome(page)).toContainText("02 · Симуляція YKI");
  await expect(welcome(page)).toContainText("Це не офіційний YKI");
  await expect(welcome(page).getByRole("checkbox")).toHaveCount(10);                        // nine life places + YKI
  await expect(welcome(page).locator(".btn:not(.secondary)")).toHaveCount(1);
  expect(await welcome(page).innerText()).not.toMatch(/твій рівень|який у тебе рівень|A1|A2|B1|B2|вік|країна/i);
  expect(await stored(page)).toBeNull();                                                    // nothing is stored before a button is pressed
  expect(await serious(page)).toEqual([]);
  await expect(page.locator(".my-goals")).toHaveCount(0);

  await welcome(page).getByLabel(/Житло та побут/).check();
  await welcome(page).getByLabel(/Робота та навчання/).check();
  await welcome(page).getByRole("button", { name: "Без знайомства — одразу до справ" }).click();

  await expect(welcome(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Твій наступний крок" })).toBeVisible();
  await expect(page.locator(".my-goals")).toContainText("Житло та побут, Робота та навчання");
  await expect(page.getByTestId("place-housing")).toContainText("твоя мета");
  await expect(page.getByTestId("place-work")).toContainText("твоя мета");
  await expect(page.getByTestId("place-health")).not.toContainText("твоя мета");
  expect(JSON.parse((await stored(page))!)).toMatchObject({ version: 1, goals: ["housing", "work"] });

  await page.reload();
  await expect(page.getByRole("heading", { name: "Твій наступний крок" })).toBeVisible();
  await expect(welcome(page)).toHaveCount(0);                                               // shown once
  await expect(page.locator(".my-goals")).toContainText("Житло та побут, Робота та навчання");
});

test("the short diagnostic is offered, not required: «Почати з короткого знайомства» opens it; skipping without a goal is fine too", async ({ page }) => {
  await page.goto("./");
  await welcome(page).getByRole("button", { name: "Почати з короткого знайомства" }).click();
  await expect(page.locator("#dg-title")).toBeVisible();                                    // the starting diagnostic itself
  expect(JSON.parse((await stored(page))!)).toMatchObject({ version: 1, goals: [] });      // closed without a goal: still closed
  await page.goto("./");
  await expect(welcome(page)).toHaveCount(0);
  await expect(page.locator(".my-goals")).toContainText("ще не обрано");
});

test("goals can be changed or cleared at any time, steer the session plan with a visible reason, and go with LEARN data", async ({ page }) => {
  await page.goto("./");
  await welcome(page).getByLabel(/Робота та навчання/).check();
  await welcome(page).getByRole("button", { name: "Без знайомства — одразу до справ" }).click();

  await page.getByRole("group", { name: "Або склади план заняття:" }).getByRole("button", { name: "20 хв" }).click();
  const goalBlock = page.getByTestId("plan-block").filter({ hasText: "це місце — твоя мета" });
  await expect(goalBlock.first()).toContainText("Робота та навчання");
  await page.getByRole("button", { name: "Закрити план" }).click();

  await page.getByRole("button", { name: "Змінити мету" }).click();
  await page.getByLabel(/Робота та навчання/).uncheck();
  await page.getByLabel(/Скласти іспит YKI/).check();
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Зберегти" }).click();
  await expect(page.locator(".my-goals")).toContainText("Скласти іспит YKI");
  await expect(page.getByTestId("place-work")).not.toContainText("твоя мета");
  expect(JSON.parse((await stored(page))!)).toMatchObject({ goals: ["yki"] });

  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
  expect(await stored(page)).toBeNull();                                                    // goals go with LEARN data
  await page.getByRole("button", { name: "На головну" }).click();
  await expect(welcome(page)).toBeVisible();                                                // a new learner again
});

test("320 px first run: no horizontal scroll, every goal and both buttons reachable, touch targets at least 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("./");
  await expect(welcome(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  for (const name of ["Почати з короткого знайомства", "Без знайомства — одразу до справ"]) {
    const box = await welcome(page).getByRole("button", { name }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  for (const label of await welcome(page).locator(".goal-choice label").all()) {
    const box = (await label.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
  expect(await serious(page)).toEqual([]);
});

test("a learner who has already saved something never sees the first run", async ({ page }) => {
  await page.goto("./");
  await welcome(page).getByRole("button", { name: "Без знайомства — одразу до справ" }).click();
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Фрази для життя/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
  await page.evaluate(k => localStorage.removeItem(k), GOALS);                              // even if the mark is lost
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Твій наступний крок" })).toBeVisible();
  await expect(welcome(page)).toHaveCount(0);
});

test("if-then plan (micro-missions, R08-MOT): optional, in the learner's own words; «Почати зараз» opens the chosen skill; no reminder or count; changed, deleted and erased with LEARN data", async ({ page }) => {
  await page.goto("./");
  await welcome(page).getByRole("button", { name: "Без знайомства — одразу до справ" }).click();
  const box = page.getByTestId("study-plan");
  await expect(box.getByRole("button", { name: "Почати зараз" })).toHaveCount(0);           // nothing is planned for the learner
  await box.locator("summary").click();
  await expect(box).toContainText("Нагадувань не буде");
  await box.getByRole("button", { name: "Зберегти план" }).click();
  await expect(box.getByRole("alert")).toContainText("своїми словами");
  await box.getByLabel(/Коли\? Своїми словами/).fill("коли сідаю в автобус до роботи");
  await box.getByLabel("Аудіювання").check();
  await box.getByLabel("5 хв").check();
  expect(await serious(page)).toEqual([]);
  await box.getByRole("button", { name: "Зберегти план" }).click();
  await expect(box).toContainText("Мій план: Коли сідаю в автобус до роботи, я 5 хв слухатиму фінську.");
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("hospodar-yki:web:study-plan:v1")))!)).toMatchObject({ skill: "listening", minutes: 5 });
  expect(await page.locator("main").innerText()).not.toMatch(/серія|streak|днів поспіль/i);

  await page.reload();
  await page.getByTestId("study-plan").getByRole("button", { name: "Почати зараз" }).click();
  await expect(page.getByRole("list", { name: "Аудіозаписи" })).toBeVisible();              // the chosen skill opens
  await page.goto("./");
  await page.getByTestId("study-plan").getByRole("button", { name: "Змінити" }).click();
  await page.getByTestId("study-plan").getByLabel("Говоріння").check();
  await page.getByTestId("study-plan").getByRole("button", { name: "Зберегти план" }).click();
  await expect(page.getByTestId("study-plan")).toContainText("говоритиму фінською");

  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("hospodar-yki:web:study-plan:v1"))).toBeNull();
});
