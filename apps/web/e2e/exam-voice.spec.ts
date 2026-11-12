import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);
async function noLearningAids(page: Page) {
  await expect(page.locator(".learning-cue, .evidence-span, .feedback:not(.error), .draft-note")).toHaveCount(0);
  await expect(page.getByText(/Правильно|ключ:|Tulokset|Підказка/)).toHaveCount(0);
}
/** Deterministic microphone for every engine: a fake MediaRecorder emitting fixed bytes (no real audio, no upload). */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecorder {
      state = "inactive"; mimeType = "audio/webm"; ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      static isTypeSupported(m: string) { return m.startsWith("audio/webm"); }
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(3000).fill(7)], { type: "audio/webm" }) }); setTimeout(() => this.onstop?.(), 0); }
    }
    Object.defineProperty(window, "MediaRecorder", { value: FakeRecorder, configurable: true });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  });
});
async function speakingOnly(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  for (const s of ["Читання", "Аудіювання", "Письмо"]) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 1")).toBeVisible();
}
const consent = (page: Page) => page.getByLabel(/Зберігати мої голосові записи/);
async function record(page: Page) {
  await page.getByRole("button", { name: /Nauhoita (vastaus|uudelleen)/ }).click();
  await expect(page.getByText("Nauhoitus käynnissä.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lopeta koe" })).toBeDisabled();        // no finishing while the mic is on
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /Lopeta nauhoitus/ }).click();
}

test("E06: without consent a recording is page-only and does not survive reload; with consent it is stored, verified and listenable after finishing (ungraded)", async ({ page }) => {
  await speakingOnly(page);
  await expect(consent(page)).not.toBeChecked();                                       // off by default
  await record(page);
  await expect(page.getByText(/Запис НЕ збережено: згоди на збереження немає/)).toBeVisible();
  await expect(page.getByText("Nauhoitteesi (vain tällä sivulla)")).toBeVisible();
  await noLearningAids(page);
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("button", { name: "Nauhoita vastaus" })).toBeVisible();   // nothing claimed after reload

  await consent(page).check();
  await expect(page.getByText("Tallennettu.", { exact: true })).toBeVisible();
  await record(page);
  await expect(page.getByText(/Запис збережено лише на цьому пристрої й перевірено \(3 КБ/)).toBeVisible();
  await expect(consent(page)).toBeDisabled();                                          // withdraw only after deleting
  await noLearningAids(page);
  expect(await serious(page)).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Tallennettu nauhoitteesi")).toBeVisible();              // re-verified bytes after reload
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Haluatko lopettaa\? Vastaamatta: 0/)).toBeVisible();   // the spoken answer counts as answered
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await expect(page.getByText(/Твій запис \(\d+ с\) · без оцінки: оцінити може лише людина/)).toBeVisible();
  await expect(page.locator(".skill-lines li", { hasText: "Говоріння" }).first()).toContainText("1 без оцінки");

  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("голосових записів 1");
  await page.getByLabel(/Усі пробні іспити, їхню історію й голосові записи/).check();
  await page.getByLabel(/введи слово ВИДАЛИТИ/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити пробні іспити" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("голосових записів 0");
});

test("E06: a stored recording can be deleted, and a recording whose bytes vanished is dropped with a clear message", async ({ page }) => {
  await speakingOnly(page);
  await consent(page).check();
  await expect(page.getByText("Tallennettu.", { exact: true })).toBeVisible();
  await record(page);
  await expect(page.getByText(/Запис збережено лише на цьому пристрої/)).toBeVisible();
  await page.getByRole("button", { name: "Poista nauhoite" }).click();
  await page.getByRole("button", { name: "Kyllä, poista nauhoite" }).click();
  await expect(page.getByText("Запис видалено з цього пристрою.")).toBeVisible();
  await expect(consent(page)).toBeEnabled();

  await record(page);
  await expect(page.getByText(/Запис збережено лише на цьому пристрої/)).toBeVisible();
  await page.evaluate(() => new Promise<void>((res, rej) => {                          // simulate cleared browser storage for audio only
    const r = indexedDB.open("hospodar-yki:web-exam-voice:v1");
    r.onsuccess = () => { const tx = r.result.transaction("clips", "readwrite"); tx.objectStore("clips").clear(); tx.oncomplete = () => { r.result.close(); res(); }; tx.onerror = () => rej(tx.error); };
    r.onerror = () => rej(r.error);
  }));
  await page.reload();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("alert")).toContainText("Збережений запис не знайдено або він пошкоджений");
  await expect(page.getByRole("button", { name: "Nauhoita vastaus" })).toBeVisible();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Vastaamatta: 1/)).toBeVisible();
});

test("E06: a denied microphone is reported honestly; the text plan remains the answer path and nothing is claimed", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true,
      value: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } } });
  });
  await speakingOnly(page);
  await page.getByRole("button", { name: "Nauhoita vastaus" }).click();
  await expect(page.getByText(/Немає дозволу на мікрофон/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Lopeta koe" })).toBeEnabled();
  await page.getByRole("textbox").fill("Haluaisin siirtää aikaa perjantaille.");
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Vastaamatta: 0/)).toBeVisible();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Твій запис/)).toHaveCount(0);
});

test("TZ-EXAM-11: timed speaking task — preparation countdown, recording starts by itself, the response window ends it; times are labelled as practice", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-12T09:00:00+02:00") });
  await speakingOnly(page);
  await expect(page.getByText(/Harjoitusajat — virallisia vuoden 2027 aikoja ei ole vahvistettu/)).toBeVisible();
  await page.getByRole("button", { name: "Aloita ajastettu tehtävä" }).click();
  const timer = page.getByTestId("speaking-timer");
  await expect(timer).toContainText("Valmistautumisaika 0:30");
  await expect(page.getByRole("button", { name: /Nauhoita vastaus/ })).toBeDisabled();       // no early start during preparation
  await expect(page.getByText("Nauhoitus käynnissä.")).toHaveCount(0);                          // the mic is not on while preparing
  await noLearningAids(page);
  expect(await serious(page)).toEqual([]);

  await page.clock.runFor(29_000);
  await expect(timer).toContainText("Valmistautumisaika 0:01");
  await page.clock.runFor(1_500);
  await expect(page.getByText("Nauhoitus käynnissä.")).toBeVisible();                           // started by itself after preparation
  await expect(timer).toContainText(/Vastausaika [01]:\d\d/);
  await expect(page.getByRole("button", { name: "Lopeta koe" })).toBeDisabled();
  await page.clock.runFor(60_000);
  await expect(page.getByText("Nauhoitus käynnissä.")).toHaveCount(0);                          // the response window ended it
  await expect(page.getByText(/Запис НЕ збережено: згоди на збереження немає/)).toBeVisible();
  await expect(timer).toHaveCount(0);
  await noLearningAids(page);
  await expect(page.getByRole("button", { name: "Aloita ajastettu tehtävä" })).toBeVisible();   // can be repeated (practice)
});

test("TZ-EXAM-11: the timed task can be cancelled during preparation and stopped early", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-12T09:00:00+02:00") });
  await speakingOnly(page);
  await page.getByRole("button", { name: "Aloita ajastettu tehtävä" }).click();
  await page.getByRole("button", { name: "Peruuta ajastus" }).click();
  await expect(page.getByTestId("speaking-timer")).toHaveCount(0);
  await page.clock.runFor(40_000);
  await expect(page.getByText("Nauhoitus käynnissä.")).toHaveCount(0);                          // a cancelled task never opens the mic

  await page.getByRole("button", { name: "Aloita ajastettu tehtävä" }).click();
  await page.clock.runFor(31_000);
  await expect(page.getByText("Nauhoitus käynnissä.")).toBeVisible();
  await page.getByRole("button", { name: /Lopeta nauhoitus/ }).click();                         // the learner may finish early
  await expect(page.getByText("Nauhoitus käynnissä.")).toHaveCount(0);
  await expect(page.getByTestId("speaking-timer")).toHaveCount(0);
});

test("TZ-EXAM-11: a denied microphone ends the timed task honestly after preparation; nothing is claimed", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true,
      value: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } } });
  });
  await page.clock.install({ time: new Date("2026-11-12T09:00:00+02:00") });
  await speakingOnly(page);
  await page.getByRole("button", { name: "Aloita ajastettu tehtävä" }).click();
  await page.clock.runFor(31_000);
  await expect(page.getByText(/Немає дозволу на мікрофон/)).toBeVisible();
  await expect(page.getByTestId("speaking-timer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Aloita ajastettu tehtävä" })).toBeVisible();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByText(/Vastaamatta: 1/)).toBeVisible();
});
