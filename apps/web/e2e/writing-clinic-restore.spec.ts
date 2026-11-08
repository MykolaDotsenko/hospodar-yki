import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DRAFT = "Hei! Kylpyhuoneen seinässä on tumma läikkä. Voitteko tulla katsomaan?";
const TRANSFER = "Hei! Keittiön ikkunasta vetää kylmää. Sopiiko huolto tiistaina tai torstaina?";
async function openClinic(page: Page) {
  await page.getByRole("button", { name: "✍ Майстерня письма" }).click();
}
async function start(page: Page) {
  await page.goto("./");
  await openClinic(page);
  await page.getByRole("button", { name: /Kosteusvaurio epäilyttää/ }).click();
}

test("LEARN Writing Clinic: verified Finnish text and self-check survive a real page reload", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твій текст фінською/).fill(DRAFT);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  await page.reload();
  await openClinic(page);
  await expect(page.getByRole("heading", { name: "Твій текст" })).toBeVisible();
  await expect(page.getByLabel(/Твій текст фінською/)).toHaveValue(DRAFT);
  await expect(page.getByText(/Незавершену майстерню відновлено/)).toBeVisible();
  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(a11y.violations.filter(v => ["critical", "serious"].includes(v.impact ?? ""))).toEqual([]);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(page.getByRole("heading", { name: "Перевір себе" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.reload();
  await openClinic(page);
  await expect(page.getByRole("heading", { name: "Перевір себе" })).toBeVisible();
  await expect(page.getByText(DRAFT)).toBeVisible();
});

test("LEARN Writing Clinic: spot/model/rewrite/transfer checkpoints preserve boundaries and commit once", async ({ page }) => {
  await start(page);
  await page.getByLabel(/Твій текст фінською/).fill(DRAFT);
  await page.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await page.getByLabel("paikka").check();
  await page.getByRole("button", { name: "Зберегти чернетку й далі" }).click();
  await expect(page.getByRole("heading", { name: "Знайди проблеми в чужій чернетці" })).toBeVisible();
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await page.reload();
  await openClinic(page);
  await expect(page.getByRole("heading", { name: "Знайди проблеми в чужій чернетці" })).toBeVisible();
  await expect(page.getByText(/Huomasin kylpyhuoneen seinässä tumman läikän/)).toHaveCount(0);
  await page.getByLabel(/Minulla on huono seinä kylpyhuone/).check();
  await page.getByRole("button", { name: "Показати, що варто змінити" }).click();
  await page.getByRole("button", { name: "Далі: зразок" }).click();
  await page.getByRole("button", { name: "Переписати свій текст" }).click();
  const rewrite = DRAFT + " Olen kotona arkisin kello 17 jälkeen.";
  await page.getByLabel(/Твій переписаний текст/).fill(rewrite);
  await expect(page.getByLabel(/Твій переписаний текст/)).toHaveValue(rewrite);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  const savedInput = await page.evaluate(async () => new Promise<string | undefined>((resolve, reject) => {
    const request = indexedDB.open("hospodar-yki:web:v1");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const tx = request.result.transaction("clinicDraft", "readonly");
      const get = tx.objectStore("clinicDraft").get("active");
      get.onerror = () => reject(get.error);
      get.onsuccess = () => { resolve((get.result as { input?: string } | undefined)?.input); request.result.close(); };
    };
  }));
  expect(savedInput).toBe(rewrite);
  await page.reload();
  await openClinic(page);
  await expect(page.getByRole("heading", { name: "Перепиши свій текст" })).toBeVisible();
  await expect(page.getByLabel(/Твій переписаний текст/)).toHaveValue(rewrite);
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await expect(page.getByRole("heading", { name: "Нова ситуація — без зразка" })).toBeVisible();
  await expect(page.getByText(DRAFT)).toHaveCount(0);
  await page.getByLabel(/Твій новий текст/).fill(TRANSFER);
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByRole("heading", { name: "Готово" })).toBeVisible();
  await page.reload();
  await openClinic(page);
  await expect(page.getByRole("heading", { name: "Майстерня письма" })).toBeVisible();
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Письмо$/ }) })).toContainText("3 без оцінки");
});

test("LEARN Writing Clinic: stale second tab cannot replace a newer Finnish answer", async ({ page, context }) => {
  await start(page);
  await page.getByLabel(/Твій текст фінською/).fill(DRAFT);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await openClinic(page);
  const other = await context.newPage();
  await other.goto("./");
  await openClinic(other);
  await expect(other.getByLabel(/Твій текст фінською/)).toHaveValue(DRAFT);
  await page.getByLabel(/Твій текст фінською/).fill(TRANSFER);
  await page.getByRole("button", { name: "Зберегти та вийти" }).click();
  await other.getByRole("button", { name: "Готово — перевірити себе" }).click();
  await expect(other.getByRole("alert")).toContainText("REVISION_CONFLICT");
  await expect(other.getByLabel(/Твій текст фінською/)).toHaveValue(DRAFT);
  await other.reload();
  await openClinic(other);
  await expect(other.getByLabel(/Твій текст фінською/)).toHaveValue(TRANSFER);
});
