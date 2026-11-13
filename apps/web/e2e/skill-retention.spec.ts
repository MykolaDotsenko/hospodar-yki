import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const T0 = new Date("2026-11-03T09:00:00+02:00");
const DAY7 = new Date("2026-11-10T09:00:00+02:00");
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

/** A paraphrase card leaves reading (scored choice) and writing (retell, transfer) evidence = both skills start counting. */
async function paraphraseCard(page: Page) {
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Те саме іншими словами/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await page.getByLabel("Liike palvelee asiakkaita eri aikoihin ensi viikosta lähtien.").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Kauppa on auki eri aikaan.");
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Kirjasto on auki myöhempään.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
}
async function openChecks(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Пройти" }).click();
  await expect(page.getByRole("heading", { name: "Відкладені перевірки за навичками" })).toBeVisible();
}

test("GL-03 reading: day-7 check on a withheld text; first answers frozen; keys only after a durable save; not repeatable", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await paraphraseCard(page);
  await page.goto("./");
  await expect(page.getByText(/Сьогодні є відкладена перевірка/)).toHaveCount(0);       // nothing before day 7

  await page.clock.setFixedTime(DAY7);
  await openChecks(page);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Пройти перевірку дня 7" }).first().click();
  await expect(page.getByText("Korjaustyö ja kulku porraskäytävässä")).toBeVisible();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
  await page.getByLabel("Pääovesta").check();                                             // wrong on purpose
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Питання 2 з 4")).toBeVisible();
  await expect(page.getByLabel("Pääovesta")).toHaveCount(0);                              // frozen: no way back
  await page.getByLabel("Väärin").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel(/Mihin mennessä/).fill("Perjantaina.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
  await page.getByLabel("Oikein").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Перевірку збережено на цьому пристрої.")).toBeVisible();
  await expect(page.getByText("Ще не так").first()).toBeVisible();
  await expect(page.getByText("Sisäpihan ovesta")).toBeVisible();
  await page.getByRole("button", { name: "Готово" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Пройти" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Читання" })).toContainText("Виконано: день 7");
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Читання" })).toContainText("Відкладено (нове завдання через 7 дн.): 2 з 3 перших відповідей правильні");
});

test("GL-03 writing: withheld prompt, own text saved ungraded; task points appear only afterwards as self-check", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await paraphraseCard(page);
  await page.clock.setFixedTime(DAY7);
  await openChecks(page);
  await page.locator(".skill-lines li", { hasText: "Письмо" }).getByRole("button", { name: "Пройти перевірку дня 7" }).click();
  await expect(page.getByText(/Самоперевірка/)).toHaveCount(0);
  await page.getByLabel(/Твій текст фінською/).fill("Hei Mira! Voisitko kastella kukkani ensi viikolla? Kiitos!");
  await page.getByRole("button", { name: "Зберегти відповідь" }).click();
  await expect(page.getByText("Перевірку збережено на цьому пристрої.")).toBeVisible();
  await expect(page.getByText(/Самоперевірка — чи є у твоїй відповіді ці пункти/)).toBeVisible();
  await page.getByRole("button", { name: "Готово" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Письмо" })).toContainText("Виконано: день 7");
});

test("GL-03 listening: audio first, a lesson never met before; text support saves ungraded", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await page.getByTestId("nav-listening").click();
  await page.getByRole("list", { name: "Аудіозаписи" }).getByRole("button", { name: /Kun verkkokaupan tilaus meni pieleen/ }).click();
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await page.locator("audio").evaluate(a => a.dispatchEvent(new Event("play")));
  await page.getByRole("button", { name: "До питань" }).click();
  for (let i = 0; i < 4; i++) {
    await expect(page.getByText(`Питання ${i + 1} з 4`)).toBeVisible();
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await page.getByRole("button", { name: /Послухати ще раз із текстом/ }).click();
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();

  await page.clock.setFixedTime(DAY7);
  await openChecks(page);
  await page.locator(".skill-lines li", { hasText: "Аудіювання" }).getByRole("button", { name: "Пройти перевірку дня 7" }).click();
  await expect(page.getByText("Kun verkkokaupan tilaus meni pieleen")).toHaveCount(0);              // a lesson never met, not the known one
  await expect(page.locator('input[name="skq"]').first()).toBeDisabled();                 // audio first
  await expect(page.locator(".transcript")).toHaveCount(0);
  await page.getByRole("button", { name: "Показати текст (тоді без оцінки)" }).click();
  await expect(page.locator(".transcript")).toBeVisible();
  for (let i = 0; i < 20 && await page.getByText(/Питання \d+ з \d+/).count(); i++) {
    await page.locator('input[name="skq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await expect(page.getByText("Перевірку збережено на цьому пристрої.")).toBeVisible();
  await expect(page.getByText("З показаним текстом — збережено без оцінки.")).toBeVisible();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
});
