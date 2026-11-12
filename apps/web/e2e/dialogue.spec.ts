import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze())
  .violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => v.id);
const A1 = "Hei! Onko tässä kielikahvila?";

test("IV-REQ-07 dialogue: learner replies first as speaker A; script line only after; answer before model; evidence cue after attempt; saved ungraded", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-speaking").click();
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
  await expect(page.getByText(A1)).toHaveCount(0);
  await expect(page.getByText("Kyllä on, tervetuloa!")).toHaveCount(0);
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  await page.getByLabel(/Твоя репліка фінською/).fill("Hei! Olen uusi täällä.");
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByText("Olen uusi täällä.")).toBeVisible();
  await expect(page.getByText(A1)).toBeVisible();
  expect(await serious(page)).toEqual([]);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Далі" }).click();                       // to the interlocutor line
    await page.getByRole("button", { name: "Далі" }).click();                       // to the learner's turn
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByText("Tavallisista asioista")).toBeVisible();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("heading", { name: "Що ти зрозумів(ла)?" })).toBeVisible();
  await expect(page.locator(".learning-cue")).toHaveCount(0);
  await expect(page.getByText("Hän haluaa harjoitella puhumista.")).toHaveCount(0);
  await page.getByLabel(/Miksi Oksana tuli/).fill("Hän haluaa puhua suomea.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Hän haluaa harjoitella puhumista.")).toBeVisible();
  await expect(page.locator(".learning-cue")).toContainText("Haluaisin harjoitella puhumista");
  await expect(page.getByText("← тут це сказано")).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Pitääkö ryhmään/).fill("Ei tarvitse.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await expect(page.getByRole("heading", { name: "Твоя ситуація" })).toBeVisible();
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, olen Oksana. Voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("heading", { name: "Умова змінилася" })).toBeVisible();
  await page.getByLabel(/Що ти скажеш тепер/).fill("Anteeksi, minulla on kiire. Voimmeko jatkaa myöhemmin?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("2 без оцінки");
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Читання$/ }) })).toContainText("2 без оцінки");
});

test("Negotiation: partner asks to clarify → second wording before the script → confirm; reload keeps it; condition changes only after own role-play", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-speaking").click();
  await page.getByRole("button", { name: /Soitto huoltoyhtiöön/ }).click();
  await page.getByLabel(/Твоя репліка фінською/).fill("Hei, ikkunasta tulee kylmää ilmaa.");
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByText(/Співрозмовник не зрозумів/)).toHaveCount(0);                 // no clarification at the first turn
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Твоя репліка фінською/).fill("Viime viikolla.");
  await page.getByRole("button", { name: "Сказати" }).click();
  await expect(page.getByText("Anteeksi, en saanut selvää. Voisitko toistaa hitaammin ja lyhyemmin?")).toBeVisible();
  await expect(page.getByText("Huomasin sen viime viikolla, kun ulkona kylmeni.")).toHaveCount(0);   // script hidden until the second wording
  await expect(page.getByRole("button", { name: "Далі" })).toHaveCount(0);
  await page.getByRole("button", { name: "Сказати інакше" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  expect(await serious(page)).toEqual([]);
  await page.getByLabel(/іншими словами або простіше/).fill("Huomasin ongelman seitsemän päivää sitten.");
  await page.getByRole("button", { name: "Сказати інакше" }).click();
  await expect(page.getByText("Huomasin sen viime viikolla, kun ulkona kylmeni.")).toBeVisible();
  await expect(page.getByText(/Твій другий варіант передає той самий зміст/)).toBeVisible();

  await page.getByRole("button", { name: "Зберегти та вийти" }).click();                     // durable: reload cannot skip the confirmation
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  await page.reload();
  await page.getByTestId("nav-speaking").click();
  await expect(page.getByText(/Незавершений діалог відновлено/)).toBeVisible();
  await expect(page.getByText("Huomasin ongelman seitsemän päivää sitten.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Далі" })).toHaveCount(0);
  await page.getByRole("button", { name: "Частково" }).click();

  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Далі" }).click();
    await page.getByRole("button", { name: "Далі" }).click();
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  for (const q of [/Mikä asunnossa on vialla/, /Milloin käynti lopulta sovittiin/]) {
    await page.getByLabel(q).fill("Vastaus.");
    await page.getByRole("button", { name: "Відповісти" }).click();
    await page.getByRole("button", { name: "Те саме за змістом" }).click();
  }
  await expect(page.getByRole("heading", { name: "Твоя ситуація" })).toBeVisible();
  await expect(page.getByText(/Tilanne muuttuu/)).toHaveCount(0);                             // change is hidden before own role-play
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, korjaaja ei tullut eilen. Milloin hän tulee?");
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("heading", { name: "Умова змінилася" })).toBeVisible();
  await expect(page.getByText(/Tilanne muuttuu: toinen ehdottaa aikaa tai ratkaisua, joka ei sovi sinulle/)).toBeVisible();
  await expect(page.getByText("Hei, korjaaja ei tullut eilen. Milloin hän tulee?")).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await page.getByLabel(/Що ти скажеш тепер/).fill("Valitettavasti se ei sovi, olen töissä. Kävisikö perjantai?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/повторення іншими словами, твій план розмови і відповідь на змінену умову/)).toBeVisible();
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("3 без оцінки");
});
