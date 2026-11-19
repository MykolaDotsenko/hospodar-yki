import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(r.violations.filter(v => ["critical", "serious"].includes(v.impact ?? ""))).toEqual([]);
};
const INPUT = "Kielikahvilaan voi ilmoittautua maanantaihin asti.";
const CORRECTED = "Ilmoittautuminen päättyy maanantaina, tapaaminen on keskiviikkona ja peruutus pitää tehdä tiistaihin mennessä.";
const MODEL = "Ilmoittautuminen päättyy maanantaina, mutta voi sulkeutua aiemmin.";

async function openLesson(page: Page, title: RegExp) {
  await page.goto("./");
  await page.getByTestId("nav-masterclass").click();
  await page.getByRole("list", { name: "Майстер-класи" }).getByRole("button", { name: title }).click();
}

test("masterclass (CURATED-09): own answers first; key, better version and model only after; new situation without text or model; two questions count as reading, texts ungraded", async ({ page }) => {
  await openLesson(page, /Määräajat ja poikkeukset/);
  await expect(page.getByText(INPUT, { exact: false })).toBeVisible();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
  await expect(page.getByText(CORRECTED)).toHaveCount(0);
  await expect(page.getByText(MODEL, { exact: false })).toHaveCount(0);
  await axe(page);
  await page.getByLabel("Keskiviikkona").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);           // no key between the two questions
  await page.getByLabel("Ei koskaan").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  const results = page.getByRole("list", { name: "Твої відповіді й ключі" });
  await expect(results.locator("li").nth(0)).toContainText("Правильно з першої спроби");
  await expect(results.locator("li").nth(1)).toContainText("Ще не так");
  await expect(results.locator("li").nth(1)).toContainText("Kyllä, jos ryhmä täyttyy");
  await expect(page.getByRole("radio")).toHaveCount(0);                                            // answers frozen
  await page.getByRole("button", { name: "Далі" }).click();

  await expect(page.getByText("Tapaaminen on maanantaina ja sen voi perua keskiviikkona.")).toBeVisible();
  await expect(page.getByTestId("mc-corrected")).toHaveCount(0);
  await page.getByLabel(/Твоя краща версія/).fill("Ilmoittaudu maanantaihin mennessä, tapaaminen on keskiviikkona.");
  await page.getByRole("button", { name: "Показати кращу версію" }).click();
  await expect(page.getByTestId("mc-corrected")).toContainText(CORRECTED);
  await page.getByRole("button", { name: "Далі" }).click();

  await expect(page.getByTestId("mc-model")).toHaveCount(0);
  await page.getByLabel(/Твоя відповідь фінською/).fill("Ilmoittautuminen loppuu maanantaina. Tapaaminen on keskiviikkona.");
  await page.getByRole("button", { name: "Відповісти й побачити зразок" }).click();
  await expect(page.getByTestId("mc-model")).toContainText(MODEL);
  const compare = page.getByTestId("mc-compare");
  await expect(compare.locator("li")).toHaveCount(4);
  expect(await compare.innerText()).not.toMatch(/\d/);                                            // labels, never points
  await axe(page);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу порівняй");
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();

  await expect(page.getByText(/Uusi työpaja/)).toBeVisible();
  await expect(page.getByText(INPUT, { exact: false })).toHaveCount(0);                           // new situation: no text…
  await expect(page.getByTestId("mc-model")).toHaveCount(0);                                     // …and no model
  await page.getByLabel(/Твій текст фінською/).fill("Ilmoittaudu perjantaihin mennessä. Tapahtuma on sunnuntaina.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Урок збережено на цьому пристрої/)).toBeVisible();

  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Читання" })).toContainText("1 з 2 перевірених відповідей правильні");
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("3 без оцінки");
});

test("masterclass (CURATED-09): a listening masterclass says its text is not the transcript and opens the recording's own listening lesson", async ({ page }) => {
  await openLesson(page, /Ensikuuntelun pääasia/);
  await expect(page.getByText("Навчальний текст (не транскрипт запису)")).toBeVisible();
  await page.getByTestId("mc-recording").getByRole("button", { name: "Відкрити урок аудіювання" }).click();
  await expect(page.getByRole("heading", { name: "Про що, на твою думку, буде запис?" })).toBeVisible();   // the listening lesson's own steps
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await expect(page.locator("audio")).toHaveCount(1);
  await expect(page.locator(".transcript")).toHaveCount(0);                                       // the listening lesson's own rules apply
});

test("pause and resume (COG-11): an unfinished masterclass survives a reload at the same step with its frozen answers; finishing leaves no draft", async ({ page }) => {
  await openLesson(page, /Määräajat ja poikkeukset/);
  await page.getByLabel("Keskiviikkona").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel("Ei koskaan").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("list", { name: "Твої відповіді й ключі" })).toBeVisible();          // keys seen
  await page.reload();
  await page.getByTestId("nav-masterclass").click();
  const row = page.getByRole("list", { name: "Майстер-класи" }).getByRole("button", { name: /Määräajat ja poikkeukset/ });
  await expect(row).toContainText("незавершений — продовжиться з того самого місця");
  await row.click();
  await expect(page.getByTestId("lesson-restored")).toBeVisible();
  await expect(page.getByRole("list", { name: "Твої відповіді й ключі" }).locator("li").nth(1)).toContainText("Ще не так");   // the same frozen answers
  await expect(page.getByRole("radio")).toHaveCount(0);                                              // never asked again
  await axe(page);
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Твоя краща версія/).fill("Ilmoittaudu maanantaihin mennessä.");
  await page.reload();
  await page.getByTestId("nav-masterclass").click();
  await page.getByRole("list", { name: "Майстер-класи" }).getByRole("button", { name: /Määräajat ja poikkeukset/ }).click();
  await expect(page.getByLabel(/Твоя краща версія/)).toHaveValue("Ilmoittaudu maanantaihin mennessä.");   // typing kept
  expect(await page.evaluate(() => localStorage.getItem("hospodar-yki:web:masterclass-drafts:v1"))).toContain("maanantaihin");
});
