import { expect, test, type Page } from "@playwright/test";

/**
 * One set of media rules on every screen with audio or video (docs/29 stage 3; packages/domain/src/mediaRules.ts):
 *   1. the learner starts the sound; 2. own answer first, text only after or as help; 3. help makes the attempt ungraded.
 * The EXAM has no help: no text before the end and the speed stays 1×.
 * apps/web/src/media-rules.test.ts lists every <audio>/<video> in the code with the title here that covers it.
 */
const T0 = new Date("2026-11-03T09:00:00+02:00");
const DAY7 = new Date("2026-11-10T09:00:00+02:00");

/** Nothing on the page plays or is set to play on its own. */
const quiet = (page: Page) => page.locator("audio, video").evaluateAll(els =>
  els.length > 0 && els.every(e => !(e as HTMLMediaElement).autoplay && (e as HTMLMediaElement).paused));
/** The browser's own speed menu is hidden on task players (attribute, so it is checkable in every engine). */
const noBrowserSpeedMenu = (page: Page) => page.locator("audio[data-media-context]").evaluateAll(els =>
  els.length > 0 && els.every(e => (e.getAttribute("controlslist") ?? "").split(/\s+/).includes("noplaybackrate")));
const rate = (page: Page) => page.locator("audio").first().evaluate(a => (a as HTMLAudioElement).playbackRate);
/** A speed change that does not come from our buttons: the browser's controls, a shortcut or an extension. */
const slowDownOutsideApp = (page: Page) => page.locator("audio").first().evaluate(a => { (a as HTMLAudioElement).playbackRate = 0.5; });
const started = (page: Page) => page.locator("audio").first().evaluate(a => a.dispatchEvent(new Event("play")));

async function openLesson(page: Page) {
  await page.getByTestId("nav-listening").click();
  await page.getByRole("list", { name: "Аудіозаписи" }).getByRole("button", { name: /Kun verkkokaupan tilaus meni pieleen/ }).click();
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await expect(page.getByRole("heading", { name: "Слухай" })).toBeVisible();                      // the listen step is on record
  await expect(page.locator("audio")).toHaveCount(1);
}
async function answerLesson(page: Page) {
  for (let i = 0; i < 4; i++) {
    await expect(page.getByText(`Питання ${i + 1} з 4`)).toBeVisible();
    await page.locator('input[name="lq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
}
const listeningLine = async (page: Page) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  return page.locator(".skill-lines li", { hasText: "Аудіювання" });
};

test("media rules · LEARN listening: quiet until started; a slower speed from outside the app waits at 1× until the help is saved; then ungraded", async ({ page }) => {
  await page.goto("./");
  await openLesson(page);
  expect(await quiet(page)).toBe(true);
  expect(await noBrowserSpeedMenu(page)).toBe(true);
  await expect(page.locator(".transcript")).toHaveCount(0);

  await slowDownOutsideApp(page);
  await expect(page.getByText(/З підтримкою відповіді зберігаються без оцінки/)).toBeVisible();   // help on record first…
  await expect.poll(() => rate(page)).toBe(0.75);                                                 // …then the one supported speed
  await expect(page.getByRole("button", { name: "0,75× (підтримка)" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".transcript")).toHaveCount(0);                                       // slower is not text
  await started(page);
  await page.getByRole("button", { name: "До питань" }).click();
  await answerLesson(page);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/збережено без оцінки/)).toBeVisible();
  await expect(await listeningLine(page)).toContainText("0 з 0 перевірених відповідей правильні; 4 без оцінки");
});

test("media rules · after the answers the recording is free to replay at any speed (review, mediation)", async ({ page }) => {
  await page.goto("./");
  await openLesson(page);
  await started(page);
  await page.getByRole("button", { name: "До питань" }).click();
  await answerLesson(page);
  await page.getByRole("button", { name: /Послухати ще раз із текстом/ }).click();
  await expect(page.getByRole("heading", { name: "Послухай ще раз із текстом" })).toBeVisible();   // review is on record
  expect(await quiet(page)).toBe(true);
  await slowDownOutsideApp(page);
  await expect.poll(() => rate(page)).toBe(0.5);                                                  // no longer a task: kept
  await page.getByRole("button", { name: "0,75×", exact: true }).click();                          // our slower button is not "help" here
  await expect.poll(() => rate(page)).toBe(0.75);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "0,75× (підтримка)" })).toHaveCount(0);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();
  await expect(await listeningLine(page)).toContainText("з 4 перевірених відповідей правильні; 0 без оцінки");
});

test("media rules · delayed listening check: quiet, no text before the answer; slower is help (ungraded) and still has to be listened to", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await openLesson(page);
  await started(page);
  await page.getByRole("button", { name: "До питань" }).click();
  await answerLesson(page);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();

  await page.clock.setFixedTime(DAY7);
  await page.goto("./");
  await page.getByRole("button", { name: "Пройти" }).click();
  await page.locator(".skill-lines li", { hasText: "Аудіювання" }).getByRole("button", { name: "Пройти перевірку дня 7" }).click();
  await expect(page.locator("audio")).toHaveCount(1);
  expect(await quiet(page)).toBe(true);
  expect(await noBrowserSpeedMenu(page)).toBe(true);
  await expect(page.locator(".transcript")).toHaveCount(0);

  await slowDownOutsideApp(page);                                                                 // outside the app: help, recorded, then 0.75×
  await expect(page.getByText(/З підтримкою відповіді зберігаються без оцінки/)).toBeVisible();
  await expect.poll(() => rate(page)).toBe(0.75);
  await expect(page.getByRole("button", { name: "0,75× (тоді без оцінки)" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".transcript")).toHaveCount(0);                                       // slower shows no text…
  await expect(page.locator('input[name="skq"]').first()).toBeDisabled();                         // …and does not replace listening
  await expect(page.getByRole("button", { name: "Показати текст (тоді без оцінки)" })).toBeVisible();   // text is still offered
  await started(page);
  for (let i = 0; i < 20 && await page.getByText(/Питання \d+ з \d+/).count(); i++) {
    await page.locator('input[name="skq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await expect(page.getByText("Перевірку збережено на цьому пристрої.")).toBeVisible();
  await expect(page.getByText("Повільніше — збережено без оцінки.")).toBeVisible();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
});

test("media rules · dictogloss: nothing plays until the learner's button, no text before the reconstruction", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-listening").click();
  await page.getByRole("list", { name: "Диктоглос" }).getByRole("button", { name: /Kun verkkokaupan tilaus meni pieleen/ }).click();
  await expect(page.getByRole("heading", { name: "Послухай уривок" })).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(1);
  expect(await quiet(page)).toBe(true);
  expect(await page.locator("audio").evaluate(a => (a as HTMLAudioElement).controls)).toBe(false);   // no player controls: only the learner's button
  await expect(page.locator("[data-testid=dg-original], .transcript")).toHaveCount(0);
});

test("media rules · EXAM listening: quiet until started, no browser speed menu, any speed change goes back to 1×, no text", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  for (const s of ["Читання", "Письмо", "Говоріння"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.locator(".exam-audio audio")).toHaveCount(1);
  expect(await quiet(page)).toBe(true);
  expect(await noBrowserSpeedMenu(page)).toBe(true);
  await slowDownOutsideApp(page);
  await expect.poll(() => rate(page)).toBe(1);
  await page.locator("audio").first().evaluate(a => { (a as HTMLAudioElement).playbackRate = 1.5; });
  await expect.poll(() => rate(page)).toBe(1);
  await expect(page.locator(".transcript, track")).toHaveCount(0);
  await expect(page.getByText(/Kuuntelukertoja ei rajoiteta · harjoitussääntö/)).toBeVisible();      // unlimited replay stays labelled practice
});

test("media rules · media library: every recording and video is quiet and loads nothing until the learner starts it", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-media").click();
  for (const tab of ["Живі голоси"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.locator("audio, video").first()).toBeAttached();
    expect(await quiet(page)).toBe(true);
    expect(await page.locator("audio, video").evaluateAll(els => els.every(e => (e as HTMLMediaElement).preload === "none"))).toBe(true);
  }
});

test("strategic audio notes in the delayed listening check: own notes while listening (not support, answers stay scored), back next to the keys, never stored", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await page.goto("./");
  await openLesson(page);
  await started(page);
  await page.getByRole("button", { name: "До питань" }).click();
  await answerLesson(page);
  await page.getByRole("button", { name: "Зберегти результат" }).click();
  await expect(page.getByText(/Самостійні відповіді записано окремо/)).toBeVisible();

  await page.clock.setFixedTime(DAY7);
  await page.goto("./");
  await page.getByRole("button", { name: "Пройти" }).click();
  await page.locator(".skill-lines li", { hasText: "Аудіювання" }).getByRole("button", { name: "Пройти перевірку дня 7" }).click();
  await page.locator("details.audio-notes summary").click();
  await page.getByLabel(/^Коли/).fill("tiistaina");
  await started(page);
  for (let i = 0; i < 20 && await page.getByText(/Питання \d+ з \d+/).count(); i++) {
    await page.locator('input[name="skq"]').first().check();
    await page.getByRole("button", { name: "Відповісти" }).click();
  }
  await expect(page.getByText("Перевірку збережено на цьому пристрої.")).toBeVisible();
  await expect(page.getByTestId("audio-notes-back")).toContainText("tiistaina");          // back for self-comparison
  await expect(page.getByText(/збережено без оцінки/)).toHaveCount(0);                  // notes are not support: still scored
  const stored = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))));
  expect(stored).not.toContain("tiistaina");                                            // never stored
});
