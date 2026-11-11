import { expect, test, type Page } from "@playwright/test";

async function openData(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  await expect(page.getByRole("heading", { name: "Надійність локального сховища" })).toBeVisible();
}

test("best-effort storage is disclosed; persistence is requested only on an explicit click", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { calls: 0, persistent: false };
    (window as unknown as { __storageProbe: typeof state }).__storageProbe = state;
    Object.defineProperty(navigator, "storage", { configurable: true, value: {
      persisted: async () => state.persistent,
      persist: async () => { state.calls++; state.persistent = true; return true; },
      estimate: async () => ({ usage: 12 * 1024 * 1024, quota: 512 * 1024 * 1024 }),
    } });
  });
  await openData(page);
  await expect(page.getByText(/Режим best-effort/)).toBeVisible();
  await expect(page.getByText(/Орієнтовно використано/)).toContainText("12 МіБ");
  expect(await page.evaluate(() => (window as unknown as { __storageProbe: { calls: number } }).__storageProbe.calls)).toBe(0);
  await page.getByRole("button", { name: "Оновити стан сховища" }).click();
  expect(await page.evaluate(() => (window as unknown as { __storageProbe: { calls: number } }).__storageProbe.calls)).toBe(0);
  await page.getByRole("button", { name: "Попросити постійне зберігання" }).click();
  await expect(page.getByText(/Браузер підтвердив постійний режим зберігання/)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __storageProbe: { calls: number } }).__storageProbe.calls)).toBe(1);
  await expect(page.getByRole("button", { name: "Попросити постійне зберігання" })).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Мої дані: копія й видалення" }).click();
  // The mock resets on a page load: never claim persistence based on the previous request.
  await expect(page.getByText(/Режим best-effort/)).toBeVisible();
});

test("denied persistence is not silently presented as granted, and LEARN remains usable", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { called: 0 };
    (window as unknown as { __storageProbe: typeof state }).__storageProbe = state;
    Object.defineProperty(navigator, "storage", { configurable: true, value: {
      persist: async () => { state.called++; return true; }, // misleading result on purpose
      persisted: async () => false, estimate: async () => ({ usage: 0, quota: 1024 * 1024 * 1024 }),
    } });
  });
  await openData(page);
  await page.getByRole("button", { name: "Попросити постійне зберігання" }).click();
  await expect(page.getByText(/Браузер не підтвердив постійне зберігання/)).toBeVisible();
  await expect(page.getByText(/Режим best-effort/)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __storageProbe: { called: number } }).__storageProbe.called)).toBe(1);
  await page.getByRole("button", { name: "На головну" }).click();
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
});

test("low estimated quota and absent browser storage are communicated without changing user data", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "storage", { configurable: true, value: {
    persisted: async () => false, estimate: async () => ({ usage: 80 * 1024 * 1024, quota: 100 * 1024 * 1024 }),
  } }));
  await openData(page);
  await expect(page.getByText(/За оцінкою браузера залишилося менше 64 МіБ/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Попросити постійне зберігання" })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("Навчання");
});

test("unsupported storage API reports uncertainty, without a spurious permission request", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "storage", { configurable: true, value: undefined }));
  await openData(page);
  await expect(page.getByText(/Браузер не надає даних про режим зберігання/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Попросити постійне зберігання" })).toHaveCount(0);
  await page.getByRole("button", { name: "Оновити стан сховища" }).click();
  await expect(page.getByText(/Браузер не надає даних/)).toBeVisible();
});
