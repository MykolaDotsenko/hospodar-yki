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

test("graduated task sequencing in a dialogue: after the dialogue is saved, the own role-play again with one more move per step; ungraded self-check, stoppable", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-speaking").click();
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
  for (let i = 0; i < 4; i++) {
    if (i > 0) { await page.getByRole("button", { name: "Далі" }).click(); await page.getByRole("button", { name: "Далі" }).click(); }
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Miksi Oksana tuli/).fill("Hän haluaa puhua suomea.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Pitääkö ryhmään/).fill("Ei tarvitse.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, olen Oksana. Voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("button", { name: /Ускладнити/ })).toHaveCount(0);          // only after the dialogue is saved
  await page.getByLabel(/Що ти скажеш тепер/).fill("Anteeksi, minulla on kiire. Voimmeko jatkaa myöhemmin?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();

  await page.getByRole("button", { name: "Ускладнити (за бажанням)" }).click();
  const constraints = page.getByTestId("stepup-constraints").locator("li");
  await expect(constraints.first()).toContainText("причину");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Hei, olen Oksana. Puhuisitko hitaammin, koska olen vasta aloittanut suomen.");
  await page.getByLabel("Частково").check();
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("heading", { name: "Ускладнення 2 з 3" })).toBeVisible();
  await expect(constraints.nth(1)).toContainText("Запитай партнера");
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Досить на сьогодні" }).click();
  await expect(page.getByTestId("stepup-done")).toContainText("Ускладнень пройдено: 1 з 3");
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("3 без оцінки");
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

test("pre-task planning before the role-play: optional own plan with a repair move, hidden while replying, back after the reply", async ({ page }) => {
  const PLAN = "tavoite: esittäytyä; sanat: uusi, harjoitella; jos ei ymmärrä: puhu hitaammin";
  await page.goto("./");
  await page.getByTestId("nav-speaking").click();
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
  await page.getByLabel(/Твоя репліка фінською/).fill("Hei! Olen uusi täällä.");
  await page.getByRole("button", { name: "Сказати" }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Далі" }).click();
    await page.getByRole("button", { name: "Далі" }).click();
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Miksi Oksana tuli/).fill("Hän haluaa puhua suomea.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Pitääkö ryhmään/).fill("Ei tarvitse.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await expect(page.getByRole("heading", { name: "Твоя ситуація" })).toBeVisible();

  await page.getByRole("button", { name: "Спершу скласти план (за бажанням)" }).click();
  await expect(page.locator(".plan-frame li")).toHaveCount(3);
  await expect(page.locator(".plan-frame")).toContainText("якщо тебе не зрозуміють");
  await expect(page.getByLabel(/Твої репліки фінською/)).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.getByLabel(/Твій план/).fill(PLAN);
  await page.getByRole("button", { name: "План готовий — говорити" }).click();
  await expect(page.getByTestId("dialogue-plan-hidden")).toBeVisible();                      // speak from memory
  await expect(page.getByText(PLAN)).toHaveCount(0);
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, olen Oksana. Voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("heading", { name: "Умова змінилася" })).toBeVisible();
  await expect(page.getByTestId("dialogue-plan")).toContainText(PLAN);                       // back for self-comparison
  await expect(page.getByRole("button", { name: /скласти план/ })).toHaveCount(0);          // offered once, before the first reply
});

test("interlocutor ladder after a dialogue (pragmatic-speech-acts): the own role-play for a friend, a neighbour and an official; separate self-checks; replies side by side; ungraded", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-speaking").click();
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
  for (let i = 0; i < 4; i++) {
    if (i > 0) { await page.getByRole("button", { name: "Далі" }).click(); await page.getByRole("button", { name: "Далі" }).click(); }
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Miksi Oksana tuli/).fill("Hän haluaa puhua suomea.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Pitääkö ryhmään/).fill("Ei tarvitse.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, olen Oksana. Voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("button", { name: /Різні співрозмовники/ })).toHaveCount(0);   // only after the dialogue is saved
  await page.getByLabel(/Що ти скажеш тепер/).fill("Anteeksi, minulla on kiire. Voimmeko jatkaa myöhemmin?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();

  await page.getByRole("button", { name: "Різні співрозмовники (за бажанням)" }).click();
  await expect(page.getByRole("heading", { name: "Співрозмовник 1 з 3: Друг або подруга" })).toBeVisible();
  const reply = page.getByLabel(/Твоя відповідь фінською для цієї людини/);
  await reply.fill("Moi! Puhutko vähän hitaammin?");
  await page.getByLabel("Звертаєшся на «sinä»?").check();
  await page.getByRole("button", { name: "Зберегти й далі" }).click();
  await reply.fill("Hei! Anteeksi, voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Зберегти й далі" }).click();
  await reply.fill("Hyvää päivää. Voisitteko puhua hieman hitaammin? Kiitos.");
  await page.getByLabel(/Ввічлива форма/).check();
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "Зберегти й далі" }).click();
  const compare = page.getByTestId("register-compare");
  await expect(compare.locator("dd[lang=fi]")).toHaveCount(3);
  await expect(compare.getByRole("status")).toContainText("Збережено без оцінки: 3 з 3");
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("5 без оцінки");
});

/** Finishes «Ensimmäinen kerta kielikahvilassa» through to the saved summary (skip-to-script path). */
async function finishCafeDialogue(page: import("@playwright/test").Page) {
  await page.goto("./");
  await page.getByTestId("nav-speaking").click();
  await page.getByRole("button", { name: /Ensimmäinen kerta kielikahvilassa/ }).click();
  for (let i = 0; i < 4; i++) {
    if (i > 0) { await page.getByRole("button", { name: "Далі" }).click(); await page.getByRole("button", { name: "Далі" }).click(); }
    await page.getByRole("button", { name: "Пропустити й подивитися сценарій" }).click();
  }
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Miksi Oksana tuli/).fill("Hän haluaa puhua suomea.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Pitääkö ryhmään/).fill("Ei tarvitse.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByLabel(/Твої репліки фінською/).fill("Hei, olen Oksana. Voisitko puhua vähän hitaammin?");
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByLabel(/Що ти скажеш тепер/).fill("Anteeksi, minulla on kiire. Voimmeko jatkaa myöhemmin?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Збережено на цьому пристрої без оцінки/)).toBeVisible();
}

test("mediation after a dialogue (cefr-mediation-paraphrase): tell a friend who was not there, in Ukrainian, what was agreed; dialogue checks; the conversation on request; ungraded reading", async ({ page }) => {
  await finishCafeDialogue(page);
  const med = page.locator("section", { has: page.getByRole("heading", { name: "Розкажи комусь, про що була розмова" }) });
  await med.getByRole("button", { name: "Українською — другові, якого там не було" }).click();
  await expect(med.getByLabel("Хто з ким говорив і навіщо?")).toBeVisible();
  await expect(med.getByLabel("Про що домовилися?")).toBeVisible();
  await expect(med.locator(".transcript")).toBeHidden();                                 // the conversation only on request
  await med.locator("summary").click();
  await expect(med.locator(".transcript")).toContainText("Oksana");
  await med.getByRole("button", { name: "Зберегти пояснення" }).click();
  await expect(med.getByRole("alert")).toContainText("Спершу напиши");
  await med.getByLabel("Твоя розповідь українською").fill("Оксана вперше прийшла в мовне кафе і попросила говорити повільніше.");
  await med.getByLabel("Хто з ким говорив і навіщо?").check();
  expect(await serious(page)).toEqual([]);
  await med.getByRole("button", { name: "Зберегти пояснення" }).click();
  await expect(page.getByTestId("mediation-done")).toContainText("без оцінки");
  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Читання$/ }) })).toContainText("3 без оцінки");   // 2 dialogue questions + the relay
});
