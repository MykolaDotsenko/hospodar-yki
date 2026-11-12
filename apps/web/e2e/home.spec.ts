import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

test("UIO-01 home: one recommended next step with its reason; four skills with constant colour, icon, Ukrainian and Finnish name", async ({ page }) => {
  await page.goto("./");
  const today = page.locator(".today");
  await expect(today.getByRole("heading", { name: "Твій наступний крок" })).toBeVisible();
  await expect(today.locator(".btn:not(.secondary)")).toHaveCount(1);                       // exactly one primary action
  await expect(today).toContainText("Почни з короткого знайомства");                         // brand-new learner
  await expect(today).toContainText(/Чому з цього:.*Рівень чи оцінку він не визначає/);     // visible reason, no level claim
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%/);

  const tiles = page.locator(".skill-tile");
  await expect(tiles).toHaveCount(4);
  for (const [id, uk, fi] of [["reading", "Читання", "Tekstin ymmärtäminen"], ["listening", "Аудіювання", "Puheen ymmärtäminen"],
    ["writing", "Письмо", "Kirjoittaminen"], ["speaking", "Говоріння", "Puhuminen"]] as const) {
    const t = page.getByTestId(`nav-${id}`);
    await expect(t).toContainText(uk); await expect(t.locator("[lang=fi]")).toHaveText(fi);
    await expect(t.locator("svg.icon")).toHaveCount(1);                                      // never colour alone
    await expect(t).toContainText("Ще не тренувалося");
  }
  const colours = await tiles.evaluateAll(els => els.map(e => getComputedStyle(e).borderLeftColor));
  expect(new Set(colours).size).toBe(4);                                                    // one constant colour per skill
  const small = await page.locator("main button:visible").evaluateAll(els => els.filter(e => e.getBoundingClientRect().height < 44).map(e => e.textContent));
  expect(small).toEqual([]);                                                                 // ≥44 px targets
  expect(await page.locator("main").innerText()).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);     // own icons, no emoji
  const css = await page.evaluate(() => [...document.styleSheets].flatMap(sh => [...sh.cssRules].map(r => r.cssText)).join("\n"));
  expect(css.length).toBeGreaterThan(2000);
  expect(css).not.toMatch(/gradient\(|backdrop-filter|@keyframes/);                         // DESIGN-11: no gradients, glass or animation loops
  expect(await serious(page)).toEqual([]);
});

test("home follows the learner: after first practice the next step names the skill never practised, with the reason", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Фрази для життя/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await expect(page.locator(".threshold-route [aria-current=step]")).toHaveText(/Твоя відповідь/);   // shared mission route
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.locator(".threshold-route [aria-current=step]")).toHaveText(/Зразок/);
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Muutin Suomeen viime vuonna.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
  await expect(page.locator(".threshold-route [aria-current=step]")).toHaveCount(0);                  // all steps done
  await page.goto("./");
  await expect(page.locator(".today")).toContainText("Потренуй читання.");
  await expect(page.locator(".today")).toContainText("ще немає жодної твоєї відповіді");
  await expect(page.getByTestId("nav-writing")).toContainText("Збережено відповідей: 2");
  await page.locator(".today .btn:not(.secondary)").click();
  await expect(page.getByRole("heading", { name: "Читання з доказами" })).toBeVisible();
});

test("320 px home: no horizontal scroll, tiles stack, utility links stay reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("./");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Мої дані: копія й видалення" })).toBeVisible();
  expect(await serious(page)).toEqual([]);
});
