import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, kind: RegExp) {
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
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
  await page.getByTestId("nav-practice").click();
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
  await expect(page.getByTestId("nav-practice").filter({ hasText: "повторити 1" })).toBeVisible();
  await page.getByTestId("nav-practice").click();
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

test("pre-task planning (opinion): optional own plan, hidden while answering, back only next to the model; quick reactions get no plan", async ({ page }) => {
  await open(page, /Моя думка/);
  await expect(page.locator(".threshold-route [aria-current=step]")).toContainText("План і відповідь");
  await page.getByRole("button", { name: "Скласти план (за бажанням)" }).click();
  await expect(page.locator(".plan-frame li")).toHaveCount(3);
  await expect(page.getByText(/Фрази для структури/)).toHaveCount(0);                  // no scaffold while planning
  await axe(page);
  await page.getByLabel(/Твій план/).fill("pääajatus: hyvä · syy 1: aikaa · esimerkki");
  await page.getByRole("button", { name: "План готовий — відповідати" }).click();
  await expect(page.getByRole("status")).toContainText("План сховано");
  await expect(page.getByText("pääajatus: hyvä", { exact: false })).toHaveCount(0);   // out of sight while answering
  await expect(page.getByRole("button", { name: "Скласти план (за бажанням)" })).toHaveCount(0);
  await page.getByLabel(/Скажи вголос/).fill("Minusta se on hyvä, koska säästän aikaa.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.locator(".plan-back")).toContainText("pääajatus: hyvä");           // back for self-comparison
  await expect(page.getByText(/Фрази для структури/)).toBeVisible();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.locator(".plan-back")).toHaveCount(0);                              // not in the new situation
  await page.getByRole("textbox").fill("Kirjoitan lyhyesti mielipiteeni.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();

  await page.getByRole("button", { name: "До списку карток" }).click();
  await page.getByRole("button", { name: "Інші види практики" }).click();
  await page.getByRole("button", { name: /Реакція в ситуації/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await expect(page.getByRole("button", { name: "Скласти план (за бажанням)" })).toHaveCount(0);
});

test("graduated task sequencing: after a saved reaction card, the same situation again with one more constraint per step; ungraded self-check; stoppable", async ({ page }) => {
  await open(page, /Реакція в ситуації/);
  await page.getByRole("textbox").fill("Anteeksi, voisitteko auttaa?");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("button", { name: /Ускладнити/ })).toHaveCount(0);            // only after the card is saved
  await page.getByRole("textbox").fill("Hei, voisitko auttaa minua hetken?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();

  await page.getByRole("button", { name: "Ускладнити (за бажанням)" }).click();
  const constraints = page.getByTestId("stepup-constraints").locator("li");
  await expect(constraints).toHaveCount(1);
  await expect(constraints.first()).toContainText("Коротко");
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Voisitko auttaa?");
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("alert")).toContainText("Познач");                              // self-check required, never auto-graded
  await page.getByLabel("Так").check();
  await axe(page);
  await page.getByRole("button", { name: "Зберегти крок" }).click();

  await expect(page.getByRole("heading", { name: "Ускладнення 2 з 3" })).toBeVisible();
  await expect(constraints).toHaveCount(2);                                                   // the earlier constraint stays
  await expect(constraints.nth(1)).toContainText("нова умова");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Anteeksi, voisitteko auttaa minua?");
  await page.getByLabel("Частково").check();
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("heading", { name: "Ускладнення 3 з 3" })).toBeVisible();
  await page.getByRole("button", { name: "Досить на сьогодні" }).click();
  await expect(page.getByTestId("stepup-done")).toContainText("Ускладнень пройдено: 2 з 3");
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%|рівень|бал/);

  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("без оцінки");
});

test("repeated telling 4/3/2 after an opinion card: three rounds aloud with shrinking practice time, nothing recorded, only the learner's report saved", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-13T09:00:00+02:00") });
  await open(page, /Моя думка/);
  await page.getByRole("textbox").fill("Mielestäni etätyö on hyvä, koska säästän aikaa.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Minusta kirjasto on tärkeä, koska siellä voi opiskella rauhassa.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Розповісти тричі, щоразу коротше/ })).toBeVisible();
  await axe(page);

  await page.clock.pauseAt(new Date("2026-11-13T09:10:00+02:00"));
  await page.getByRole("button", { name: "Почати перший раунд" }).click();
  await expect(page.getByTestId("fluency-timer")).toContainText("2:00");
  await page.clock.runFor(120_500);
  await expect(page.getByTestId("fluency-timer")).toHaveCount(0);
  await page.getByRole("button", { name: "Наступний раунд (90 с)" }).click();
  await expect(page.getByTestId("fluency-timer")).toContainText("1:30");
  await page.getByRole("button", { name: "Я закінчив(ла) раніше" }).click();
  await page.getByRole("button", { name: "Наступний раунд (60 с)" }).click();
  await expect(page.getByTestId("fluency-timer")).toContainText("1:00");
  await page.clock.runFor(60_500);
  await page.getByRole("button", { name: "Зберегти" }).last().click();
  await expect(page.getByRole("alert")).toContainText("Познач");
  await page.getByLabel("Легше").check();
  await page.getByRole("button", { name: "Зберегти" }).last().click();
  await expect(page.getByTestId("fluency-done")).toContainText("Мовлення не записувалося");
});
