import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Майстерня слабких місць (error-bottleneck-deliberate, interleaving-grammar; PSY-06, COG-10, GL-03). */
const T0 = new Date("2026-11-03T09:00:00+02:00");
const DAY7 = new Date("2026-11-10T09:00:00+02:00");
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);

async function openWorkshop(page: Page) {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  await page.getByTestId("nav-workshop").click();
  await expect(page.getByRole("heading", { name: "Майстерня слабких місць", level: 1 })).toBeVisible();
}
/** One full grammar mission with a deliberately wrong first answer and a wrong repair; returns to the workshop. */
async function wrongMission(page: Page) {
  await expect(page.getByRole("heading", { name: "Твоя відповідь" })).toBeVisible();
  await expect(page.locator(".eyebrow")).toContainText("Майстерня слабких місць");
  await page.getByLabel("Впиши пропущену форму фінською").fill("väärin");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByRole("heading", { name: "Спробуй виправити сам(а)" })).toBeVisible();
  await page.getByLabel("Впиши пропущену форму фінською").fill("väärin taas");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await page.getByRole("button", { name: "Далі: нова ситуація" }).click();
  await page.getByLabel(/Твоє власне речення/).fill("Menen kotiin.");
  await page.getByRole("button", { name: "Зберегти місію" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();
  await expect(page.locator("main .btn:not(.secondary):visible")).toHaveCount(1);          // one primary action
  await page.getByRole("button", { name: "До майстерні слабких місць" }).click();
  await expect(page.getByRole("heading", { name: "Майстерня слабких місць", level: 1 })).toBeVisible();
}

test("workshop: two wrong FIRST answers make a family a weak spot; the set mixes NEW tasks of confusable forms; a delayed check comes after 7 days", async ({ page }) => {
  await page.clock.install({ time: T0 });
  await openWorkshop(page);
  await expect(page.getByText(/Ще немає твоїх відповідей у граматичних місіях/)).toBeVisible();
  await expect(page.locator(".workshop-family")).toHaveCount(5);
  await expect(page.locator(".workshop-family[data-bottleneck=yes]")).toHaveCount(0);
  expect(await serious(page)).toEqual([]);

  const location = page.locator(".workshop-family[data-family=location]");
  await expect(location).toContainText("inessiivi → elatiivi → illatiivi → adessiivi → allatiivi");   // interleaved, not blocked
  await page.getByTestId("workshop-location").click();
  await wrongMission(page);
  await expect(location).toHaveAttribute("data-bottleneck", "no");                           // one wrong answer is not a pattern
  await expect(location).toContainText("Твоїх перших відповідей тут: 1, з них неправильних: 1.");
  await page.getByTestId("workshop-location").click();
  await wrongMission(page);

  await expect(location).toHaveAttribute("data-bottleneck", "yes");
  await expect(location.locator(".workshop-flag")).toContainText("Твоє слабке місце — перша відповідь неправильна у 2 різних завданнях");
  await expect(page.locator(".workshop-family").first()).toHaveAttribute("data-family", "location");   // weak spots first
  await expect(location).toContainText("Перевірка на новому завданні — з 10.11.2026");
  await expect(location).not.toContainText("inessiivi → elatiivi →");                      // seen tasks never come back in the set
  expect(await page.locator("main").innerText()).not.toMatch(/рівень \d|\d\s*%|опанован|mastered/i);   // no level, percentage or mastery claim
  expect(await serious(page)).toEqual([]);
  await page.goto("./");
  await expect(page.getByTestId("nav-workshop")).toContainText("слабких місць: 1");

  // Seven days later the next new task is a delayed check; its first answer is reported as delayed evidence.
  await page.clock.setFixedTime(DAY7);
  await openWorkshop(page);
  await expect(location.getByRole("status")).toContainText("Сьогодні — відкладена перевірка");
  await page.getByRole("button", { name: "Пройти перевірку на новому завданні" }).click();
  await wrongMission(page);
  await expect(location.getByRole("list", { name: "Відкладені перевірки" })).toContainText("Через 7 дн. на новому завданні");
  await expect(location.getByRole("list", { name: "Відкладені перевірки" })).toContainText("ще не так");
});

test("workshop never appears in the exam, and a normal mission keeps its own LEARN label", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".today")).toBeVisible();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.locator(".workshop, [data-testid=nav-workshop]")).toHaveCount(0);
  await page.locator(".brand").click();
  await expect(page.locator(".today")).toBeVisible();
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.locator(".eyebrow")).toContainText("Навчання · граматика в контексті");
});
