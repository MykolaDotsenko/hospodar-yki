import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** The preparation cycle around the rehearsal (TZ-EXAM-14 exposure part, TZ-EXAM-19, EXAM-09/10/11, EXV-03, AC-20). */
const T0 = new Date("2026-11-03T09:00:00+02:00");
const DAY14 = new Date("2026-11-17T09:00:00+02:00");
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const setLabel = (page: Page, name: RegExp) => page.locator("label.radio").filter({ hasText: name });

async function openExam(page: Page) {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
}
async function finishEmpty(page: Page) {
  await page.getByRole("button", { name: /Aloita/ }).click();
  for (let n = 1; n < 9; n++) { await expect(page.getByText(`Tehtävä ${n} / 9`)).toBeVisible(); await page.getByRole("button", { name: "Seuraava" }).click(); }
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
}

test("after a rehearsal: LEARN review per skill, the next rehearsal defaults to an UNSEEN set, a repeat is named as one, day 14 offers the re-check", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await openExam(page);
  await expect(setLabel(page, /Mini-rehearsal A/)).toContainText("ще не бачив(ла)");
  await expect(page.getByTestId("exam-retest")).toHaveCount(0);
  await finishEmpty(page);

  const next = page.locator(".exam-next");
  await expect(next.getByRole("list", { name: "Розбір у Навчанні" }).locator("li")).toHaveCount(4);
  await expect(next).toContainText("ці завдання іспиту там не з'являються");
  await expect(page.getByTestId("exam-next-retest")).toContainText("з 17.11.2026");
  expect(await page.locator("main").innerText()).not.toMatch(/рівень \d|\d\s*%|прогноз склад|taso [A-C]/i);
  expect(await serious(page)).toEqual([]);

  await page.getByRole("button", { name: "Нова репетиція" }).click();
  await expect(setLabel(page, /Mini-rehearsal B/).locator("input")).toBeChecked();          // unseen set by default
  await expect(setLabel(page, /Mini-rehearsal A/)).toContainText("уже бачив(ла): Читання, Аудіювання, Письмо, Говоріння");
  await expect(page.getByTestId("exam-retest")).toContainText("з 17.11.2026");
  await setLabel(page, /Mini-rehearsal A/).locator("input").check();
  await expect(page.getByText(/ти вже бачив\(ла\)\. Результат покаже повторення знайомого/)).toBeVisible();
  await finishEmpty(page);
  await page.getByRole("button", { name: "Нова репетиція" }).click();
  await expect(page.locator(".exam-history li")).toHaveCount(2);
  await expect(page.locator(".exam-history")).toContainText("повторення знайомого: Читання, Аудіювання, Письмо, Говоріння");

  await page.clock.setFixedTime(DAY14);
  await openExam(page);
  await expect(page.getByTestId("exam-retest")).toContainText("Сьогодні — повторна перевірка");
  await expect(page.getByTestId("exam-retest")).toContainText("Mini-rehearsal B");
});

test("results lead into LEARN on other material; an interrupted rehearsal continues with a Finnish notice (EXAM-10)", async ({ page }) => {
  await openExam(page);
  await page.getByRole("button", { name: /Aloita/ }).click();
  await page.getByLabel("Kellarissa").check();
  await page.getByRole("button", { name: "Seuraava" }).click();
  await expect(page.getByText("Tehtävä 2 / 9")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Jatkat keskeytynyttä harjoitusta. Vastauksesi on tallennettu.")).toBeVisible();
  await expect(page.getByText("Tehtävä 2 / 9")).toBeVisible();
  await page.getByRole("button", { name: "Seuraava" }).click();
  await expect(page.getByText("Jatkat keskeytynyttä harjoitusta")).toHaveCount(0);           // only on the screen where it resumed

  for (let n = 3; n < 9; n++) await page.getByRole("button", { name: "Seuraava" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Тренувати: аудіювання" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "learn");
  await expect(page.getByRole("heading", { name: "Обери запис", level: 1 })).toBeVisible();
});
