import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
async function open(page: Page, tab: string) {
  await page.goto("./");
  await page.getByRole("button", { name: "🖼 Медіатека" }).click();
  await page.getByRole("tab", { name: tab }).click();
}
const noAutoplay = (page: Page) => page.locator("audio, video").evaluateAll(els =>
  els.every(e => !(e as HTMLMediaElement).autoplay && (e as HTMLMediaElement).paused && (e as HTMLMediaElement).preload === "none"));

test("media library: licensed voices with credit, learner-started, same text in two voices; axe clean", async ({ page }) => {
  await open(page, "Живі голоси");
  await expect(page.getByRole("heading", { name: /Laulu tulipunaisesta kukasta/ })).toBeVisible();
  await expect(page.getByText("Той самий текст читають 2 різні голоси")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Tapaaminen metroasemalla/ })).toBeVisible();
  expect(await noAutoplay(page)).toBe(true);
  const credits = page.locator(".credit");
  expect(await credits.count()).toBeGreaterThan(10);
  await expect(credits.filter({ hasText: "CC BY-SA 3.0" }).first()).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await page.getByLabel(/Про що текст\? Своїми словами/).first().fill("Tekstissä puhutaan rautatiestä.");
  await page.getByRole("button", { name: "Зберегти нотатку" }).first().click();
  await expect(page.getByText("Збережено без оцінки.")).toBeVisible();
});

test("pictures: alt text, credit + licence link, ungraded description; video and illustrations credited; no autoplay", async ({ page }) => {
  await open(page, "Фото-ситуації");
  const img = page.getByRole("img", { name: /Turun kauppatori/ });
  await expect(img).toBeVisible();
  await expect(page.locator(".credit a", { hasText: "CC BY-SA 4.0" }).first()).toHaveAttribute("href", /creativecommons\.org/);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("tab", { name: "Відео" }).click();
  await expect(page.locator("video")).toHaveCount(3);
  expect(await noAutoplay(page)).toBe(true);
  await expect(page.getByText(/без субтитрів/).first()).toBeVisible();
  await page.getByRole("tab", { name: "Ілюстрації" }).click();
  await expect(page.locator(".media-svg")).toHaveCount(6);
  expect(await serious(page)).toEqual([]);
});

test("external sources are link-only cards: https, new tab, noopener, no iframe/embed", async ({ page }) => {
  await open(page, "Зовнішні джерела");
  const links = page.getByRole("link", { name: /Відкрити на/ });
  expect(await links.count()).toBe(64);
  for (const h of await links.evaluateAll(as => as.map(a => [a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel")])))
    expect(h).toEqual([expect.stringMatching(/^https:\/\/(www\.)?youtube\.com\//), "_blank", "noopener noreferrer"]);
  await expect(page.locator("iframe, embed, object")).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
});

test("human-voiced story is a listening mission with credit; options are not always in the first position", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "🎧 Аудіювання" }).click();
  await page.getByRole("button", { name: /Todellinen prinsessa/ }).click();
  await page.getByRole("button", { name: "Пропустити й слухати" }).click();
  await expect(page.getByText(/живий голос, один читець/)).toBeVisible();
  await expect(page.getByText(/Читає Cygnaeus \(LibriVox\)/)).toBeVisible();
});

test("320 px: media library reflows without horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const tab of ["Живі голоси", "Відео", "Фото-ситуації", "Ілюстрації", "Зовнішні джерела"]) {
    await open(page, tab);
    // Wide fallback font: CI font metrics differ from local ones; long Finnish words must still wrap.
    await page.addStyleTag({ content: '*{font-family:"DejaVu Sans Mono",monospace !important;letter-spacing:.02em}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
