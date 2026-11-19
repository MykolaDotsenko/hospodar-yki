import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, kind: RegExp) {
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: kind }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
}
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(r.violations.filter(v => ["critical", "serious"].includes(v.impact ?? ""))).toEqual([]);
};

test("Paraphrase: frozen choice, key only after it, retell without options, verified save survives reload", async ({ page }) => {
  await open(page, /Те саме іншими словами/);
  await expect(page.getByText("Liike palvelee asiakkaita eri aikoihin ensi viikosta lähtien.")).toBeVisible();
  await expect(page.getByText(/Правильно з першої спроби|Ще не так/)).toHaveCount(0);
  await axe(page);
  await page.getByLabel("Liike on kokonaan kiinni ensi viikolla.").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Ще не так")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByText("Liike palvelee asiakkaita", { exact: false })).toHaveCount(0);
  await page.getByRole("textbox").fill("Kaupan aukioloajat ovat erilaiset ensi viikolla.");
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ensi kuussa kirjasto on auki myöhempään.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено на цьому пристрої/)).toBeVisible();
  await page.reload();
  await page.getByTestId("nav-practice").click();
  await expect(page.getByRole("button", { name: /Те саме іншими словами/ })).toContainText("пройдено 1 з 24");
});

test("Phrase card: model hidden until own answer, self-comparison required before the new situation", async ({ page }) => {
  await open(page, /Фрази для життя/);
  await expect(page.getByText("переїхати до Фінляндії")).toBeVisible();
  await expect(page.getByText("muuttaa Suomeen")).toHaveCount(0);
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("muuttaa Suomeen", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("alert")).toContainText("порівняй");
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await axe(page);
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByText("Muutin Suomeen kolme vuotta sitten.")).toHaveCount(0);
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen viime vuonna.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
});

test("Spaced retrieval: a phrase judged 'partly' returns the next day; a recalled one is never scheduled", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-11T09:00:00+02:00") });
  await open(page, /Фрази для життя/);
  await page.getByRole("textbox").fill("mennä Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Цю фразу повторимо завтра/)).toBeVisible();
  await page.getByRole("button", { name: "До списку карток" }).click();
  await expect(page.getByText(/Сьогодні на повторення/)).toHaveCount(0);      // not massed on the same day

  await page.clock.setFixedTime(new Date("2026-11-12T09:00:00+02:00"));
  await page.reload();
  await expect(page.getByTestId("nav-practice").filter({ hasText: "повторити 1" })).toBeVisible();
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: "Повторити" }).click();
  await expect(page.getByText("Повторення: згадай без зразка.")).toBeVisible();
  await expect(page.getByText("muuttaa Suomeen")).toHaveCount(0);
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Haluan muuttaa Suomeen ensi vuonna.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Наступне повторення — через довший проміжок/)).toBeVisible();
  await page.getByRole("button", { name: "До списку карток" }).click();
  await expect(page.getByText(/Сьогодні на повторення/)).toHaveCount(0);
});

test("own memory cue (keyword-mnemonic-retrieval): offered only for a phrase judged not yet known, kept with it, on the next review shown only on request", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-11T09:00:00+02:00") });
  await open(page, /Фрази для життя/);
  await page.getByRole("textbox").fill("mennä Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByLabel(/Своя зачіпка для пам'яті/)).toHaveCount(0);            // not before the own judgement
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await expect(page.getByLabel(/Своя зачіпка для пам'яті/)).toHaveCount(0);            // a phrase already known gets no mnemonic
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByLabel(/Своя зачіпка для пам'яті/).fill("муттаа — мітла мете мене до Суомі");
  await axe(page);
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ystäväni muutti Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Твою зачіпку збережено разом із фразою/)).toBeVisible();

  await page.clock.setFixedTime(new Date("2026-11-12T09:00:00+02:00"));
  await page.reload();
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: "Повторити" }).click();
  await expect(page.getByText("Повторення: згадай без зразка.")).toBeVisible();
  await expect(page.getByText(/мітла мете/)).toHaveCount(0);                          // hidden until the learner asks
  await page.getByRole("textbox").fill("muuttaa");
  await page.getByRole("button", { name: "Показати мою зачіпку (за бажанням)" }).click();
  await expect(page.getByTestId("own-cue")).toContainText("муттаа — мітла мете мене до Суомі");
  await expect(page.getByRole("textbox")).toHaveValue("muuttaa");                     // opening the cue keeps the own answer
  await expect(page.getByText("muuttaa Suomeen")).toHaveCount(0);                     // the cue is not the key
  await axe(page);
  await page.getByRole("textbox").fill("muuttaa Suomeen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByLabel(/Своя зачіпка для пам'яті/)).toHaveValue("муттаа — мітла мете мене до Суомі");
  await page.getByRole("button", { name: "Те саме за змістом" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Haluan muuttaa Suomeen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Наступне повторення — через довший проміжок/)).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%|рівень|бал:/);
});

test("pre-task planning (opinion): optional own plan as an argument map (learner-concept-map), hidden while answering, back only next to the model as the map; quick reactions get no plan", async ({ page }) => {
  await open(page, /Моя думка/);
  await expect(page.locator(".threshold-route [aria-current=step]")).toContainText("План і відповідь");
  await page.getByRole("button", { name: "Скласти план (за бажанням)" }).click();
  await expect(page.locator(".plan-frame li")).toHaveCount(3);
  await expect(page.getByText(/Фрази для структури/)).toHaveCount(0);                  // no scaffold while planning
  await axe(page);
  await page.getByLabel("Моя думка").fill("pääajatus: hyvä");
  await page.getByLabel("Причина 1").fill("aikaa");
  await page.getByLabel("Висновок").fill("siksi kyllä");
  await page.getByRole("button", { name: "План готовий — відповідати" }).click();
  await expect(page.getByRole("status")).toContainText("План сховано");
  await expect(page.getByText("pääajatus: hyvä", { exact: false })).toHaveCount(0);   // out of sight while answering
  await expect(page.getByRole("button", { name: "Скласти план (за бажанням)" })).toHaveCount(0);
  await page.getByLabel(/Скажи вголос/).fill("Minusta se on hyvä, koska säästän aikaa.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.locator(".plan-back")).toContainText("pääajatus: hyvä");           // back for self-comparison
  await expect(page.getByTestId("argument-map").locator("li")).toHaveText(["Моя думка: pääajatus: hyvä", "↓ Причина 1: aikaa", "↓ Висновок: siksi kyllä"]);   // drawn as the map, empty nodes left out
  await expect(page.getByText(/Фрази для структури/)).toBeVisible();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.locator(".plan-back")).toHaveCount(0);                              // not in the new situation
  await page.getByRole("textbox").fill("Kirjoitan lyhyesti mielipiteeni.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();

  await page.getByRole("button", { name: "До списку карток" }).click();
  await page.getByRole("button", { name: "Інші види практики" }).click();
  await page.getByRole("button", { name: /Реакція в ситуації/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await expect(page.getByRole("button", { name: "Скласти план (за бажанням)" })).toHaveCount(0);
});

test("graduated task sequencing: after a saved reaction card, the same situation again with one more constraint per step; ungraded self-check; stoppable", async ({ page }) => {
  await open(page, /Реакція в ситуації/);
  await page.getByRole("textbox").fill("Anteeksi, voisitteko auttaa?");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("button", { name: /Ускладнити/ })).toHaveCount(0);            // only after the card is saved
  await page.getByRole("textbox").fill("Hei, voisitko auttaa minua hetken?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();

  await page.getByRole("button", { name: "Ускладнити (за бажанням)" }).click();
  const constraints = page.getByTestId("stepup-constraints").locator("li");
  await expect(constraints).toHaveCount(1);
  await expect(constraints.first()).toContainText("Коротко");
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Voisitko auttaa?");
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("alert")).toContainText("Познач");                              // self-check required, never auto-graded
  await page.getByLabel("Так").check();
  await axe(page);
  await page.getByRole("button", { name: "Зберегти крок" }).click();

  await expect(page.getByRole("heading", { name: "Ускладнення 2 з 3" })).toBeVisible();
  await expect(constraints).toHaveCount(2);                                                   // the earlier constraint stays
  await expect(constraints.nth(1)).toContainText("нова умова");
  await page.getByLabel(/Твоя відповідь фінською/).fill("Anteeksi, voisitteko auttaa minua?");
  await page.getByLabel("Частково").check();
  await page.getByRole("button", { name: "Зберегти крок" }).click();
  await expect(page.getByRole("heading", { name: "Ускладнення 3 з 3" })).toBeVisible();
  await page.getByRole("button", { name: "Досить на сьогодні" }).click();
  await expect(page.getByTestId("stepup-done")).toContainText("Ускладнень пройдено: 2 з 3");
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%|рівень|бал/);

  await page.goto("./");
  await page.getByRole("button", { name: "Мій прогрес" }).click();
  await expect(page.locator(".skill-lines li").filter({ has: page.locator("strong", { hasText: /^Говоріння$/ }) })).toContainText("без оцінки");
});

test("interlocutor change (pragmatic-speech-acts): after a saved reaction card, the same situation for a friend, a neighbour and an official; separate appropriateness self-check; own replies side by side; ungraded", async ({ page }) => {
  await open(page, /Реакція в ситуації/);
  await page.getByRole("textbox").fill("Anteeksi, voisitteko auttaa?");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("button", { name: /Різні співрозмовники/ })).toHaveCount(0);   // only after the card is saved
  await page.getByRole("textbox").fill("Hei, voisitko auttaa minua hetken?");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();

  await page.getByRole("button", { name: "Різні співрозмовники (за бажанням)" }).click();
  await expect(page.getByRole("heading", { name: "Співрозмовник 1 з 3: Друг або подруга" })).toBeVisible();
  await expect(page.getByText(/багато хто й в установах звертається на «sinä»/)).toBeVisible();   // no invented register rule
  await expect(page.getByTestId("register-cue")).toContainText("другові");
  await page.getByRole("button", { name: "Зберегти й далі" }).click();
  await expect(page.getByRole("alert")).toContainText("Спершу напиши");
  const reply = page.getByLabel(/Твоя відповідь фінською для цієї людини/);
  await reply.fill("Moi, autatko mua vähän?");
  await page.getByLabel("Звертаєшся на «sinä»?").check();
  await page.getByLabel("Коротко, без офіційних формул?").check();
  await axe(page);
  await page.getByRole("button", { name: "Зберегти й далі" }).click();

  await expect(page.getByRole("heading", { name: /Співрозмовник 2 з 3: Сусід/ })).toBeVisible();
  await expect(reply).toHaveValue("");
  await reply.fill("Hei! Voisitko auttaa minua hetken? Minulla on painava laatikko.");
  await page.getByRole("button", { name: "Зберегти й далі" }).click();
  await expect(page.getByRole("heading", { name: /Співрозмовник 3 з 3: Службовець/ })).toBeVisible();
  await reply.fill("Hyvää päivää. Voisitteko auttaa minua lomakkeen kanssa? Kiitos.");
  await page.getByLabel(/Ввічлива форма/).check();
  await page.getByRole("button", { name: "Зберегти й далі" }).click();

  const compare = page.getByTestId("register-compare");
  await expect(compare).toContainText("Moi, autatko mua vähän?");
  await expect(compare).toContainText("Hyvää päivää. Voisitteko auttaa");
  await expect(compare.locator("dd[lang=fi]")).toHaveCount(3);
  await expect(compare.getByRole("status")).toContainText("Збережено без оцінки: 3 з 3");
  expect(await page.locator("main").innerText()).not.toMatch(/\d\s*%|рівень|бал/);
  await axe(page);

  const saved = await page.evaluate(() => new Promise<string[]>((done, fail) => {
    const req = indexedDB.open("hospodar-yki:web:v1");
    req.onerror = () => fail(req.error);
    req.onsuccess = () => {
      const get = req.result.transaction("learner").objectStore("learner").get("current");
      get.onsuccess = () => { req.result.close(); done(((get.result?.state?.diagnostics ?? []) as { taskId: string; status: string; response?: string }[])
        .filter(d => d.taskId.includes("-register-")).map(d => `${d.taskId.replace(/^.*-register-/, "")}:${d.status}:${/self-check (\d)\/3/.exec(d.response ?? "")?.[1]}`)); };
    };
  }));
  expect(saved).toEqual(["friend:ungraded:2", "neighbour:ungraded:0", "official:ungraded:1"]);
});

test("repeated telling 4/3/2 after an opinion card: three rounds aloud with shrinking practice time, nothing recorded, only the learner's report saved", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-13T09:00:00+02:00") });
  await open(page, /Моя думка/);
  await page.getByRole("textbox").fill("Mielestäni etätyö on hyvä, koska säästän aikaa.");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Minusta kirjasto on tärkeä, koska siellä voi opiskella rauhassa.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Розповісти тричі, щоразу коротше/ })).toBeVisible();
  await axe(page);

  await page.clock.pauseAt(new Date("2026-11-13T09:10:00+02:00"));
  await page.getByRole("button", { name: "Почати перший раунд" }).click();
  await expect(page.getByTestId("fluency-timer")).toContainText("2:00");
  await page.clock.runFor(120_500);
  await expect(page.getByTestId("fluency-timer")).toHaveCount(0);
  await page.getByRole("button", { name: "Наступний раунд (90 с)" }).click();
  await expect(page.getByTestId("fluency-timer")).toContainText("1:30");
  await page.getByRole("button", { name: "Я закінчив(ла) раніше" }).click();
  await page.getByRole("button", { name: "Наступний раунд (60 с)" }).click();
  await expect(page.getByTestId("fluency-timer")).toContainText("1:00");
  await page.clock.runFor(60_500);
  await page.getByRole("button", { name: "Зберегти" }).last().click();
  await expect(page.getByRole("alert")).toContainText("Познач");
  await page.getByLabel("Легше").check();
  await page.getByRole("button", { name: "Зберегти" }).last().click();
  await expect(page.getByTestId("fluency-done")).toContainText("Мовлення не записувалося");
});

test("corpus form card (CURATED-09): write the form, then the source form, the whole sentence and the CC BY attribution; self-compared, never scored", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Форма слова в реченні/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await expect(page.getByText(/muutti ___\. \(mieli\)/)).toBeVisible();
  await expect(page.getByText("mielensä")).toHaveCount(0);                                         // the form is not shown before the attempt
  await page.getByRole("textbox").fill("mielen");
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("mielensä", { exact: true })).toBeVisible();
  await expect(page.getByText(/UD Finnish FTB.*CC BY 4\.0.*адаптовано/)).toBeVisible();
  await expect(page.getByText(/інша природна форма теж може бути правильною/)).toBeVisible();
  await expect(page.getByText(/Правильно|Неправильно/)).toHaveCount(0);                           // never a score
  await page.getByRole("button", { name: "Частково" }).click();
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Muutin mieleni eilen.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
});

test("clock card (CURATED-09): choose the time first; the clock face that shows the answer appears only after; then an own sentence", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Час дієслова й годинник/ }).click();
  await page.getByRole("button", { name: /^Картка 9 .*Годинник і час/ }).click();                    // the first clock card, after 8 tense cards
  await expect(page.getByText("Kello on puoli neljä. Mikä aika on?")).toBeVisible();
  await expect(page.locator(".practice-figure")).toHaveCount(0);                               // the picture shows the answer: not yet
  await page.getByLabel("15:30").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText(/Правильно з першої спроби/)).toBeVisible();
  await expect(page.getByRole("img", { name: /15:30/ })).toBeVisible();
  await expect(page.locator(".practice-figure figcaption")).toContainText(/\S/);              // credit and licence
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Työpäiväni alkaa kello kahdeksan.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено/)).toBeVisible();
});

test("rektio interleaving (interleaving-grammar): after a finished rektio card the next card asks for a different case", async ({ page }) => {
  await open(page, /Керування дієслів/);
  const caseOf = async () => {                                                            // the pattern is revealed after the answer
    await page.getByRole("textbox").fill("Ajattelen sinua.");
    await page.getByRole("button", { name: "Відповісти" }).click();
    const value = await page.locator("dt", { hasText: "Відмінок / модель" }).locator("xpath=following-sibling::dd[1]").innerText();
    await page.getByRole("button", { name: "Інакше" }).click();
    await page.getByRole("button", { name: "Далі" }).click();
    await page.getByRole("textbox").fill("Uusi lause.");
    await page.getByRole("button", { name: "Зберегти й завершити" }).click();
    await expect(page.getByText(/Картку збережено/)).toBeVisible();
    return value.trim();
  };
  const first = await caseOf();
  await page.getByRole("button", { name: "Наступна картка" }).click();
  const second = await caseOf();
  expect(second).not.toBe(first);                                                         // a different case, not a block of one case
  await axe(page);
});

test("pause and resume (COG-11): an unfinished card survives a reload at the same step; the first answer stays frozen; a finished card leaves no draft; LEARN erase removes drafts", async ({ page }) => {
  await open(page, /Те саме іншими словами/);
  await page.getByLabel("Liike on kokonaan kiinni ensi viikolla.").check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await expect(page.getByText("Ще не так")).toBeVisible();                                         // the key is now seen
  await page.reload();
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Те саме іншими словами/ }).click();
  await expect(page.getByRole("button", { name: /^Картка 1 / })).toContainText("незавершена — продовжиться з того самого місця");
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await expect(page.getByTestId("practice-restored")).toContainText("перша відповідь лишилася такою, як була");
  await expect(page.getByText("Ще не так")).toBeVisible();                                         // same step, same frozen answer
  await expect(page.getByRole("radio")).toHaveCount(0);                                            // no second "first" answer
  await axe(page);
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Kaupan aukioloajat muuttuvat");                            // typing is kept too
  await page.reload();
  await page.getByTestId("nav-practice").click();
  await page.getByRole("button", { name: /Те саме іншими словами/ }).click();
  await page.getByRole("button", { name: /^Картка 1 / }).click();
  await expect(page.getByRole("textbox")).toHaveValue("Kaupan aukioloajat muuttuvat");
  await page.getByRole("button", { name: "Далі" }).click();
  await page.getByRole("textbox").fill("Ensi kuussa kirjasto on auki myöhempään.");
  await page.getByRole("button", { name: "Зберегти й завершити" }).click();
  await expect(page.getByText(/Картку збережено на цьому пристрої/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("hospodar-yki:web:practice-drafts:v1"))).toBeNull();   // finished: no draft left

  await page.getByRole("button", { name: "До списку карток" }).click();
  await page.getByRole("button", { name: /^Картка 2 / }).click();
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole("button", { name: "Відповісти" }).click();
  await page.goto("./");
  await page.getByRole("button", { name: /Мої дані: копія й видалення/ }).click();
  await expect(page.getByRole("list", { name: "Збережені дані" })).toContainText("незавершених практичних карток 1");
  await page.getByLabel(/Увесь прогрес навчання/).check();
  await page.getByLabel(/Щоб підтвердити/).fill("ВИДАЛИТИ");
  await page.getByRole("button", { name: "Видалити прогрес навчання" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("hospodar-yki:web:practice-drafts:v1"))).toBeNull();
});
