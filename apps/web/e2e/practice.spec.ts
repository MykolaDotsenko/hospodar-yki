import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, kind: RegExp) {
  await page.goto("./");
  await page.getByRole("button", { name: "🗣 Практика без підказки" }).click();
  await page.getByRole("button", { name: kind }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
}
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(r.violations.filter(v => ["critical", "serious"].includes(v.impact ?? ""))).toEqual([]);
};

test("Paraphrase: frozen choice, key only after it, retell without options, verified save survives reload", async ({ page }) => {
  await open(page, /Те саме іншими словами/);
  await expect(page.getByText("Liike palvelee asiakkaita eri aikoihin ensi viikosta lähtien.")).toBeVisible();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
  await axe(page);
  await page.getByLabel("Liike on kokonaan kiinni ensi viikolla.").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Ще не так")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByText("Liike palvelee asiakkaita", { exact: false })).toHaveCount(0);
  await page.getByRole("textbox").fill("Kaupan aukioloajat ovat erilaiset ensi viikolla.");
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ensi kuussa kirjasto on auki myöhempään.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "🗣 Практика без підказки" }).click();
  await expect(page.getByRole("button", { name: /Те саме іншими словами/ })).toContainText("пройдено 1 з 24");
});

test("Phrase card: model hidden until own answer, self-comparison required before the new situation", async ({ page }) => {
  await open(page, /Фрази для життя/);
  await expect(page.getByText("переїхати до Фінляндії")).toBeVisible();
  await expect(page.getByText("muuttaa Suomeen")).toHaveCount(0);
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("muuttaa Suomeen", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("alert")).toContainText("порівняй");
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await axe(page);
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByText("Muutin Suomeen kolme vuotta sitten.")).toHaveCount(0);
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen viime vuonna.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
});

test("Spaced retrieval: a phrase judged 'partly' returns the next day; a recalled one is never scheduled", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-11T09:00:00+02:00") });
  await open(page, /Фрази для життя/);
  await page.getByRole("textbox").fill("mennä Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Цю фразу повторимо завтра/)).toBeVisible();
  await page.getByRole("button", { name: "До списку карток" }).click();
  await expect(page.getByText(/Сьогодні на повторення/)).toHaveCount(0);      // not massed on the same day

  await page.clock.setFixedTime(new Date("2026-11-12T09:00:00+02:00"));
  await page.reload();
  await expect(page.getByRole("button", { name: /Практика без підказки · повторити 1/ })).toBeVisible();
  await page.getByRole("button", { name: /Практика без підказки/ }).click();
  await page.getByRole("button", { name: "Повторити" }).click();
  await expect(page.getByText("Повторення: згадай без зразка.")).toBeVisible();
  await expect(page.getByText("muuttaa Suomeen")).toHaveCount(0);
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Haluan muuttaa Suomeen ensi vuonna.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Наступне повторення — через довший проміжок/)).toBeVisible();
  await page.getByRole("button", { name: "До списку карток" }).click();
  await expect(page.getByText(/Сьогодні на повторення/)).toHaveCount(0);
});
