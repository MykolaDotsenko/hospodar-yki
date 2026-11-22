import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const SECRET = "Asun Vantaalla ja nimeni on Olena";

async function openData(page: Page) {
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("heading", { name: "Мої дані" })).toBeVisible();
}
/** A phrase card with about a minute of active work on the screen (input, then 60 s of 5-second ticks). */
async function phraseCard(page: Page) {
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Фрази для життя/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await page.getByRole("textbox").fill(SECRET);
  await page.clock.runFor(60_000);
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill(SECRET);
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
  await page.getByRole("button", { name: "До списку карток" }).click();
  await page.getByRole("button", { name: "На головну" }).click();
}

test("research mode (R01 readiness): opt-in with a study code and consent; active time counted only after enrolment; the researcher file has no learner text; withdrawal deletes the log", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T09:00:00+02:00") });
  await page.goto("./");
  await phraseCard(page);                                                   // before enrolment: nothing is counted

  await openData(page);
  const panel = page.getByTestId("research-panel");
  const start = panel.getByRole("button", { name: "Почати участь" });
  await expect(start).toBeDisabled();
  await panel.getByLabel("Код учасника від дослідника").fill("olena@example.fi");
  for (const box of await panel.getByRole("checkbox").all()) await box.check();
  await expect(start).toBeDisabled();                                       // an e-mail is not a study code
  await panel.getByLabel("Код учасника від дослідника").fill("r01-a17");
  await panel.getByRole("checkbox").first().uncheck();
  await expect(start).toBeDisabled();                                       // every consent item is needed
  await panel.getByRole("checkbox").first().check();
  expect(await serious(page)).toEqual([]);
  await start.click();
  await expect(panel.getByRole("status")).toContainText("R01-A17");
  await expect(panel).toContainText("Час ще не облічено");                  // the card before enrolment left no time
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "На головну" }).click();

  await phraseCard(page);
  await openData(page);
  await expect(panel.getByRole("list", { name: "Облічений час за розділами" })).toContainText("Практика без підказки: 1 хв");

  const [download] = await Promise.all([page.waitForEvent("download"), panel.getByRole("button", { name: "Завантажити файл для дослідника (JSON)" }).click()]);
  expect(download.suggestedFilename()).toBe("hospodar-research-R01-A17.json");
  const text = await (await download.createReadStream()).toArray().then(chunks => Buffer.concat(chunks).toString("utf8"));
  expect(text).not.toContain("Vantaalla");
  expect(text).not.toContain("Olena");
  expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);                            // no calendar dates
  const data = JSON.parse(text);
  expect(data).toMatchObject({ format: "hospodar-research-export", study_code: "R01-A17", protocol_status: "draft, not approved", export_day_index: 0 });
  const practice = data.study_time.filter((x: { area: string }) => x.area === "practice");
  expect(practice).toHaveLength(1);
  expect(practice[0].seconds).toBeGreaterThanOrEqual(55);
  expect(practice[0].seconds).toBeLessThanOrEqual(75);                      // only the active minute, not the whole session
  // The same card was first answered before enrolment the same morning: that first answer is prior exposure (by time, not day).
  expect(data.first_attempts.some((x: { skill: string; scored: boolean; before_enrollment: boolean; day_index: number }) =>
    x.skill === "writing" && !x.scored && x.before_enrollment === true && x.day_index === 0)).toBe(true);
  expect(data.history).toMatchObject({ may_be_trimmed: false });
  await expect(page.getByTestId("research-made")).toContainText("Передай його досліднику сам(а)");

  await panel.getByRole("button", { name: "Вийти з дослідження" }).click();
  await panel.getByRole("button", { name: "Так, вийти й видалити облік" }).click();
  await expect(panel).toContainText("Ти вийшов(ла) з дослідження");
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes("research")))).toEqual([]);
  await page.reload();
  await openData(page);
  await expect(panel.getByRole("button", { name: "Почати участь" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("місій");   // learning progress is untouched
});

test("research mode: erasing LEARN data also removes the enrolment and the time log", async ({ page }) => {
  await page.goto("./");
  await openData(page);
  const panel = page.getByTestId("research-panel");
  await panel.getByLabel("Код учасника від дослідника").fill("HY24");
  for (const box of await panel.getByRole("checkbox").all()) await box.check();
  await panel.getByRole("button", { name: "Почати участь" }).click();
  await expect(panel.getByRole("status")).toContainText("HY24");
  await page.getByLabel("Увесь прогрес навчання", { exact: false }).check();
  await page.getByLabel(/Щоб підтвердити, введи слово/).fill(await page.locator("label[for=erase-confirm]").innerText().then(t => t.split(" ").pop()!));
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes("research")))).toEqual([]);
  await page.reload();
  await openData(page);
  await expect(panel.getByRole("button", { name: "Почати участь" })).toBeVisible();
});

test("research mode: an idle screen stops counting 2 minutes after the last input", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T09:00:00+02:00") });
  await page.goto("./");
  await openData(page);
  const panel = page.getByTestId("research-panel");
  await panel.getByLabel("Код учасника від дослідника").fill("HY24");
  for (const box of await panel.getByRole("checkbox").all()) await box.check();
  await panel.getByRole("button", { name: "Почати участь" }).click();
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByTestId("nav-practice").click();                           // the last input: this click
  await page.clock.runFor(10 * 60_000);                                     // ten idle minutes on a study screen
  await page.getByRole("button", { name: "На головну" }).click();
  await openData(page);
  await expect(panel.getByRole("list", { name: "Облічений час за розділами" })).toHaveText(/^Практика без підказки: 2 хв$/);
});

test("research mode: enrolling in another tab starts counting on a study screen that is already open", async ({ page, context }) => {
  const T = new Date("2026-11-10T09:00:00+02:00");
  await page.clock.install({ time: T });
  await page.goto("./");
  await page.getByTestId("nav-practice").click();                           // a study screen, not enrolled yet

  const other = await context.newPage();
  await other.clock.install({ time: T });
  await other.goto("./");
  await openData(other);
  const panel = other.getByTestId("research-panel");
  await panel.getByLabel("Код учасника від дослідника").fill("HY24");
  for (const box of await panel.getByRole("checkbox").all()) await box.check();
  await panel.getByRole("button", { name: "Почати участь" }).click();
  await expect(panel.getByRole("status")).toContainText("HY24");

  await page.bringToFront();
  await page.getByRole("button", { name: /Фрази для життя/ }).click();     // input on the already open study screen
  await page.clock.runFor(60_000);
  await page.getByRole("button", { name: "Інші види практики" }).click();
  await page.getByRole("button", { name: "На головну" }).click();
  await openData(page);
  await expect(page.getByTestId("research-panel").getByRole("list", { name: "Облічений час за розділами" })).toContainText("Практика без підказки: 1 хв");
});
