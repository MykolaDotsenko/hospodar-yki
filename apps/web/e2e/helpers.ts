import { expect, type Page } from "@playwright/test";

/**
 * Open the LEARN cloze mission from Home. Home re-lays out once the stored progress has loaded (`.today` appears);
 * a click sent before that layout shift can land on another button (seen on CI Firefox). Always wait for Home first.
 */
export async function openLearn(page: Page) {
  await expect(page.locator(".today")).toBeVisible();
  await page.getByRole("button", { name: /Навчання/ }).click();
}

/** S2 reviewer workspace: pass the learner warning first (it shows keys to every task). */
export async function openReviewer(page: Page) {
  await page.goto("./#review");
  await page.getByRole("button", { name: "Я рецензент(ка) — відкрити" }).click();
  await expect(page.getByRole("heading", { name: "Робоче місце рецензента S2" })).toBeVisible();
}
