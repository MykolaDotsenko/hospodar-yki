import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Release build (docs/29 stage 1, code queue 2; QL-01): learners get only S2-published content. Nothing is published yet,
 * so every learning section must say «Ще не перевірено» instead of falling back to drafts, no draft label may appear,
 * and the reviewer workspace (keys to every task) must not be reachable. Served by the second web server (port 4174).
 */
async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => `${v.id}: ${v.nodes.length}`);
}
const draftLabels = (page: Page) => page.locator("[data-trust-note]:not([data-trust-note='release'])");
async function home(page: Page) {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
}

test.describe("beta build (today's default)", () => {
  test("every unpublished task a learner opens carries the draft label", async ({ page }) => {
    const open: [string, RegExp][] = [["nav-listening", /Kun verkkokaupan tilaus meni pieleen/], ["nav-speaking", /Ensimmäinen kerta kielikahvilassa/],
      ["nav-reading", /Kirjaston kielikahvila/], ["nav-writing", /Kosteusvaurio epäilyttää/]];
    for (const [nav, item] of open) {
      await home(page);
      await page.getByTestId(nav).click();
      await page.getByRole("button", { name: item }).first().click();
      await expect(draftLabels(page).first(), nav).toContainText("Чернетка: ще не перевірено S2-викладачем.");
    }
    await home(page);
    await page.getByRole("button", { name: /Почати місію/ }).click();
    await expect(draftLabels(page).first()).toContainText("Чернетка: ще не перевірено S2-викладачем.");
  });
});

test.describe("release build", () => {
  test.use({ baseURL: "http://127.0.0.1:4174/" });

  test("release build: Home says how many S2-published tasks it carries (0) and labels nothing as a draft", async ({ page }) => {
    await home(page);
    await expect(page.getByTestId("release-notice")).toContainText("перевірені викладачем S2 (зараз 0)");
    await expect(page.locator("footer")).toContainText("Збірка випуску: лише завдання, перевірені викладачем S2.");
    await expect(page.locator("footer").getByRole("link", { name: /рецензента/ })).toHaveCount(0);
    await expect(draftLabels(page)).toHaveCount(0);
    expect(await axe(page)).toEqual([]);
  });

  test("release build: every learning section and the YKI rehearsal show «Ще не перевірено» instead of drafts", async ({ page }) => {
    const entries = [/Почати місію/, /Почати репетицію/, /Почати діагностику/, /Майстерня слабких місць/, /Практика без підказки/, /Фото-місії/,
      /^Читання/, /^Аудіювання/, /^Письмо/, /^Говоріння/];
    for (const name of entries) {
      await home(page);
      await page.locator("main button").filter({ hasText: name }).first().click();
      await expect(page.getByRole("heading", { name: "Ще не перевірено" }), String(name)).toBeVisible();
      await expect(page.locator(".prompt[lang=fi], textarea, input[type=text]")).toHaveCount(0);           // no task is offered
      await expect(draftLabels(page)).toHaveCount(0);
    }
    expect(await axe(page)).toEqual([]);
  });

  test("release build: the reviewer workspace is not reachable and the media library hides draft questions", async ({ page }) => {
    await page.goto("./#review");
    await expect(page.locator(".today")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Робоче місце рецензента");
    await home(page);
    await page.locator("main button").filter({ hasText: "Медіатека" }).click();
    await expect(page.getByRole("heading", { name: "Медіатека" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Питання до перегляду");
    await expect(draftLabels(page)).toHaveCount(0);
    await home(page);
    await page.locator("main button").filter({ hasText: "Я і моє життя" }).click();
    await expect(page.getByRole("heading", { name: "Я і моє життя" })).toBeVisible();
    await expect(draftLabels(page)).toHaveCount(0);
  });
});
