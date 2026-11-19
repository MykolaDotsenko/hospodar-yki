import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const serious = async (page: import("@playwright/test").Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

test("external mission (CURATED-09): the publisher's audio index first; own words; the teacher answer page only after; a new situation; nothing scored", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-external").click();
  await expect(page.getByRole("button", { name: /Kurssivaraus/ })).toBeVisible();
  expect(await page.locator("section ul.choices > li").count()).toBe(27);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: /Kurssivaraus/ }).click();
  const source = page.getByTestId("ext-source");
  await expect(source).toHaveAttribute("href", "https://www.oph.fi/fi/oppimateriaali/paivaa/aanitteet");
  await expect(source).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator('a[href*="opettajan-aineistot"]')).toHaveCount(0);                     // teacher answers held back
  await expect(page.locator("audio, video, iframe, embed")).toHaveCount(0);                         // nothing embedded
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Asiakas haluaa varata paikan kurssilta.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByTestId("ext-reflection")).toBeVisible();
  await expect(page.getByTestId("ext-teacher-page").getByRole("link")).toHaveAttribute("href", /opettajan-aineistot/);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByTestId("ext-source")).toHaveCount(0);
  await page.getByLabel(/Скажи вголос/).fill("Hei! Verkkolomake ei toimi. Voitteko auttaa?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Місію збережено на цьому пристрої — без оцінки/)).toBeVisible();
  await expect(page.getByTestId("ext-later")).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Аудіювання" })).toContainText("1 без оцінки");
});

test("external mission (CURATED-09): a track that cannot be found ends the mission honestly — nothing saved, nothing invented", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-external").click();
  await page.getByRole("button", { name: /Kurssivaraus/ }).click();
  await page.getByRole("button", { name: "Не знайшов(ла) запису чи матеріалу" }).click();
  await expect(page.getByTestId("ext-not-found")).toContainText("нічого не збережено");
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Аудіювання" })).not.toContainText("без оцінки");
});

test("external missions in their places (docs/29 queue 10): a place lists its source missions; one opens straight into that mission; a done mission says so in its place", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("place-health").click();
  const quests = page.getByRole("list", { name: /^Справи:/ });
  const mission = quests.getByRole("button", { name: /Місія з джерелом · Terveyskeskuksessa/ });
  await expect(mission).toContainText("ще не пробував(ла)");
  await expect(quests.getByRole("button", { name: /Місія з джерелом/ })).toHaveCount(6);       // the six health missions
  await mission.click();
  await expect(page.getByTestId("ext-source")).toBeVisible();                                    // straight into the mission
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Terveyskeskuksessa");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Potilas varaa ajan lääkärille.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: /Далі/ }).first().click();
  await page.getByLabel(/фінською/).fill("Soitan terveyskeskukseen ja kysyn aikaa.");
  await page.getByRole("button", { name: /Зберегти/ }).click();
  await expect(page.getByText(/Місію збережено на цьому пристрої — без оцінки/)).toBeVisible();
  await page.goto("./");
  await page.getByTestId("place-health").click();
  await expect(page.getByRole("list", { name: /^Справи:/ }).getByRole("button", { name: /Місія з джерелом · Terveyskeskuksessa/ })).toContainText("ти вже пробував(ла)");
  expect(await serious(page)).toEqual([]);
});

test("pause and resume (COG-11): an unfinished external mission keeps the own answer after a reload; the teacher page stays after-only; «not found» keeps nothing", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-external").click();
  await page.getByRole("button", { name: /Kurssivaraus/ }).click();
  await page.getByLabel(/Твоя відповідь фінською/).fill("Asiakas haluaa varata paikan.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByTestId("ext-reflection")).toBeVisible();
  await page.reload();
  await page.getByTestId("nav-external").click();
  await expect(page.getByRole("button", { name: /Kurssivaraus/ })).toContainText("незавершена — продовжиться з того самого місця");
  await page.getByRole("button", { name: /Kurssivaraus/ }).click();
  await expect(page.getByTestId("lesson-restored")).toBeVisible();
  await expect(page.getByTestId("ext-reflection")).toBeVisible();                                     // the same step
  await expect(page.getByText("Asiakas haluaa varata paikan.")).toBeVisible();                        // the own answer, unchanged
  await expect(page.getByLabel(/Твоя відповідь фінською/)).toHaveCount(0);                           // not asked again
  await page.goto("./");
  await page.getByTestId("nav-external").click();
  await page.getByRole("button", { name: /Terveyskeskuksessa/ }).click();
  await page.getByRole("button", { name: /Не знайшов|не знайш/i }).click();
  const drafts = await page.evaluate(() => JSON.parse(localStorage.getItem("hospodar-yki:web:external-drafts:v1") ?? "{}"));
  expect(Object.keys(drafts)).toEqual(["oph-everyday-course-booking"]);                              // «not found» left nothing
});
