import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** dictogloss: one short segment, heard at most twice → reconstruct from memory → transcript only after; ungraded. */
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const SEG1 = "Sofia oli tilannut verkkokaupasta uuden takin";

test("dictogloss: listen (max twice) → write from memory → only then the original, shared word forms marked, ungraded; next time the next segment", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-listening").click();
  const item = page.getByRole("list", { name: "Диктоглос" }).getByRole("button", { name: /Kun verkkokaupan tilaus meni pieleen/ });
  await expect(item).toContainText("уривок 1 з 12");
  await expect(page.getByRole("list", { name: "Диктоглос" })).not.toContainText("Vesikatko");            // exam lessons stay out of LEARN
  await item.click();
  await expect(page.getByRole("heading", { name: "Послухай уривок" })).toBeVisible();
  await expect(page.getByText(SEG1)).toHaveCount(0);
  await page.getByRole("button", { name: "До письма" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу прослухай");
  await page.getByRole("button", { name: "Прослухати уривок" }).click();
  await page.getByRole("button", { name: "Прослухати ще раз (останній)" }).click();
  await expect(page.getByRole("button", { name: "Прослухано двічі" })).toBeDisabled();
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "До письма" }).click();
  await expect(page.getByText(SEG1)).toHaveCount(0);                                                   // still no transcript while writing
  await page.getByLabel(/Твій текст фінською/).fill("Sofia tilasi uuden takin verkkokaupasta, koska vanha ei pitänyt sadetta.");
  await page.getByRole("button", { name: "Показати оригінал" }).click();
  await expect(page.getByTestId("dg-original")).toContainText(SEG1);
  await expect(page.getByTestId("dg-original").locator("mark", { hasText: "uuden" })).toHaveCount(1);
  await expect(page.getByTestId("dg-original").locator("mark", { hasText: /^tilannut$/ })).toHaveCount(0);   // a different form is not marked
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%|рівень|бал:/);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Зберегти" }).click();
  await expect(page.getByRole("alert")).toContainText("оціни");
  await page.getByRole("button", { name: "Головне" }).click();
  await page.getByRole("button", { name: "Зберегти" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();
  await page.getByRole("button", { name: "До списку записів" }).click();
  await expect(page.getByRole("list", { name: "Диктоглос" }).getByRole("button", { name: /Kun verkkokaupan/ })).toContainText("уривок 2 з 12");
});
