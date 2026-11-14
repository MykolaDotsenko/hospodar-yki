import { expect, test, type Page } from "@playwright/test";

/** PR 1 (release): the built app carries a strict CSP and no screen violates it — everything is same-origin or blob:. */
async function watchViolations(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", e => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
}
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test("built app: strict same-origin Content-Security-Policy and no-referrer are present", async ({ page }) => {
  await page.goto("./");
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|https?:/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
});

test("no CSP violation across home, a mission, listening audio, reading, practice, exam setup and my data", async ({ page }) => {
  await watchViolations(page);
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByLabel("Впиши пропущену форму фінською")).toBeVisible();
  await page.goto("./");
  await page.getByTestId("nav-listening").click();
  await page.getByRole("list", { name: "Аудіозаписи" }).getByRole("button", { name: /Kun verkkokaupan tilaus meni pieleen/ }).click();
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await expect(page.locator("audio")).toHaveCount(1);
  await page.goto("./");
  await page.getByTestId("nav-reading").click();
  await page.getByRole("button", { name: /Kirjaston kielikahvila/ }).click();
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByRole("heading", { name: "Тренувальна репетиція" })).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toBeVisible();
  expect(await violations(page)).toEqual([]);
});
