import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
async function open(page: Page, tab: string) {
  await page.goto("./");
  await page.getByTestId("nav-media").click();
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

test("pictures: alt text, credit + licence link, ungraded description; uncaptioned video never playable (A11Y-03); illustrations credited", async ({ page }) => {
  await open(page, "Фото-ситуації");
  const img = page.getByRole("img", { name: /Turun kauppatori/ });
  await expect(img).toBeVisible();
  await expect(page.locator(".credit a", { hasText: "CC BY-SA 4.0" }).first()).toHaveAttribute("href", /creativecommons\.org/);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("tab", { name: "Відео" }).click();
  // A11Y-03 / WCAG 1.2.2: no uncaptioned video is ever playable; each is listed with its source instead.
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator(".media-card.unavailable")).toHaveCount(3);
  await expect(page.getByText(/немає перевірених субтитрів/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Подивитися на сайті джерела/ }).first()).toHaveAttribute("href", /^https:\/\/commons\.wikimedia\.org\//);
  expect(await noAutoplay(page)).toBe(true);
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
  await page.getByTestId("nav-listening").click();
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
    // Constructed stylesheet: the built app's CSP blocks injected <style> tags, not CSSOM.
    await page.evaluate(() => { const s = new CSSStyleSheet(); s.replaceSync('*{font-family:"DejaVu Sans Mono",monospace !important;letter-spacing:.02em}'); document.adoptedStyleSheets = [...document.adoptedStyleSheets, s]; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("video questions (CURATED-09): each open video has its gist/detail/opinion questions in Finnish, Ukrainian on request, no answer key", async ({ page }) => {
  await open(page, "Відео");
  const q = page.getByTestId("video-questions-jenni-puhekieli");
  await expect(q.locator("ol").first().locator("li")).toHaveCount(3);
  await expect(q).toContainText("Mitä Jenni kertoo suomalaisista ja amerikkalaisista?");
  await expect(q.getByText("Що Дженні розповідає про фінів та американців?")).toBeHidden();      // translation only on request
  await q.locator("summary").click();
  await expect(q.getByText("Що Дженні розповідає про фінів та американців?")).toBeVisible();
  await expect(page.getByTestId("video-questions-claes-esittely")).toBeVisible();
  await expect(page.getByText(/Правильна відповідь|Ключ/)).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
});

test("where to learn next (CURATED-09): publisher series, Yle Areena episodes and open materials as link rows; reviewed hosts only, competitor platforms never shown, nothing embedded", async ({ page }) => {
  await open(page, "Зовнішні джерела");
  const groups = { series: 9, episodes: 8, open: 5 };
  for (const [id, n] of Object.entries(groups)) {
    const g = page.getByTestId(`learn-more-${id}`);
    await expect(g.getByRole("link")).toHaveCount(n);
    for (const h of await g.getByRole("link").evaluateAll(as => as.map(a => [a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel")])))
      expect(h).toEqual([expect.stringMatching(/^https:\/\/(yle\.fi|areena\.yle\.fi|www\.kielibuusti\.fi|www\.finna\.fi|www\.suomikoulut\.fi)\//), "_blank", "noopener noreferrer"]);
  }
  await expect(page.locator('a[href*="ykimock"], a[href*="ykitestprep"], a[href*="ykiprep"]')).toHaveCount(0);   // comparison only, never for learners
  await expect(page.getByTestId("learn-more-episodes")).toContainText("Після перегляду спробуй сам(а) (чернетка)");  // beta build: draft prompt labelled
  await expect(page.locator("iframe, embed, object")).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
});
