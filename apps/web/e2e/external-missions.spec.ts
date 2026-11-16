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
