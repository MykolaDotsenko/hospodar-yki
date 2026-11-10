import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const T0 = new Date("2026-11-03T09:00:00+02:00");
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

async function wrongMission(page: Page) {
  await page.getByRole("button", { name: /Навчання/ }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  // Phase becomes repair only after the first IndexedDB checkpoint ACK.
  // Otherwise a fast WebKit test can fill the old input and race its reset.
  await expect(page.getByRole("button", { name: "Перевірити ще раз" })).toBeVisible();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  // Distinguish an actual refused IndexedDB write from a temporarily delayed feedback render.
  await expect.poll(async () => {
    const error = await page.locator("#mission-error").count() ? await page.locator("#mission-error").textContent() : null;
    return error ? `SAVE ERROR: ${error}` : await page.locator("#mission-title").textContent();
  }).toContain("Що вийшло");
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await page.getByLabel(/Твоє власне речення/).fill("Menen kauppaan.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
}

test("UX-05/UIO-08 progress: separate honest signals, actionable next step, no % or level", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.getByText("Ще не тренувалося в цій версії.").first()).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
  await wrongMission(page);
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.getByText("Самостійно правильно з першої спроби:")).toContainText("0 з 1");
  await expect(page.getByText(/Виправлено з підказкою/)).toContainText("1");
  const panel = page.getByRole("tabpanel");
  expect(await panel.innerText()).not.toMatch(/\d\s*%/);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("tab", { name: "Пробні іспити" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("не змішуються");
});

test("IV-REQ-03: day-7 delayed check appears only after 7 real days, is saved ungraded and not repeatable", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await wrongMission(page);
  await expect(page.getByText("Сьогодні є відкладена перевірка")).toHaveCount(0);
  await page.clock.setSystemTime(new Date(T0.getTime() + 8 * 86400000));
  await page.reload();
  await page.getByRole("button", { name: "Пройти" }).click();
  await expect(page.getByText(/День 7/)).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);   // no hints, no key
  expect(await serious(page)).toEqual([]);
  await page.getByLabel(/Твоя відповідь фінською/).fill("Menen huomenna uimahalliin.");
  await expect(page.getByRole("region", { name: "Порівняння власних відповідей" })).toHaveCount(0);
  await page.getByRole("button", { name: "Зберегти відповідь" }).click();
  await expect(page.getByText(/Відповідь збережено на цьому пристрої \(без оцінки\)/)).toBeVisible();
  const reflection = page.getByRole("region", { name: "Порівняння власних відповідей" });
  await expect(reflection).toContainText("Menen kauppaan.");
  await expect(reflection).toContainText("Menen huomenna uimahalliin.");
  await expect(reflection).toContainText("не автоматична оцінка правильності");
  expect(await serious(page)).toEqual([]);
  await page.reload();
  await expect(page.getByText("Сьогодні є відкладена перевірка")).toHaveCount(0);
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.getByText("Виконано (без оцінки):")).toContainText("1");
});

test("LE-10: own earlier Finnish sentence remains hidden until delayed answer is durably saved", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await wrongMission(page);
  await page.clock.setSystemTime(new Date(T0.getTime() + 8 * 86400000));
  await page.reload();
  await page.getByRole("button", { name: "Пройти" }).click();
  await expect(page.getByText("Menen kauppaan.")).toHaveCount(0);
  await page.getByLabel(/Твоя відповідь фінською/).fill("Menen kirjastoon.");
  await expect(page.getByText("Menen kauppaan.")).toHaveCount(0);
  await page.getByRole("button", { name: "Зберегти відповідь" }).click();
  await expect(page.getByText("Menen kauppaan.")).toBeVisible();
  await expect(page.getByText("Menen kirjastoon.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Наступне повторення/ })).toHaveCount(0);
  await expect(page.locator(".learning-cue")).toHaveCount(0);
});

test("IV-REQ-03: complete two due novel transfers one by one without merging or grading", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await wrongMission(page);
  await wrongMission(page); // R06 excludes tasks already practised today
  await page.clock.setSystemTime(new Date(T0.getTime() + 8 * 86400000));
  await page.reload();
  await expect(page.getByText("Сьогодні є відкладена перевірка")).toBeVisible();
  await page.getByRole("button", { name: "Пройти" }).click();
  await expect(page.getByText(/День 7 · тема: illatiivi/)).toBeVisible();
  await page.getByLabel(/Твоя відповідь фінською/).fill("Menen huomenna kirjastoon.");
  await page.getByRole("button", { name: "Зберегти відповідь" }).click();
  await expect(page.getByRole("button", { name: "Наступне повторення (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Наступне повторення (1)" }).click();
  await expect(page.getByText(/День 7 · тема: elatiivi/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Порівняння власних відповідей" })).toHaveCount(0);
  await expect(page.getByText("Menen kauppaan.")).toHaveCount(0);
  await page.getByLabel(/Твоя відповідь фінською/).fill("Tulin koulusta.");
  await page.getByRole("button", { name: "Зберегти відповідь" }).click();
  await expect(page.getByRole("button", { name: /Наступне повторення/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Порівняння власних відповідей" })).toContainText("Tulin koulusta.");
  await page.reload();
  await expect(page.getByText("Сьогодні є відкладена перевірка")).toHaveCount(0);
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.getByText("Виконано (без оцінки):")).toContainText("2");
  const content = await page.getByRole("tabpanel").innerText();
  expect(content).not.toMatch(/офіційний рівень|YKI 3|\d+\s*%/i);
  expect(await serious(page)).toEqual([]);
});
