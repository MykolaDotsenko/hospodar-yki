import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { openReviewer } from "./helpers.ts";

/** S2 reviewer workspace (docs/29 stage 1, QL-01): walk on the real screen in a sandbox, keys beside it, decide, download. */
const REPO = resolve(process.cwd(), "../..");
if (!existsSync(resolve(REPO, "scripts/apply_review_decisions.py"))) throw new Error(`run from apps/web (repo root not found at ${REPO})`);

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => `${v.id}: ${v.nodes.length}`);
}
/** Revision of the learner's own progress row (null = never written). */
const learnerRevision = (page: Page) => page.evaluate(() => new Promise<number | null>((done, fail) => {
  const req = indexedDB.open("hospodar-yki:web:v1");
  req.onerror = () => fail(req.error);
  req.onsuccess = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains("learner")) { db.close(); done(null); return; }
    const get = db.transaction("learner").objectStore("learner").get("current");
    get.onsuccess = () => { db.close(); done((get.result as { revision?: number } | undefined)?.revision ?? null); };
  };
}));
const sandboxes = (page: Page) => page.evaluate(async () =>
  (await indexedDB.databases()).map(d => d.name ?? "").filter(n => n.startsWith("hospodar-yki:review-sandbox:")));

test("a learner is warned before keys are shown; the workspace lists every LEARN bank and is accessible", async ({ page }) => {
  await page.goto("./#review");
  await expect(page.getByRole("heading", { name: "Робоче місце рецензента" })).toBeVisible();
  await expect(page.getByText(/Якщо ти вчишся з цим застосунком, не відкривай/)).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Я рецензент(ка) — відкрити" }).click();
  await expect(page.getByRole("heading", { name: "Робоче місце рецензента S2" })).toBeVisible();
  await expect(page.locator("tr[data-bank]")).toHaveCount(29);                       // + recordings, corpus forms, tenses, clock, video questions, masterclasses, external missions (CURATED-09); rubric labels hold no Finnish
  await expect(page.getByTestId("review-summary")).toContainText("Твоїх рішень у цьому браузері: 0");
  await expect(page.getByText(/Завдання пробного іспиту тут не показано/)).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("walking a task saves only into a throwaway sandbox: learner progress is never written and the sandbox is deleted", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  expect(await learnerRevision(page)).toBeNull();
  await openReviewer(page);
  await page.getByRole("button", { name: "Граматика в контексті (cloze)" }).click();
  await page.getByRole("list", { name: "Одиниці банку" }).getByRole("button").first().click();
  await expect(page.locator(".review-key").first()).toBeVisible();                          // keys beside the task, before walking
  await page.getByRole("button", { name: "Пройти як учень" }).click();
  await expect(page.getByText(/Пісочниця рецензента/)).toBeVisible();
  await expect(page.locator(".review-key")).toHaveCount(0);                                   // the walk shows what a learner sees
  await page.getByLabel("Впиши пропущену форму фінською").fill("väärä");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();
  await page.getByLabel("Впиши пропущену форму фінською").fill("väärä");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await page.getByLabel(/Твоє власне речення/).fill("Oma lause.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  expect(await sandboxes(page)).toHaveLength(1);                                             // the save landed in the sandbox
  expect(await learnerRevision(page)).toBeNull();                                            // …and never in learner progress
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Вийти з проходження" }).click();
  await expect(page.getByRole("heading", { name: "Рішення рецензента" })).toBeVisible();
  await expect.poll(() => sandboxes(page)).toEqual([]);
  expect(await learnerRevision(page)).toBeNull();
  await page.goto("./");
  await expect(page.getByText("Виконано місій:")).toContainText("0");
});

test("an approval without the required card fields is refused; complete decisions survive a reload and download as a file the repository script accepts", async ({ page }) => {
  await openReviewer(page);
  await page.getByLabel("Псевдонімний ідентифікатор рецензента").fill("s2-rev-01");
  await page.getByLabel("Псевдонімний ідентифікатор рецензента").press("Tab");
  await page.getByRole("button", { name: "Фрази для життя" }).click();
  await page.getByRole("list", { name: "Одиниці банку" }).getByRole("button").first().click();
  await page.getByLabel(/Схвалити: фінська, ключ, варіанти й права перевірено/).check();
  await page.getByRole("button", { name: "Записати рішення" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Рішення не записано");
  await expect(alert).toContainText("Обери рівень");
  await expect(alert).toContainText("що учень зможе зробити фінською");
  await expect(alert).toContainText("ключ і всі прийнятні варіанти");
  expect(await axe(page)).toEqual([]);
  await page.getByLabel("Рівень").selectOption("B1.1");
  await page.getByLabel("Що учень зможе зробити фінською після завдання").fill("Розповісти, коли переїхав(ла) до Фінляндії.");
  await page.getByLabel("Я перевірив(ла) ключ і всі прийнятні варіанти відповіді").check();
  await page.getByRole("button", { name: "Записати рішення" }).click();
  await expect(page.getByText(/Рішення «схвалити» записано/)).toBeVisible();
  await expect(page.getByTestId("repo-status")).toHaveText("Не рецензовано");                // nothing reaches the repository from the browser

  await page.getByRole("button", { name: "Наступна одиниця" }).click();
  await page.getByLabel("Повернути автору з причиною").check();
  await page.getByRole("button", { name: "Записати рішення" }).click();
  await expect(page.getByRole("alert")).toContainText("Обери хоча б одну причину повернення");
  await page.getByLabel(RegExp("Ключ або прийнятні варіанти")).check();
  await page.getByLabel("Що саме виправити").fill("Додай варіант без займенника: «Muutin tänne syksyllä».");
  await page.getByRole("button", { name: "Записати рішення" }).click();
  await expect(page.getByText(/Рішення «повернути» записано/)).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Я рецензент(ка) — відкрити" }).click();
  await expect(page.getByTestId("review-summary")).toContainText("Твоїх рішень у цьому браузері: 2");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Завантажити файл рецензій \(2\)/ }).click()]);
  const path = (await download.path())!;
  const file = JSON.parse(readFileSync(path, "utf8"));
  expect(file.schema).toBe("hospodar-review-decisions-v1");
  expect(file.decisions.map((d: { decision: string }) => d.decision).sort()).toEqual(["approve", "return"]);
  expect(file.decisions.every((d: { reviewer_id: string; file: string }) => d.reviewer_id === "s2-rev-01" && d.file === "knowledge/dictionaries/b1/contextual-chunks-v1.json")).toBe(true);
  const out = execFileSync("python3", ["scripts/apply_review_decisions.py", path, "--dry-run"], { cwd: REPO, encoding: "utf8" });
  expect(out).toContain("PASS 2 decisions: 1 approved (s2_reviewed), 1 returned");             // the browser hash = the repository hash
});

test("every unit's browser hash equals the repository hash (one file format, one hash, in every engine)", async ({ page }) => {
  await openReviewer(page);
  const requests: { file: string; id: string; hash: string }[] = [];
  const banks = await page.locator("tr[data-bank]").count();
  for (let i = 0; i < banks; i++) {
    await page.locator("tr[data-bank]").nth(i).getByRole("button").click();
    const rows = page.locator("li[data-unit]");
    await expect(rows.first()).not.toHaveAttribute("data-hash", "");
    requests.push(...await rows.evaluateAll(els => els.map(e => ({ file: e.getAttribute("data-file")!, id: e.getAttribute("data-unit")!, hash: e.getAttribute("data-hash")! }))));
    await page.getByRole("button", { name: "До всіх банків" }).click();
  }
  expect(requests.length).toBeGreaterThan(400);
  const python = JSON.parse(execFileSync("python3", ["scripts/validate_content_publication.py", "--hash-items"],
    { cwd: REPO, encoding: "utf8", input: JSON.stringify(requests.map(r => ({ file: r.file, id: r.id }))) })) as { file: string; id: string; matches: number; hash: string }[];
  const mismatched = requests.filter((r, i) => python[i]!.matches !== 1 || python[i]!.hash !== r.hash).map(r => `${r.file}#${r.id}`);
  expect(mismatched).toEqual([]);
});
