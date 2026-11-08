import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Reports the failing element too, so a browser-specific violation is diagnosable from the CI log alone. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);

async function oneMission(page: Page) {
  await page.getByRole("button", { name: /Навчання/ }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await page.getByLabel(/Твоє власне речення/).fill("Menen kauppaan.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
}
async function speakingSubtest(page: Page) {
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  for (const s of ["Читання", "Аудіювання", "Письмо"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await page.getByRole("textbox").fill("Sopisiko perjantai?");
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await page.getByRole("button", { name: "Нова репетиція" }).click();
  await expect(page.locator(".exam-history li")).toHaveCount(1);
  await page.getByRole("button", { name: "На головну" }).click();
}

test("LEARN-16/WEB-07: my data — verified JSON export, then separate typed-confirmation erase of EXAM and LEARN", async ({ page }) => {
  await page.goto("./");
  await oneMission(page);
  await speakingSubtest(page);

  await page.getByRole("button", { name: "Мій прогрес" }).click();          // exam history now visible in progress, separately
  await page.getByRole("tab", { name: "Пробні іспити" }).click();
  await expect(page.locator(".exam-history li")).toContainText("Говоріння: 1 без оцінки");
  await page.getByRole("button", { name: "На головну" }).click();

  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("heading", { name: "Мої дані" })).toBeVisible();
  const stored = page.getByRole("list", { name: "Збережені дані" });
  await expect(stored).toContainText("місій 1");
  await expect(stored).toContainText("завершених репетицій 1");
  expect(await serious(page)).toEqual([]);

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^hospodar-yki-my-data-\d{4}-\d\d-\d\d\.json$/);
  const file = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(file).toMatchObject({ format: "hospodar-yki-web-export", version: 1, counts: { attempts: 1, examHistory: 1 } });
  expect(file.learn.state.attempts[0].transferText).toBe("Menen kauppaan.");
  expect(file.exam.history[0].bySkill.speaking.ungraded).toBe(1);
  expect(JSON.stringify(file)).not.toMatch(/officialGrade|ykiPass|predict/i);
  await expect(page.getByRole("status")).toContainText(/Файл перевірено й завантажено/);
  await expect(page.locator("code.hash")).toHaveText(/^[0-9a-f]{64}$/);

  // EXAM erase: wrong word keeps the button disabled; the right one erases exam data only.
  await page.getByLabel("Усі пробні іспити, їхню історію й голосові записи").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("так");
  await expect(page.getByRole("button", { name: "Видалити пробні іспити" })).toBeDisabled();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити пробні іспити" }).click();
  await expect(page.getByText(/Пробні іспити видалено й перевірено/)).toBeVisible();
  await expect(stored).toContainText("завершених репетицій 0");
  await expect(stored).toContainText("місій 1");                              // LEARN untouched
  await expect(page.getByLabel(/Усі пробні іспити.*\(порожньо\)/)).toBeDisabled();

  await page.reload();                                                        // durable, not just UI state
  await expect(page.getByText(/Виконано місій: 1/)).toBeVisible();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Ще немає завершених репетицій.")).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();

  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("видалити");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Виконано місій: 0/)).toBeVisible();
});

test("a second tab's newer progress is never erased by a stale screen (REVISION_CONFLICT, data kept)", async ({ page, context }) => {
  await page.goto("./");
  await oneMission(page);
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  const other = await context.newPage();
  await other.goto("./");
  await oneMission(other);                                                    // other tab commits a newer revision
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByRole("alert")).toHaveText(/НЕ видалено.*іншій вкладці/);
  await page.reload();
  await expect(page.getByText(/Виконано місій: 2/)).toBeVisible();
});

test("LEARN-16: an unfinished mission is erasable but never falsely exported as completed", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kesken oleva luonnos");
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  const stored = page.getByRole("list", { name: "Збережені дані" });
  await expect(stored).toContainText("місій 0");
  await expect(stored).toContainText("незавершених місій 1");
  await expect(page.getByText(/не експортується незавершена чернетка/)).toBeVisible();
  await expect(page.getByLabel("Увесь прогрес навчання")).toBeEnabled();
  const [dl] = await Promise.all([
    page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click(),
  ]);
  const json = JSON.parse(readFileSync((await dl.path())!, "utf8"));
  expect(json.counts.attempts).toBe(0);
  expect(JSON.stringify(json)).not.toContain("kesken oleva luonnos");
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByText(/Продовжуємо незавершену місію/)).toHaveCount(0);
  await expect(page.getByLabel("Впиши пропущену форму фінською")).toHaveValue("");
  expect(await serious(page)).toEqual([]);
});

test("LEARN-16: stale data screen cannot erase a draft modified in a second tab", async ({ page, context }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("Minä menen.");
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("незавершених місій 1");
  const second = await context.newPage();
  await second.goto("./");
  await second.getByRole("button", { name: /Навчання/ }).click();
  await expect(second.getByLabel("Впиши пропущену форму фінською")).toHaveValue("Minä menen.");
  await second.getByLabel("Впиши пропущену форму фінською").fill("Minä menen nyt.");
  await second.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByRole("alert")).toContainText("НЕ видалено");
  await second.reload();
  await second.getByRole("button", { name: /Навчання/ }).click();
  await expect(second.getByLabel("Впиши пропущену форму фінською")).toHaveValue("Minä menen nyt.");
});
