import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

test("IV-REQ-05 reading: answer first; keys + exact evidence span with label only after; EXAM texts excluded; saved honestly", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "📖 Читання" }).click();
  await expect(page.getByRole("button", { name: /Kirjaston kielikahvila/ })).toBeVisible();
  // EXAM-11: texts used by the mini YKI rehearsals are not offered in LEARN
  await expect(page.getByRole("button", { name: /Taloyhtiön|Asukas|ctx-reading-02/ })).toHaveCount(0);
  expect(await page.locator(".choices .choice").count()).toBe(7);
  await page.getByRole("button", { name: /Kirjaston kielikahvila/ }).click();
  await expect(page.locator("mark.evidence-span")).toHaveCount(0);
  await expect(page.getByText("Lyhyt tutustumisharjoitus.", { exact: true })).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу дай відповідь");
  await page.getByLabel("Ei tarvitse").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel("Oikein").check();                                  // wrong on purpose (statement is false)
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel(/Mitä tehdään tapaamisen alussa/).fill("He tutustuvat toisiinsa.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("heading", { name: "Що вийшло і де це в тексті" })).toBeVisible();
  await expect(page.locator("mark.evidence-span")).toHaveCount(3);
  await expect(page.locator("mark.evidence-span").first()).toContainText("← питання");
  await expect(page.locator("mark.evidence-span", { hasText: "eikä osallistuminen maksa mitään" })).toContainText("← питання 1");
  await expect(page.getByText("Правильно з першої спроби")).toHaveCount(1);
  await expect(page.getByText("Ще не так")).toHaveCount(1);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Далі: написати" }).click();
  await expect(page.getByRole("alert")).toContainText("порівняй свої відкриті відповіді");
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі: написати" }).click();
  await expect(page.getByRole("heading", { name: "Нове завдання — без тексту" })).toBeVisible();
  await expect(page.locator(".reading-text")).toHaveCount(0);
  await page.getByLabel(/Твій текст фінською/).fill("Hei! Haluaisin tulla kielikahvilaan keskiviikkona, koska haluan puhua enemmän.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Читання$/ }) })).toContainText("1 з 2 перевірених відповідей правильні; 1 без оцінки");
});
