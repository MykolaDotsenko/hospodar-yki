import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openLearn } from "./helpers.ts";

/** UIO-06: one meaningful picture of a place (in / out of / into), on request after the first attempt, with a static table. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);

test("UIO-06 location scheme: only after the first attempt, on request; choose a relation to see it; same content as a static table; never in the new situation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await openLearn(page);
  await expect(page.locator(".location-scheme")).toHaveCount(0);                          // nothing before the own answer
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("Правильно з першої спроби.")).toBeVisible();

  const scheme = page.locator("details.location-scheme");
  await expect(scheme).toHaveCount(1);
  await expect(scheme).not.toHaveAttribute("open", "");                                   // on request, not pushed
  await scheme.locator("summary").focus();
  await page.keyboard.press("Enter");                                                     // keyboard opens it
  await expect(page.getByRole("img", { name: /mihin\? куди\?/ })).toBeVisible();          // the task's own relation first
  await expect(page.locator("figcaption")).toContainText("kirjastoon");
  await expect(page.getByRole("button", { name: /куди\?/ })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /звідки\?/ }).click();
  await expect(page.locator("svg[data-relation=from]")).toBeVisible();
  await expect(page.getByRole("img", { name: /mistä\? звідки\?/ })).toBeVisible();
  await expect(page.locator("figcaption")).not.toContainText("kirjastoon");

  const table = page.getByRole("table", { name: "Те саме таблицею" });                    // equivalent static content
  await expect(table.getByRole("row")).toHaveCount(4);
  for (const t of ["missä?", "mistä?", "mihin?", "-ssa / -ssä", "-sta / -stä", "-Vn / -hVn / -seen"]) await expect(table).toContainText(t);
  await expect(table.locator('tr[aria-current="true"]')).toContainText("kirjastoon");
  // No motion anywhere in the picture.
  expect(await page.locator(".location-scheme svg, .location-scheme svg *").evaluateAll(els =>
    els.every(e => { const s = getComputedStyle(e); return s.animationName === "none" && (parseFloat(s.transitionDuration) || 0) === 0; }))).toBe(true);
  expect(await serious(page)).toEqual([]);

  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByLabel(/Твоє власне речення/)).toBeVisible();
  await expect(page.locator(".location-scheme")).toHaveCount(0);                          // the new situation hides it (R7-06)
});

test("UIO-06 at 320 px: the scheme and its table fit without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("./");
  await openLearn(page);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await page.locator("details.location-scheme summary").click();
  await expect(page.getByRole("table", { name: "Те саме таблицею" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
