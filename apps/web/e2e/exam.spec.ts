import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
/** EXAM firewall: no learning cue, evidence highlight, feedback, key or result anywhere during the attempt. */
async function noLearningAids(page: Page) {
  await expect(page.locator(".learning-cue, .evidence-span, .feedback:not(.error), .draft-note")).toHaveCount(0);
  await expect(page.getByText(/Правильно|ключ:|Tulokset|Підказка/)).toHaveCount(0);
}

test("EXAM rehearsal (XState): no aids before finish, persisted navigation survives reload, results only after a durable finish", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
  await expect(page.getByText(/Не офіційний YKI/).first()).toBeVisible();
  await expect(page.locator(".pill", { hasText: "02 · Симуляція YKI" })).toBeVisible();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  await expect(page.getByText("Harjoituskoe · epävirallinen")).toBeVisible();
  await noLearningAids(page);
  expect(await serious(page)).toEqual([]);
  const first = page.locator('input[type="radio"]').first();
  await first.check();
  await page.getByRole("button", { name: "Seuraava" }).click();
  await expect(page.getByText("Tehtävä 2 / 9")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Tehtävä 2 / 9")).toBeVisible();          // resumed from the persisted checkpoint
  await page.getByRole("button", { name: "Edellinen" }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeChecked();
  for (let i = 1; i < 9; i++) {
    await page.getByRole("button", { name: "Seuraava" }).click();
    await expect(page.getByText(`Tehtävä ${i + 1} / 9`)).toBeVisible();
    await noLearningAids(page);
  }
  await page.getByRole("textbox").fill("Valitettavasti en pääse torstaina. Sopisiko perjantai?");
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Haluatko lopettaa\? Vastaamatta: 7/)).toBeVisible();
  await noLearningAids(page);
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await expect(page.getByText(/не оцінюються автоматично/)).toBeVisible();
  await expect(page.locator(".skill-lines li", { hasText: "Говоріння" }).first()).toContainText("1 без оцінки");
  await expect(page.getByText(/%|B1|taitotaso 3/)).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();   // finished state is durable
  await page.getByRole("button", { name: "Нова репетиція" }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
});

test("EXAM practice timer is labelled unofficial and visible; LEARN progress is untouched by the rehearsal", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await page.getByLabel("15 хв").check();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.locator(".pill", { hasText: /Harjoitusaika 1[45]:/ })).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  for (const skill of ["Читання", "Аудіювання", "Письмо", "Говоріння"])
    await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: new RegExp(`^${skill}$`) }) })).toContainText("Ще не тренувалося");
});

test("EXAM-03 subtest (speaking only) + draft autosave survives reload without navigation + EXAM-09 history after finish", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Ще немає завершених репетицій.")).toBeVisible();
  for (const s of ["Читання", "Аудіювання", "Письмо"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await expect(page.getByText(/не «офіційний частковий YKI»/)).toBeVisible();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 1")).toBeVisible();
  await expect(page.locator(".pill", { hasText: "Osakoeharjoitus: Puhuminen · epävirallinen" })).toBeVisible();
  await page.getByRole("textbox").fill("Valitettavasti en pääse torstaina. Sopisiko perjantai kello kymmenen?");
  await expect(page.getByText("Tallennettu.")).toBeVisible({ timeout: 5000 });        // autosaved, no navigation
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("textbox")).toHaveValue("Valitettavasti en pääse torstaina. Sopisiko perjantai kello kymmenen?");
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await page.getByRole("button", { name: "Нова репетиція" }).click();
  const history = page.locator(".exam-history li");
  await expect(history).toHaveCount(1);
  await expect(history.first()).toContainText("Говоріння: 1 без оцінки");
  await expect(history.first()).toContainText("Не прогноз складання YKI");
  expect(await serious(page)).toEqual([]);
});

test("at least one skill must be chosen before starting", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  for (const s of ["Читання", "Аудіювання", "Письмо", "Говоріння"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await expect(page.getByRole("button", { name: /Aloita/ })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Обери хоча б одну навичку");
});


test("E07: unfinished IME composition cannot finish writing; exact Finnish Unicode survives autosave, reload and final submission", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  for (const s of ["Читання", "Аудіювання", "Говоріння"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 1")).toBeVisible();
  const editor = page.getByRole("textbox");
  const exact = "Hyvää päivää! Kävin Töölössä. ysta\u0308vä ja äiti.";
  await editor.dispatchEvent("compositionstart", { data: "ä" });
  await expect(page.getByText(/Syöttö kesken/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Lopeta koe" })).toBeDisabled();
  // Playwright fill() finishes a synthetic IME composition in Firefox. Use the native
  // setter and a composing input event so all three browser engines exercise the
  // *intermediate* editor state without an implicit blur/compositionend.
  await editor.evaluate((node, text) => {
    const el = node as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (!setter) throw new Error("No native textarea setter");
    setter.call(el, text);
    el.dispatchEvent(new InputEvent("input", {
      bubbles: true, data: text, inputType: "insertCompositionText", isComposing: true,
    }));
  }, exact);
  await expect(editor).toHaveValue(exact);
  await expect(page.getByRole("button", { name: "Lopeta koe" })).toBeDisabled();
  await editor.dispatchEvent("compositionend", { data: "ä" });
  await expect(page.getByRole("button", { name: "Lopeta koe" })).toBeEnabled();
  await expect(page.getByText("Tallennettu.")).toBeVisible({ timeout: 8000 });
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("textbox")).toHaveValue(exact);
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Завантажити мої дані (JSON)" }).click()]);
  const exported = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(exported.exam.current.session.answers["d-w1"]).toBe(exact);
  expect(exported.exam.current.session.finishedAt).not.toBeNull();
  expect(exported.exam.history[0].bySkill.writing.ungraded).toBe(1);
  expect(JSON.stringify(exported)).not.toMatch(/officialGrade|ykiPassPrediction/);
});
