import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const bg = (page: Page, sel: string) => page.locator(sel).first().evaluate(e => getComputedStyle(e).backgroundColor);
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

test("DESIGN-16 calm mode: fewer fills, no decoration, same content and answer policy; persists", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  const standardPrompt = await bg(page, ".prompt");
  const text = await page.locator("main").innerText();
  await page.getByRole("button", { name: "Спокійний режим" }).click();
  await expect(page.getByRole("button", { name: "Спокійний режим" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "calm");
  expect(await bg(page, ".prompt")).toBe("rgb(255, 255, 255)");
  expect(standardPrompt).not.toBe("rgb(255, 255, 255)");
  expect(await page.locator("main").innerText()).toBe(text);                 // presentation only
  expect(await serious(page)).toEqual([]);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);                 // COLOR-18: same key policy
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();   // the repair step renders before a new answer
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  const cue = page.locator(".learning-cue");
  await expect(cue).toHaveText("kirjastoon");
  expect(await cue.evaluate(e => getComputedStyle(e).textDecorationLine)).toContain("underline"); // not colour-only
  expect(await serious(page)).toEqual([]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "calm");
  await page.goto("./");
  expect(await page.locator(".mode-entry").first().evaluate(e => getComputedStyle(e, "::after").display)).toBe("none");
});
