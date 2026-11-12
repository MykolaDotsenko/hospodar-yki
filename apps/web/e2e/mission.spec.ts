import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// First unattempted exercise for a fresh profile: b1-g-001 "Huomenna menen ___ (kirjasto)." → kirjastoon
const KEY = "kirjastoon";

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => `${v.id}: ${v.nodes.length}`);
}
async function startMission(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByRole("heading", { name: "Твоя відповідь" })).toBeVisible();
}

/** Independent native IndexedDB read: UI success must match actual durable bytes. */
async function storedClozeInput(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("hospodar-yki:web:v1");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    try {
      const req = db.transaction("missionDraft", "readonly").objectStore("missionDraft").get("active");
      const row = await new Promise<{ input?: string } | undefined>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return row?.input ?? null;
    } finally { db.close(); }
  });
}

test("home: two modes, honest exam status, no serious axe violations", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  await expect(page.getByText("01")).toBeVisible();
  await expect(page.getByText(/Симуляція YKI/)).toBeVisible();
  await expect(page.getByText(/Не офіційний YKI: правила цифрового іспиту 2027 ще не підтверджено/)).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("wrong → repair without key → feedback with key → transfer → saved; survives reload", async ({ page }) => {
  await startMission(page);
  await expect(page.locator(".prompt[lang=fi]")).toContainText("kirjasto");
  await expect(page.getByText("Чернетка: ще не перевірено S2-викладачем.")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);           // COLOR-02: no key during repair
  await expect(page.getByText(KEY, { exact: true })).toHaveCount(0);
  await page.getByLabel("Впиши пропущену форму фінською").fill(KEY);
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.locator(".learning-cue")).toHaveText(KEY);          // key only in feedback
  await expect(page.getByText(/керована підказка/)).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);           // COLOR-03: none in transfer
  await page.getByLabel(/Твоє власне речення/).fill("Huomenna menen kauppaan.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("Виконано місій:")).toContainText("1");
});

test("empty answer is refused with an accessible error; keyboard-only flow works", async ({ page }) => {
  await page.goto("./");
  for (let i = 0; i < 8; i++) {                       // reach the learn entry with Tab only
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes("Навчання")) break;
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Твоя відповідь" })).toBeFocused();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("alert")).toHaveText("Спершу напиши відповідь.");
  await page.getByLabel("Впиши пропущену форму фінською").fill(KEY);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Правильно з першої спроби.")).toBeVisible();
});

test("second tab with a stale snapshot never overwrites a first answer (REVISION_CONFLICT)", async ({ page, context }) => {
  const other = await context.newPage();
  await startMission(page);
  await other.goto("./");
  await other.getByRole("button", { name: /Навчання/ }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill(KEY);
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("Правильно з першої спроби.")).toBeVisible();
  await other.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await other.getByRole("button", { name: "Перевірити" }).click();
  await expect(other.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(other.getByRole("heading", { name: "Твоя відповідь" })).toBeVisible();
  await expect(other.locator(".learning-cue")).toHaveCount(0);
  await other.reload();
  await other.getByRole("button", { name: /Навчання/ }).click();
  await expect(other.getByText("Правильно з першої спроби.")).toBeVisible();
  await expect(other.locator(".learning-cue")).toHaveText(KEY);
});

test("320 px wide and 200% text: no horizontal page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await startMission(page);
  await page.addStyleTag({ content: "html{font-size:200%}" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("COG-05: repair asks about the actual grammar tag, not generic location for verb valency", async ({ page }) => {
  await startMission(page);
  await page.getByText("Чому це завдання зараз?").click();
  await page.getByRole("button", { name: "Обрати інше завдання" }).click();
  await page.getByRole("button", { name: /Odotan/ }).click();
  await expect(page.locator(".prompt[lang=fi]")).toContainText("Odotan");
  await page.getByLabel("Впиши пропущену форму фінською").fill("bussi");
  await page.getByRole("button", { name: "Перевірити" }).click();
  const hint = page.locator(".feedback.warn");
  await expect(hint).toContainText("керування");
  await expect(hint).not.toContainText("де? куди? звідки?");
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await expect(page.getByText("bussia", { exact: true })).toHaveCount(0);
  expect(await axe(page)).toEqual([]);
  await page.getByLabel("Впиши пропущену форму фінською").fill("bussia");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.locator(".learning-cue")).toHaveText("bussia");
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
});

test("PSY-02: a location-task repair remains about direction, without leaking its key", async ({ page }) => {
  await startMission(page);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.locator(".feedback.warn")).toContainText("куди");
  await expect(page.getByText(KEY, { exact: true })).toHaveCount(0);
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  expect(await axe(page)).toEqual([]);
});

test("PSY-07: wrong first attempt and repair text survive reload with NO answer key", async ({ page }) => {
  await startMission(page);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto**");
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await expect(page.getByText(/Виконано місій: 0/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByText(/Продовжуємо незавершену місію/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();
  await expect(page.getByLabel("Впиши пропущену форму фінською")).toHaveValue("kirjasto**");
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel("Впиши пропущену форму фінською").fill(KEY);
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.locator(".learning-cue")).toHaveText(KEY);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel(/Твоє власне речення/).fill("Menen tänään kauppaan.");
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  expect(await storedClozeInput(page)).toBe("Menen tänään kauppaan."); // actual IDB bytes, not toast
  await page.reload();
  expect(await storedClozeInput(page)).toBe("Menen tänään kauppaan.");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByRole("heading", { name: "Скажи це про себе" })).toBeVisible();
  await expect(page.getByLabel(/Твоє власне речення/)).toHaveValue("Menen tänään kauppaan.");
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("Виконано місій:")).toContainText("1");
  expect(await axe(page)).toEqual([]);
});

test("LEARN-07: autonomous answer field autosaves after a pause; discard is deliberate and verified", async ({ page }) => {
  await startMission(page);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjast");
  await expect(page.getByText(/Чернетку збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByLabel("Впиши пропущену форму фінською")).toHaveValue("kirjast");
  await expect(page.getByText(/Продовжуємо незавершену місію/)).toBeVisible();
  await page.getByRole("button", { name: "Відкинути чернетку та почати заново" }).click();
  await expect(page.getByLabel("Впиши пропущену форму фінською")).toHaveValue("");
  await page.reload();
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.getByText(/Продовжуємо незавершену місію/)).toHaveCount(0);
  await expect(page.getByText(/Виконано місій: 0/)).toHaveCount(0); // mission view, not Home statistics
});
