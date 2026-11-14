import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openLearn } from "./helpers.ts";

/** «Моє господарство» — the name made visible, with game elements only where research allows (R08-MOT, GAM-01, UIO-09). */
test("Господарство: nine places, never locked; a door opens after the first own attempt and a key only for a correct first independent answer", async ({ page }) => {
  await page.goto("./");
  const tiles = page.locator(".estate-grid .place-tile");
  await expect(tiles).toHaveCount(9);
  await expect(page.locator(".place-tile[data-door=open]")).toHaveCount(0);        // nothing tried yet
  for (const t of await tiles.all()) await expect(t).toBeEnabled();                 // MOT-04: nothing is locked
  await expect(page.locator(".estate-count")).toContainText("Відчинено дверей: 0 з 9 · ключів: 0");

  await page.getByTestId("place-identity").click();
  await expect(page.getByRole("heading", { name: "Я і моє життя" })).toBeVisible();
  await expect(page.getByTestId("place-door")).toContainText("ще зачинені");
  await expect(page.getByText(/Застосунок цього не відстежує/)).toBeVisible();      // MOT-03: real-life deed is never tracked
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations
    .filter(v => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);

  // A place opens its real mission directly: the reading text of this life situation.
  await page.getByRole("button", { name: /Читання · Kirjaston kielikahvila/ }).click();
  await expect(page.getByRole("heading", { name: "Прочитай і відповідай" })).toBeVisible();
  await page.getByLabel("Ei tarvitse").check();                                     // correct first answer
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel("Oikein").check();                                          // wrong first answer
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByLabel(/Mitä tehdään tapaamisen alussa/).fill("He tutustuvat toisiinsa.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі: написати" }).click();
  await page.getByLabel(/Твій текст фінською/).fill("Hei! Haluaisin tulla kielikahvilaan keskiviikkona.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої/)).toBeVisible();

  await page.goto("./");
  const identity = page.getByTestId("place-identity");
  await expect(identity).toHaveAttribute("data-door", "open");
  await expect(identity).toContainText("ключів: 1 · спроб фінською: 2");           // 1 correct first answer; open answer + text = practice
  await expect(page.locator(".estate-count")).toContainText("Відчинено дверей: 1 з 9 · ключів: 1");
  await identity.click();
  await expect(page.getByTestId("place-door")).toContainText("відчинені");
  await expect(page.getByTestId("place-keys")).toContainText("1");
  // No streak, XP, level, rank or percentage anywhere in the game layer (MOT-05/06, UX-05).
  expect(await page.locator("main").innerText()).not.toMatch(/стрік|\bXP\b|рівень \d|рейтинг|\d\s*%/i);

  // EXAM never shows the game layer (MOT-01/15).
  await page.getByRole("button", { name: "На головну" }).click();
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.locator(".estate, .place-tile, .place-glyph")).toHaveCount(0);
});

test("Господар persona: guides on home and place screens only — never while answering, in feedback or in EXAM; hide and calm mode remove him", async ({ page }) => {
  await page.goto("./");
  const guide = page.locator("figure.hospodar");
  await expect(guide).toHaveCount(1);
  await expect(guide.locator("figcaption")).toContainText("Я Господар");                // first visit greeting, real text
  await expect(guide.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await page.getByTestId("place-housing").click();
  await expect(guide).toContainText("Ці двері чекають на твою першу спробу");

  // Inside a task: answer step and feedback — no persona (COG-07, IV-14).
  await page.getByRole("button", { name: /Діалог · / }).click();
  await expect(guide).toHaveCount(0);
  await page.goto("./");
  await openLearn(page);
  await expect(guide).toHaveCount(0);
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(guide).toHaveCount(0);

  // EXAM: never (MOT-15, UIO-10).
  await page.goto("./");
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(guide).toHaveCount(0);

  // One click hides him, and it persists; calm mode hides him too.
  await page.goto("./");
  await page.getByLabel("Показувати Господаря").uncheck();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(guide).toHaveCount(0);
  await page.getByLabel("Показувати Господаря").check();
  await expect(guide).toHaveCount(1);
  await page.getByRole("button", { name: "Спокійний режим" }).click();
  await expect(guide).toHaveCount(0);
});
