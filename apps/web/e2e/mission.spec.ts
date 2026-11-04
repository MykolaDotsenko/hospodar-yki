import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// First unattempted exercise for a fresh profile: b1-g-001 "Huomenna menen ___ (kirjasto)." → kirjastoon
const KEY = "kirjastoon";

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => `${v.id}: ${v.nodes.length}`);
}
async function startMission(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByRole("heading", { name: "Твоя відповідь" })).toBeVisible();
}

test("home: two modes, honest exam status, no serious axe violations", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  await expect(page.getByText("01")).toBeVisible();
  await expect(page.getByText(/Симуляція YKI/)).toBeVisible();
  await expect(page.getByText(/Не офіційний YKI: правила цифрового іспиту 2027 ще не підтверджено/)).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("wrong → repair without key → feedback with key → transfer → saved; survives reload", async ({ page }) => {
  await startMission(page);
  await expect(page.locator(".prompt[lang=fi]")).toContainText("kirjasto");
  await expect(page.getByText("Чернетка: ще не перевірено S2-викладачем.")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);           // COLOR-02: no key during repair
  await expect(page.getByText(KEY, { exact: true })).toHaveCount(0);
  await page.getByLabel("Впиши пропущену форму фінською").fill(KEY);
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.locator(".learning-cue")).toHaveText(KEY);          // key only in feedback
  await expect(page.getByText(/керована підказка/)).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);           // COLOR-03: none in transfer
  await page.getByLabel(/Твоє власне речення/).fill("Huomenna menen kauppaan.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("Виконано місій:")).toContainText("1");
});

test("empty answer is refused with an accessible error; keyboard-only flow works", async ({ page }) => {
  await page.goto("./");
  for (let i = 0; i < 8; i++) {                       // reach the learn entry with Tab only
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes("Навчання")) break;
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Твоя відповідь" })).toBeFocused();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("alert")).toHaveText("Спершу напиши відповідь.");
  await page.getByLabel("Впиши пропущену форму фінською").fill(KEY);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Правильно з першої спроби.")).toBeVisible();
});

test("second tab with a stale snapshot never shows a fake 'saved' (REVISION_CONFLICT)", async ({ page, context }) => {
  const other = await context.newPage();
  await startMission(page);
  await other.goto("./");
  await other.getByRole("button", { name: /Навчання/ }).click();
  for (const p of [page, other]) {
    await p.getByLabel("Впиши пропущену форму фінською").fill(KEY);
    await p.getByRole("button", { name: "Перевірити" }).click();
    await p.getByRole("button", { name: "Далі: нова ситуація" }).click();
    await p.getByLabel(/Твоє власне речення/).fill("Oma lause.");
  }
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await other.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(other.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(other.getByText(/Збережено на цьому пристрої/)).toHaveCount(0);
});

test("320 px wide and 200% text: no horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await startMission(page);
  await page.addStyleTag({ content: "html{font-size:200%}" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
