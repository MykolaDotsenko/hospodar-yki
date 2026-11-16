import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** docs/29 stage 4: the exam runs by rules from its pinned profile, each with its status on screen; focused mode. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);
async function start(page: Page, only?: string) {
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  if (only) for (const s of ["Читання", "Аудіювання", "Письмо", "Говоріння"].filter(x => x !== only)) await page.getByLabel(new RegExp(`${s} ·`)).uncheck();
  await page.getByRole("button", { name: /Aloita/ }).click();
  await expect(page.getByText(/Tehtävä 1 \//)).toBeVisible();
}

test("exam rules: every rule of the attempt is listed with its status — all 18 practice today — and the attempt runs on them", async ({ page }) => {
  await start(page);
  const list = page.getByTestId("exam-rules");
  await expect(list.locator("summary")).toHaveText("Правила цієї спроби: 0 з 18 підтверджено, 18 тренувальних");
  await expect(list).not.toHaveAttribute("open", "");                                       // closed: never a distraction
  await list.locator("summary").click();
  await expect(list.locator("li")).toHaveCount(18);
  await expect(list.locator('li[data-status="practice"]')).toHaveCount(18);
  await expect(list.locator('li[data-rule="listening.plays_allowed"]')).toContainText("без обмеження");
  await expect(list.locator('li[data-rule="timing.reading_minutes"]')).toContainText("окремого часу немає");
  await expect(list.locator('li[data-rule="navigation.back_allowed"]')).toContainText("тренувальне правило: у справжньому іспиті 2027 може бути інакше");
  expect(await list.innerText()).not.toMatch(/\d\s*%/);
  expect(await serious(page)).toEqual([]);

  // practice rules in force: going back is allowed …
  await page.getByRole("button", { name: "Seuraava" }).click();
  await expect(page.getByText(/Tehtävä 2 \//)).toBeVisible();
  await expect(page.getByRole("button", { name: "Edellinen" })).toBeEnabled();
});

test("exam rules: the writing editor follows the practice rules — no spellcheck, no counter, paste allowed", async ({ page }) => {
  await start(page, "Письмо");
  const box = page.getByRole("textbox");
  await expect(box).toHaveAttribute("spellcheck", "false");
  await expect(page.getByTestId("exam-counter")).toHaveCount(0);
  const blocked = await box.evaluate(el => { const e = new Event("paste", { bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; });
  expect(blocked).toBe(false);
  await expect(page.getByTestId("exam-rules").locator('li[data-rule="writing.paste_allowed"]')).toContainText("так");
});

test("focused mode: inside an attempt no app navigation or settings; «Keskeytä» leaves only when saved and the attempt resumes", async ({ page }) => {
  await start(page, "Говоріння");
  await expect(page.locator("a.brand")).toHaveCount(0);
  await expect(page.getByTestId("focus-brand")).toContainText("Зосереджений режим репетиції");
  await expect(page.getByRole("button", { name: "Спокійний режим" })).toHaveCount(0);
  await expect(page.locator("#theme, #font, a[href='#review']")).toHaveCount(0);
  await expect(page.locator("footer")).toContainText("Не є офіційним YKI");                // the disclaimer stays

  await page.getByRole("textbox").fill("Sopisiko perjantai kello kymmenen?");
  await expect(page.getByRole("button", { name: "Keskeytä ja jatka myöhemmin" })).toBeDisabled();   // not yet saved
  await expect(page.getByText("Tallennettu.", { exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Keskeytä ja jatka myöhemmin" }).click();
  await expect(page.locator("a.brand")).toHaveCount(1);                                     // back to the app
  await expect(page.locator("#theme")).toHaveCount(1);

  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.getByText("Jatkat keskeytynyttä harjoitusta. Vastauksesi on tallennettu.")).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveValue("Sopisiko perjantai kello kymmenen?");
  await expect(page.locator("a.brand")).toHaveCount(0);
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await page.getByRole("button", { name: "Lopeta koe" }).click();
  await expect(page.getByRole("heading", { name: /Tulokset/ })).toBeVisible();
  await expect(page.locator("a.brand")).toHaveCount(1);                                     // results: focus ends
});
