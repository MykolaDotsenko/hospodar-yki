import { expect, test, type Page } from "@playwright/test";
import { openLearn } from "./helpers.ts";

/** DESIGN-04/08/10, UIO-01, UX-02/07, COLOR-11, A10-07/08, SENS-05/12 — checked on every mission step. */
async function stepChecks(page: Page) {
  const primary = page.locator("main .btn:not(.secondary):visible");
  await expect(primary).toHaveCount(1);                                            // one primary action
  await expect(page.locator(".threshold-route [aria-current=step]")).toHaveCount(1); // real current step
  await expect(page.locator(".threshold-route .visually-hidden").first()).toHaveText(/пройдено|зараз|попереду/);
  await expect(page.locator("header .pill").last()).toHaveText("01 · Навчання");  // mode badge
  const small = await page.locator("main .btn:visible, main .choice:visible, header .toggle").evaluateAll(els =>
    els.filter(e => e.getBoundingClientRect().height < 44).map(e => e.textContent));
  expect(small).toEqual([]);                                                        // ≥44 px targets
  const media = await page.evaluate(() => [...document.querySelectorAll("audio,video")].filter(m => (m as HTMLMediaElement).autoplay || !(m as HTMLMediaElement).paused).length);
  expect(media).toBe(0);                                                            // quiet by default, no autoplay
  const animated = await page.evaluate(() => [...document.querySelectorAll("main *")].filter(e => getComputedStyle(e).animationName !== "none").length);
  expect(animated).toBe(0);                                                         // no decorative animation loops
}

test("focus budget and orientation hold on every mission step", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Навчання дозволяє підказки після твоєї відповіді — симуляція їх приховує.", { exact: false })).toBeVisible(); // UX-07
  await openLearn(page);
  await stepChecks(page);                                                           // answer
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible(); // checkpoint ACK
  await stepChecks(page);                                                           // repair
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible(); // checkpoint ACK
  await stepChecks(page);                                                           // feedback
  const order = await page.evaluate(() => {
    const m = document.querySelector(".meaning-first"), c = document.querySelector(".learning-cue");
    return m && c ? Boolean(m.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) : null;
  });
  expect(order).toBe(true);                                                         // meaning before highlighted form
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await stepChecks(page);                                                           // transfer
});
