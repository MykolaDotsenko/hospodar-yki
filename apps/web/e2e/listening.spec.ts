import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const startedPlaying = (page: Page) => page.locator("audio").evaluate(a => a.dispatchEvent(new Event("play")));
async function open(page: Page) {
  await page.goto("./");
  await page.getByTestId("nav-listening").click();
  await page.getByRole("list", { name: "Аудіозаписи" }).getByRole("button", { name: /Kun verkkokaupan tilaus meni pieleen/ }).click();
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
}
async function answerAll(page: Page) {
  for (let i = 0; i < 4; i++) {
    // Every change of question is visible ONLY after the IndexedDB checkpoint ACK.
    await expect(page.getByText(`Питання ${i + 1} з 4`)).toBeVisible();
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
    if (i < 3) await expect(page.getByText(`Питання ${i + 2} з 4`)).toBeVisible();
    else await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
  }
}

test("IV-REQ-04: learner-started audio first; no text or key before answering; keys then transcript+subtitles; scored", async ({ page }) => {
  await open(page);
  expect(await page.locator("audio").evaluate(a => (a as HTMLAudioElement).autoplay || !(a as HTMLAudioElement).paused)).toBe(false);
  await expect(page.getByText(/синтетичний голос, один диктор/)).toBeVisible();
  await page.getByRole("button", { name: "До питань" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу прослухай");
  await startedPlaying(page);
  await page.getByRole("button", { name: "До питань" }).click();
  await expect(page.getByRole("heading", { name: "Головне: про що це?" })).toBeVisible();
  await expect(page.locator(".transcript")).toHaveCount(0);
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await answerAll(page);
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
  await expect(page.locator(".learning-cue").first()).toHaveText("Takin väri");
  await expect(page.locator("audio track")).toHaveCount(0);
  await page.getByRole("button", { name: /Послухати ще раз із текстом/ }).click();
  await expect(page.locator(".transcript")).toContainText("Sofia oli tilannut");
  await expect(page.locator("audio track[kind=subtitles]")).toHaveCount(1);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Аудіювання" })).toContainText("з 4 перевірених відповідей правильні; 0 без оцінки");
});

test("support before answering (transcript) is allowed for accessibility but saved ungraded", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Показати текст (підтримка)" }).click();
  await expect(page.locator(".transcript")).toContainText("Sofia oli tilannut");
  await expect(page.getByText(/З підтримкою відповіді зберігаються без оцінки/)).toBeVisible();
  await page.getByRole("button", { name: "До питань" }).click();
  await answerAll(page);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/збережено без оцінки/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Аудіювання" })).toContainText("0 з 0 перевірених відповідей правильні; 4 без оцінки");
});

test("slower speed keeps pitch and marks the attempt as supported", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "0,75× (підтримка)" }).click();
  await expect.poll(() => page.locator("audio").evaluate(a => [(a as HTMLAudioElement).playbackRate, (a as HTMLAudioElement).preservesPitch])).toEqual([0.75, true]);
  await expect(page.getByText(/З підтримкою відповіді зберігаються без оцінки/)).toBeVisible();
});

test("strategic audio notes: optional own notes while listening and answering, back next to the keys; answers stay independent and scored", async ({ page }) => {
  await open(page);
  await expect(page.locator("details.audio-notes")).toBeVisible();
  await page.locator("details.audio-notes summary").click();
  await page.getByLabel(/Коли\?/).fill("lauantaina");
  await page.getByLabel(/Що відбувається/).fill("väärä väri, palautus");
  expect(await serious(page)).toEqual([]);
  await startedPlaying(page);
  await page.getByRole("button", { name: "До питань" }).click();
  await expect(page.getByLabel(/Коли\?/)).toHaveValue("lauantaina");                          // in view while answering
  await answerAll(page);
  await expect(page.getByTestId("audio-notes-back")).toContainText("lauantaina");
  await expect(page.getByTestId("audio-notes-back")).toContainText("väärä väri, palautus");
  await expect(page.locator("details.audio-notes")).toHaveCount(0);                           // notes are not editable after the answers
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();          // own notes are not "support"
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li", { hasText: "Аудіювання" })).toContainText("з 4 перевірених відповідей правильні; 0 без оцінки");
});
