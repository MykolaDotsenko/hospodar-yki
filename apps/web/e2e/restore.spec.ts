import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** User-level recovery of a NEW Web export, never a legacy V1 file. */
async function oneMission(page: Page) {
  await page.getByRole("button", { name: /Навчання/ }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("button", { name: "Перевірити ще раз" })).toBeVisible(); // first-answer ACK
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.getByRole("button", { name: "Далі: нова ситуація" })).toBeVisible(); // repair ACK
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await page.getByLabel(/Твоє власне речення/).fill("Menen kirjastoon.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
}
async function exportText(page: Page) {
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click()]);
  return readFileSync((await download.path())!, "utf8");
}
async function eraseLearn(page: Page) {
  await page.getByLabel("Увесь прогрес навчання").check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect(page.getByText(/Прогрес навчання видалено й перевірено/)).toBeVisible();
}
const upload = (page: Page, content: string) =>
  page.getByLabel(/Резервна копія нової Web-версії/).setInputFiles({
    name: "my-data.json", mimeType: "application/json", buffer: Buffer.from(content, "utf8"),
  });

test("WEB-07: restore LEARN after explicit empty-profile check; preserve independent answers across reload", async ({ page }) => {
  await page.goto("./");
  await oneMission(page);
  const backup = await exportText(page);
  await eraseLearn(page);
  await upload(page, backup);
  await expect(page.getByText(/Копію прочитано без втрати записів: місій 1/)).toBeVisible();
  await expect(page.getByText(/Пробні іспити та голосові записи з файлу не відновлюються/)).toBeVisible();
  const label = page.getByLabel(/Підтверджую відновлення тільки LEARN/);
  await expect(page.getByRole("button", { name: "Відновити навчання" })).toBeDisabled();
  await label.check();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(axe.violations.filter(v => ["critical", "serious"].includes(v.impact ?? ""))).toEqual([]);
  await page.getByRole("button", { name: "Відновити навчання" }).click();
  await expect(page.getByText(/Навчання відновлено та перечитано зі сховища/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Виконано місій: 1/)).toBeVisible();
  // The export retains first independent answer and ungraded transfer; restore is not a score reset.
  const reexport = JSON.parse(await exportText(page));
  expect(reexport.learn.state.attempts[0]).toMatchObject({
    firstAnswer: "kirjasto", firstCorrect: false, transferText: "Menen kirjastoon.", transferScoring: "ungraded",
  });
});

test("rejects tampered and foreign files; refuses silent merge with existing learning data", async ({ page }) => {
  await page.goto("./");
  await oneMission(page);
  const raw = JSON.parse(await exportText(page));
  await upload(page, JSON.stringify(raw));
  await expect(page.getByText(/Для відновлення потрібен порожній профіль LEARN/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Відновити навчання" })).toHaveCount(0);
  await eraseLearn(page);
  raw.learn.state.attempts[0].firstCorrect = "maybe";
  await upload(page, JSON.stringify(raw));
  await expect(page.getByRole("alert")).toContainText("UNSAFE_LEARN_DATA");
  await expect(page.getByRole("button", { name: "Відновити навчання" })).toHaveCount(0);
  await upload(page, '{"format":"foreign"}');
  await expect(page.getByRole("alert")).toContainText("WRONG_FORMAT");
  await page.reload();
  await expect(page.getByText(/Виконано місій: 0/)).toBeVisible();
});

test("a second tab wins the race: restore is refused without overwriting its first attempts", async ({ page, context }) => {
  await page.goto("./");
  await oneMission(page);
  const backup = await exportText(page);
  await eraseLearn(page);
  await upload(page, backup);
  await page.getByLabel(/Підтверджую відновлення тільки LEARN/).check();
  const other = await context.newPage();
  await other.goto("./");
  await oneMission(other);
  await page.getByRole("button", { name: "Відновити навчання" }).click();
  await expect(page.getByRole("alert")).toContainText(/прогрес змінився в іншій вкладці/);
  await page.reload();
  await expect(page.getByText(/Виконано місій: 1/)).toBeVisible();
});
