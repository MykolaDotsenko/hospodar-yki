import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
async function throughReading(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Стартова діагностика" }).click();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await page.getByLabel("Tapaamispäivä").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel("Täydellinen kielitaito").check();       // wrong on purpose
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByRole("heading", { name: "Читання: що вийшло" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти й далі: письмо" }).click();
}
async function throughWriting(page: Page) {
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByRole("alert")).toContainText("щонайменше 20 символів");
  await page.getByLabel(/Твій текст фінською/).fill("Hei! Puhun suomea vähän. Sopiiko maanantai? Paljonko kurssi maksaa?");
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await page.getByLabel("kielitaito").check();
  await page.getByRole("button", { name: /Зберегти без оцінки й далі/ }).click();
}

test("UX-06 diagnostic: reading keys only after answers; writing/speaking ungraded self-check; no level; saved per step", async ({ page }) => {
  await throughReading(page);
  await expect(page.getByRole("heading", { name: "Письмо" })).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await throughWriting(page);
  await expect(page.getByRole("heading", { name: "Говоріння" })).toBeVisible();
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByRole("alert")).toContainText("Запиши голос або напиши");
  await page.getByLabel(/усний план/).fill("Valitettavasti en pääse torstaina. Sopisiko perjantai tai maanantai?");
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await page.getByLabel("ensimmäinen ehdotus").check();
  await page.getByRole("button", { name: /Зберегти без оцінки й завершити/ }).click();
  const summary = page.getByRole("status");
  await expect(summary).toContainText("1 з 2 з першої спроби — замало питань для висновку");
  await expect(summary).toContainText("Аудіювання: не перевірялося");
  await expect(summary).not.toContainText("%");
  expect(await serious(page)).toEqual([]);
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("1 без оцінки");
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("1 без оцінки");
});

test("speaking voice needs explicit consent; recording stays in the tab and only a flag is saved", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    (w as { __gum?: number }).__gum = 0;
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => {
      (w as { __gum: number }).__gum++; return { getTracks: () => [{ stop() {} }] }; } } });
    w.MediaRecorder = class { state = "inactive"; mimeType = "audio/webm"; ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      stream: unknown; constructor(s: unknown) { this.stream = s; }
      start() { this.state = "recording"; } stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["x"]) }); this.onstop?.(); } };
  });
  await throughReading(page);
  await throughWriting(page);
  const rec = page.getByRole("button", { name: "🎙 Почати запис" });
  await expect(rec).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { __gum: number }).__gum)).toBe(0);
  await page.getByLabel(/Дозволяю записати мій голос/).check();
  await rec.click();
  await expect(page.getByText("Іде запис…")).toBeVisible();
  await page.getByRole("button", { name: "⏹ Зупинити" }).click();
  await expect(page.locator("audio")).toHaveCount(1);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByText(/Голосовий запис зроблено/)).toBeVisible();
  await page.getByRole("button", { name: /Зберегти без оцінки й завершити/ }).click();
  await expect(page.getByRole("status")).toContainText("голосом (запис не збережено)");
  const stored = await page.evaluate(() => new Promise<string>((res, rej) => {
    const r = indexedDB.open("hospodar-yki:web:v1");
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const db = r.result; const g = db.transaction("learner").objectStore("learner").getAll();
      g.onsuccess = () => res(JSON.stringify(g.result)); };
  }));
  expect(stored).toContain("Voice recorded this session (not retained)");
  expect(stored).not.toMatch(/blob:|data:audio/);
});
