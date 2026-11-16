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
  const rule = await px(page, ".prompt[lang=fi]", "border-top-color");
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
  await expect(page.locator("a.brand")).toHaveCount(0);                                 // focused mode: no app navigation inside an attempt
  await page.getByRole("button", { name: "Keskeytä ja jatka myöhemmin" }).click();       // the exam's own way out
  await expect(page.locator("html")).toHaveAttribute("data-mode", "learn");
});

test("DESIGN-11 authored form language: two typefaces loaded from the app itself, square ruled surfaces, one signature cut per screen", async ({ page }) => {
  const external: string[] = [];
  page.on("request", r => { if (/^https?:/.test(r.url()) && !r.url().startsWith("http://127.0.0.1:")) external.push(r.url()); });
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Two voices: Ukrainian in Arsenal, Finnish in Finlandica — real loaded faces, not a fallback.
  const faces = await page.evaluate(() => [...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "")));
  expect(new Set(faces)).toEqual(new Set(["Arsenal", "Finlandica"]));
  expect(await px(page, "h1", "font-family")).toMatch(/^"?Arsenal/);
  expect(await px(page, ".skill-tile-fi[lang=fi]", "font-family")).toMatch(/^"?Finlandica/);
  expect(external).toEqual([]);                                                       // nothing fetched from another origin

  const audit = () => page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>("body *")].filter(e => e.getClientRects().length > 0);
    const round = els.filter(e => parseFloat(getComputedStyle(e).borderTopLeftRadius) > 0 && !e.matches("input[type=radio], input[type=checkbox], audio, video, meter")).map(e => e.className || e.tagName);
    const stripes = els.filter(e => { const c = getComputedStyle(e); return parseFloat(c.borderLeftWidth) >= 3 && parseFloat(c.borderLeftWidth) > parseFloat(c.borderRightWidth); }).map(e => e.className || e.tagName);
    const upper = els.filter(e => getComputedStyle(e).textTransform === "uppercase").map(e => e.className || e.tagName);
    const cuts = els.filter(e => getComputedStyle(e).clipPath.includes("polygon") && !e.matches(".threshold-segment")).map(e => e.className);
    const gold = els.filter(e => { const a = getComputedStyle(e, "::after"); return e.matches(".today, .panel") && a.display !== "none" && a.content !== "none" && a.transform !== "none"; }).length;
    return { round, stripes, upper, cuts, gold };
  });
  expect(await audit()).toEqual({ round: [], stripes: [], upper: [], cuts: ["today"], gold: 1 });     // Home: the next-step sheet carries the cut and the gold step
  // SD-G08: the bundled faces really contain the Finnish and Ukrainian letters (no silent fallback for ä ö å or і ї є ґ).
  expect(await page.evaluate(() => [document.fonts.check('16px "Finlandica"', "äöåÄÖÅ"), document.fonts.check('16px "Arsenal"', "іїєґІЇЄҐ")])).toEqual([true, true]);
  // A ruled row still shows that it opens something.
  for (const row of [".place-tile", ".more-tile", ".skill-tile"]) expect(await page.locator(row).first().evaluate(e => getComputedStyle(e, "::after").borderTopWidth), row).toBe("2px");
  await page.getByTestId("nav-reading").click();
  await page.locator(".choice").first().click();
  await expect(page.locator(".prompt[lang=fi]")).toBeVisible();
  expect(await audit()).toEqual({ round: [], stripes: [], upper: [], cuts: ["panel"], gold: 0 });     // a task: the quiet cut only — no gold, no decoration (COG-07)
  expect(await page.evaluate(() => [...document.querySelectorAll(".panel, .panel *")].filter(e => /201, 145, 53/.test(getComputedStyle(e).backgroundColor + getComputedStyle(e, "::after").backgroundColor)).length)).toBe(0);
  // Long Finnish text keeps a readable measure: at most about 70 characters on a line at desktop width.
  const perLine = await page.locator(".prompt.reading-text").evaluate(e => {
    const cs = getComputedStyle(e), c = document.createElement("canvas").getContext("2d")!;
    c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const text = (e.textContent ?? "").trim(), avg = c.measureText(text).width / text.length;
    // font-size-adjust scales the rendered glyphs; the canvas does not know it, so compare x-heights to get the real width.
    const scale = 0.53 / (c.measureText("x").actualBoundingBoxAscent / parseFloat(cs.fontSize));
    return (e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / (avg * scale);
  });
  expect(perLine).toBeGreaterThan(45);
  expect(perLine).toBeLessThanOrEqual(75);
  expect(await px(page, ".prompt.reading-text", "font-weight")).toBe("400");
  expect(await px(page, ".prompt[lang=fi]", "font-family")).toMatch(/^"?Finlandica/);
  expect(await serious(page)).toEqual([]);

  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "exam");
  const exam = await audit();
  expect([exam.round, exam.stripes, exam.upper, exam.cuts, exam.gold]).toEqual([[], [], [], [], 0]);   // DESIGN-12: a plain sheet, no gold in the exam
});

test("typeface is the learner's choice: the device font for both languages, kept after reload; nothing else changes", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(await px(page, "h1", "font-family")).toMatch(/^"?Arsenal/);
  await page.getByLabel("Шрифт").selectOption({ label: "Звичний шрифт пристрою" });
  await expect(page.locator("html")).toHaveAttribute("data-font", "system");
  expect(await px(page, "h1", "font-family")).toMatch(/^system-ui/);
  expect(await px(page, ".skill-tile-fi[lang=fi]", "font-family")).toMatch(/^system-ui/);
  expect(await page.locator("main").innerText()).toBe(text);                          // presentation only
  expect(await serious(page)).toEqual([]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-font", "system");
  await page.getByLabel("Шрифт").selectOption({ label: "Фірмові: Arsenal і Finlandica" });
  await expect(page.locator("html")).not.toHaveAttribute("data-font", "system");
  expect(await px(page, "h1", "font-family")).toMatch(/^"?Arsenal/);
});

