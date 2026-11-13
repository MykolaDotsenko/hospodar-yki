import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** TZ-EXAM-17 (headphone/mic part): advisory device check before the rehearsal; measures loudness only, never records. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

/** A microphone made of a Web Audio oscillator: a real MediaStream (loud or silent), counted calls, no real device. */
async function fakeMic(page: Page, loud: boolean) {
  await page.addInitScript((isLoud: boolean) => {
    (window as unknown as { __mic: { calls: number; stopped: number; recorders: number } }).__mic = { calls: 0, stopped: 0, recorders: 0 };
    const mic = (window as unknown as { __mic: { calls: number; stopped: number; recorders: number } }).__mic;
    const Real = window.MediaRecorder;
    if (Real) Object.defineProperty(window, "MediaRecorder", { configurable: true, value: class extends Real { constructor(...a: ConstructorParameters<typeof MediaRecorder>) { super(...a); mic.recorders++; } } });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => {
      mic.calls++;
      const ctx = new AudioContext(); await ctx.resume().catch(() => undefined);
      const osc = ctx.createOscillator(), gain = ctx.createGain(), dest = ctx.createMediaStreamDestination();
      gain.gain.value = isLoud ? 0.8 : 0; osc.connect(gain).connect(dest); osc.start();
      const stream = dest.stream;
      for (const t of stream.getTracks()) { const stop = t.stop.bind(t); t.stop = () => { mic.stopped++; stop(); }; }
      return stream;
    } } });
  }, loud);
}
/** The fake microphone needs a Web Audio stream destination; an engine without one cannot run the metered path. */
async function streamable(page: Page) {
  return page.evaluate(() => typeof AudioContext !== "undefined" && "createMediaStreamDestination" in AudioContext.prototype);
}
async function openSetup(page: Page) {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
}
const check = (page: Page) => page.locator("fieldset.device-check");

test("device check: a test tone the learner confirms and a 3-second mic level check; nothing recorded, the mic is switched off", async ({ page }) => {
  await fakeMic(page, true);
  await openSetup(page);
  test.skip(!(await streamable(page)), "this engine has no Web Audio MediaStream destination for the fake microphone");
  await expect(check(page)).toContainText("нічого не записується, не зберігається й не надсилається");
  await expect(page.getByTestId("device-pending")).toContainText("навушники, мікрофон");
  expect(await serious(page)).toEqual([]);

  await page.getByRole("button", { name: "Програти тестовий звук" }).click();
  await page.getByRole("button", { name: "Чую звук" }).click({ timeout: 10_000 });
  await expect(check(page).locator("[data-device=headphones]")).toHaveAttribute("data-result", "ok");

  await page.getByRole("button", { name: "Перевірити мікрофон" }).click();
  await expect(page.getByText(/Скажи щось уголос/)).toBeVisible();
  await expect(page.getByText("Мікрофон: голос чути.")).toBeVisible({ timeout: 10_000 });
  await expect(check(page).locator("[data-device=microphone]")).toHaveAttribute("data-result", "ok");
  await expect(page.getByTestId("device-pending")).toHaveCount(0);
  const mic = await page.evaluate(() => (window as unknown as { __mic: { calls: number; stopped: number; recorders: number } }).__mic);
  expect(mic).toEqual({ calls: 1, stopped: 1, recorders: 0 });                                // metered, switched off, never recorded
  expect(await serious(page)).toEqual([]);
});

test("device check: silence and a 'not heard' report stay visible problems, but never block the start", async ({ page }) => {
  await fakeMic(page, false);
  await openSetup(page);
  test.skip(!(await streamable(page)), "this engine has no Web Audio MediaStream destination for the fake microphone");
  await page.getByRole("button", { name: "Програти тестовий звук" }).click();
  await page.getByRole("button", { name: "Не чую" }).click({ timeout: 10_000 });
  await expect(page.getByText(/Звук не чути: перевір гучність/)).toBeVisible();
  await page.getByRole("button", { name: "Перевірити мікрофон" }).click();
  await expect(page.getByText(/Мікрофон не вловив голосу/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("device-pending")).toContainText("навушники, мікрофон");
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
});

test("device check asks only for what the chosen skills need, and is absent for reading and writing", async ({ page }) => {
  await openSetup(page);
  await page.getByLabel(/Аудіювання ·/).uncheck();
  await expect(check(page).locator("[data-device=headphones]")).toHaveCount(0);
  await expect(check(page).locator("[data-device=microphone]")).toHaveCount(1);
  await page.getByLabel(/Говоріння ·/).uncheck();
  await expect(check(page)).toHaveCount(0);
  await expect(page.getByTestId("device-pending")).toHaveCount(0);
});

test("a denied microphone is reported honestly in the device check", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true,
      value: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } } });
  });
  await openSetup(page);
  await page.getByRole("button", { name: "Перевірити мікрофон" }).click();
  await expect(page.getByText(/Немає дозволу на мікрофон/)).toBeVisible();
  await expect(check(page).locator("[data-device=microphone]")).toHaveAttribute("data-result", "problem");
});
