import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Service-worker E2E runs on Chromium only (Playwright's SW interception/offline emulation); unit tests cover the SW logic. */
test.skip(({ browserName }) => browserName !== "chromium", "service-worker E2E is Chromium-only");
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);
const controlled = (page: Page) => page.waitForFunction(() => navigator.serviceWorker.controller !== null);

test("WEB-05: the app opens offline after one online visit; media is online_only until the learner saves a pack, then plays offline with ranges", async ({ page, context }) => {
  await page.goto("./");
  await controlled(page);
  await page.getByRole("button", { name: "Офлайн-доступ" }).click();
  await expect(page.locator("p", { hasText: "Сам застосунок:" })).toContainText("відкривається без інтернету");
  const packs = page.getByRole("list", { name: "Офлайн-пакети" });
  await expect(packs.locator("li").first()).toContainText("лише з інтернетом");
  expect(await serious(page)).toEqual([]);
  const audioUrl = await page.evaluate(async () => (await (await fetch("./offline-manifest.json")).json()).packs[0].files[0].url as string);

  await context.setOffline(true);
  expect(await page.evaluate(u => fetch(u).then(r => r.status, () => "failed"), audioUrl)).toBe("failed");   // not cached implicitly
  await page.reload();
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();                 // shell from the SW cache
  await context.setOffline(false);

  await page.getByRole("button", { name: "Офлайн-доступ" }).click();
  await packs.getByRole("button", { name: "Зберегти для офлайну" }).first().click();
  await expect(page.getByText(/збережено для офлайну \(\d+ файлів, перевірено розмір і контрольну суму\)/)).toBeVisible({ timeout: 30_000 });
  await expect(packs.locator("li").first()).toContainText("збережено для офлайну");

  // WEB-05: a stale same-URL audio response must NOT survive as a fake ready pack.
  await page.evaluate(async url => {
    const cache = await caches.open("hospodar-media-v1");
    const key = new URL(url, document.baseURI).href;
    const response = await cache.match(key);
    if (!response) throw new Error("Expected the downloaded audio cache entry");
    const tampered = new Uint8Array(await response.arrayBuffer());
    tampered[0] = (tampered[0] ?? 0) ^ 1; // exact size preserved, only digest differs
    await cache.put(key, new Response(tampered, { headers: { "Content-Type": response.headers.get("content-type") ?? "audio/ogg" } }));
  }, audioUrl);
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Офлайн-доступ" }).click();
  await expect(packs.locator("li").first()).toContainText("частково збережено");
  await packs.getByRole("button", { name: "Дозберегти" }).first().click();
  await expect(packs.locator("li").first()).toContainText("збережено для офлайну");

  await context.setOffline(true);
  const r = await page.evaluate(u => fetch(u, { headers: { Range: "bytes=0-99" } }).then(x => [x.status, x.headers.get("content-range")?.startsWith("bytes 0-99/")]), audioUrl);
  expect(r).toEqual([206, true]);
  await context.setOffline(false);
  await packs.getByRole("button", { name: "Видалити з офлайну" }).first().click();
  await expect(packs.locator("li").first()).toContainText("лише з інтернетом");
});

test("WEB-06: a new version waits; it is never offered during the exam, only outside it, and applies on the learner's click", async ({ page }) => {
  await page.goto("./");
  await controlled(page);
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();
  // Simulate a new deployment: a different script URL always installs a new worker into the same registration.
  await page.evaluate(() => navigator.serviceWorker.register("./sw.js?deploy=e2e", { scope: "./" }));
  await page.waitForFunction(() => navigator.serviceWorker.getRegistration().then(r => r?.waiting?.state === "installed"));
  await page.waitForTimeout(300);
  await expect(page.getByText("Доступна нова версія застосунку")).toHaveCount(0);           // guard: never inside the exam
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();

  await page.getByRole("button", { name: "На головну" }).or(page.locator(".brand")).first().click();
  await expect(page.getByText("Доступна нова версія застосунку")).toBeVisible();
  const reloaded = page.waitForEvent("load");                                                // the reload of the NEW document
  await page.getByRole("button", { name: "Оновити зараз" }).click();                         // (waitForLoadState would resolve on the old page)
  await reloaded;
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  expect(await page.evaluate(() => navigator.serviceWorker.controller!.scriptURL)).toContain("deploy=e2e");   // the new version controls the page
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Tehtävä 1 / 9")).toBeVisible();                              // the rehearsal survived the update
});

test("WEB-06: the app is installable (Chromium's own installability check is empty) with a Ukrainian manifest and no exam shortcut", async ({ page }) => {
  await page.goto("./");
  await controlled(page);
  const manifest = await page.evaluate(() => fetch("./manifest.webmanifest").then(r => r.json()));
  expect(manifest).toMatchObject({ lang: "uk", display: "standalone", start_url: "./", short_name: "Hospodar YKI" });
  expect(manifest.description).toMatch(/Не офіційний YKI/);
  expect(manifest.shortcuts).toBeUndefined();
  expect(await page.evaluate(u => fetch(u).then(r => r.ok), new URL(manifest.icons[0].src, page.url()).href)).toBe(true);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors") as { installabilityErrors: { errorId: string }[] };
  expect(installabilityErrors.map(e => e.errorId)).toEqual([]);
});
