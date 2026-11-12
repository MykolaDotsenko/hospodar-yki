import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const px = (page: Page, sel: string, prop: string) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);

test("Finnish first: the Finnish task is the largest text, carries the skill-coloured rule and hyphenates; Ukrainian helpers step back", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-reading").click();
  await page.locator(".choice").first().click();
  const fi = parseFloat(await px(page, ".prompt[lang=fi]", "font-size"));
  const label = parseFloat(await px(page, "legend", "font-size"));
  const option = parseFloat(await px(page, ".radio > [lang=fi]", "font-size"));
  expect(fi).toBeGreaterThan(option);
  expect(option).toBeGreaterThan(16);                                                   // Finnish options above body size
  expect(fi).toBeGreaterThan(label);
  const rule = await px(page, ".prompt[lang=fi]", "border-left-color");
  const skill = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--skill-reading").trim());
  const hex = (rgb: string) => "#" + (rgb.match(/\d+/g) ?? []).slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
  expect(hex(rule)).toBe(skill.toUpperCase());                                          // threshold rule in the skill colour
  expect(await px(page, ".prompt[lang=fi]", "hyphens")).toBe("auto");
  expect(await serious(page)).toEqual([]);
});

test("DESIGN-12 exam skin: neutral page, navy subtest route, compact six-cell fidelity strip; LEARN keeps its own look", async ({ page }) => {
  await page.goto("./");
  const learnBg = await px(page, "body", "background-color");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "learn");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "exam");
  expect(await px(page, "body", "background-color")).not.toBe(learnBg);
  const cells = page.locator(".fidelity-strip li");
  await expect(cells).toHaveCount(6);
  const tops = await cells.evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);                                                   // one row on desktop
  for (const c of await cells.all()) await expect(c.locator(".fidelity-status")).toHaveText(/підтверджено|частково/);
  expect(await page.locator(".exam-fidelity").innerText()).not.toMatch(/\d\s*%/);
  await expect(page.getByText("На чому ґрунтується кожен статус")).toBeVisible();
  expect(await serious(page)).toEqual([]);

  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  const route = page.locator(".threshold-route[data-accent=exam]");
  await expect(route.locator("li")).toHaveCount(4);
  await expect(route.locator("[aria-current=step]")).toHaveText(/Tekstin ymmärtäminen/);
  await expect(page.locator(".learning-cue, .draft-note, .today, .mode-entry")).toHaveCount(0);  // no LEARN cues or gold signatures
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "На головну" }).count();                      // (no home button inside an attempt)
  await page.locator(".brand").click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "learn");
});
