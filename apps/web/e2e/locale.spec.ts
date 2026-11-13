import { expect, test } from "@playwright/test";

test("WEB-NL-01 Dutch beta UI is opt-in and survives a reload without changing learner content", async ({ page }) => {
  await page.goto("./");
  const picker = page.getByRole("combobox", { name: "Мова інтерфейсу" });
  await expect(picker).toHaveValue("uk");
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();

  await picker.selectOption("nl");
  await expect(page.getByRole("combobox", { name: "Interfacetaal" })).toHaveValue("nl");
  await expect(page.getByRole("heading", { name: "Wat gaan we vandaag doen?" })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("lang", "nl");
  await expect(page.locator(".today")).toContainText("Jouw volgende stap");
  await expect(page.getByTestId("nav-reading")).toContainText("Lezen");
  await expect(page.getByTestId("nav-reading").locator("[lang=fi]")).toHaveText("Tekstin ymmärtäminen");
  await expect(page.getByText(/Nederlands is nog in bèta/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Interfacetaal" })).toHaveValue("nl");
  await expect(page.getByRole("heading", { name: "Wat gaan we vandaag doen?" })).toBeVisible();

  // The exam remains the Finnish YKI rehearsal, never a Dutch exam.
  await page.getByRole("button", { name: /YKI-oefenexamen/ }).click();
  await expect(page.locator("main")).toHaveAttribute("lang", "uk");
  await expect(page.locator("main")).toContainText(/YKI/);
  await page.getByRole("combobox", { name: "Interfacetaal" }).selectOption("uk");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
});

test("WEB-NL-02 the Dutch picker does not create horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("./");
  await page.getByRole("combobox", { name: "Мова інтерфейсу" }).selectOption("nl");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
