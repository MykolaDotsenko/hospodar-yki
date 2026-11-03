import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const A1 = "Hei! Onko tässä kielikahvila?";

test("IV-REQ-07 dialogue: learner replies first as speaker A; script line only after; answer before model; evidence cue after attempt; saved ungraded", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "💬 Діалоги" }).click();
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
  await expect(page.getByText(A1)).toHaveCount(0);
  await expect(page.getByText("Kyllä on, tervetuloa!")).toHaveCount(0);
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  await page.getByLabel(/Твоя репліка фінською/).fill("Hei! Olen uusi täällä.");
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByText("Olen uusi täällä.")).toBeVisible();
  await expect(page.getByText(A1)).toBeVisible();
  expect(await serious(page)).toEqual([]);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Далі" }).click();                       // to the interlocutor line
    await page.getByRole("button", { name: "Далі" }).click();                       // to the learner's turn
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByText("Tavallisista asioista")).toBeVisible();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("heading", { name: "Що ти зрозумів(ла)?" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await expect(page.getByText("Hän haluaa harjoitella puhumista.")).toHaveCount(0);
  await page.getByLabel(/Miksi Oksana tuli/).fill("Hän haluaa puhua suomea.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Hän haluaa harjoitella puhumista.")).toBeVisible();
  await expect(page.locator(".learning-cue")).toContainText("Haluaisin harjoitella puhumista");
  await expect(page.getByText("← тут це сказано")).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Pitääkö ryhmään/).fill("Ei tarvitse.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await expect(page.getByRole("heading", { name: "Твоя ситуація" })).toBeVisible();
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, olen Oksana. Voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("1 без оцінки");
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Читання$/ }) })).toContainText("2 без оцінки");
});
