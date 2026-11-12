import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Design research conformance, checked on the RENDERED app — every screen, not a sample.
 * R10-01/03/05/07/14/16, DESIGN-05/14, SD-G04/G08, A11Y-04, R7-08/12, IV-AC-11, IV2-AC-11,
 * COG-05/07/12, MOT-03/05, AC-25/43. These are guarded rules, not measured learning effects;
 * screen readers and real devices still need a person (R10-17).
 */
type Screen = { name: string; open: (p: Page) => Promise<void> };
const nav = (id: string, then?: (p: Page) => Promise<void>) => async (p: Page) => {
  await p.getByTestId(`nav-${id}`).click();
  if (then) await then(p);
};
const firstChoice = async (p: Page) => { await p.locator(".choice").first().click(); };
const link = (name: string) => async (p: Page) => { await p.getByRole("button", { name }).click(); };

const SCREENS: Screen[] = [
  { name: "home", open: async () => {} },
  { name: "cloze mission", open: async p => { await p.getByRole("button", { name: /Навчання/ }).click(); } },
  { name: "reading list", open: nav("reading") },
  { name: "reading item", open: nav("reading", firstChoice) },
  { name: "listening item", open: nav("listening", firstChoice) },
  { name: "writing item", open: nav("writing", firstChoice) },
  { name: "dialogue item", open: nav("speaking", firstChoice) },
  { name: "practice card", open: nav("practice", async p => {
    await p.getByRole("button", { name: /Те саме іншими словами/ }).click();
    await p.getByRole("button", { name: /^Картка 1 / }).click();
  }) },
  { name: "picture mission", open: nav("pictures", firstChoice) },
  { name: "media library", open: nav("media") },
  { name: "place (Моє господарство)", open: async p => { await p.getByTestId("place-housing").click(); } },
  { name: "diagnostic", open: nav("diagnostic") },
  { name: "progress", open: link("Мій прогрес") },
  { name: "my data", open: link("Мої дані: копія й видалення") },
  { name: "offline", open: link("Офлайн-доступ") },
  { name: "exam setup", open: async p => { await p.getByRole("button", { name: /Симуляція YKI/ }).click(); } },
  { name: "exam item", open: async p => {
    await p.getByRole("button", { name: /Симуляція YKI/ }).click();
    await p.getByRole("button", { name: /Aloita/ }).click();
    await expect(p.getByText("Tehtävä 1 / 9")).toBeVisible();
  } },
];

async function visit(page: Page, s: Screen) {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Що сьогодні робимо?" })).toBeVisible();
  await s.open(page);
  await page.waitForTimeout(50);
}

/** Names the innermost elements that stick out past the viewport, so a reflow failure in any engine points at its cause. */
const tooWide = (page: Page) => page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const out = (e: Element) => e.getBoundingClientRect().right > W + 0.5;
  const name = (e: Element) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : ""}`;
  const leaves = [...document.querySelectorAll("body *")].filter(e => out(e) && ![...e.children].some(out))
    .slice(0, 6).map(e => `${name(e)} right=${Math.round(e.getBoundingClientRect().right)} w=${Math.round(e.getBoundingClientRect().width)} "${(e.textContent ?? "").trim().slice(0, 40)}"`);
  const scrollers = [...document.querySelectorAll("body *")].filter(e => e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && getComputedStyle(e).overflowX === "visible")
    .slice(-4).map(e => `${name(e)} ${e.scrollWidth}/${e.clientWidth}`);
  return `[${leaves.join(" | ")}] scroll:[${scrollers.join(" | ")}]`;
});

/** Engagement theatre the research rejects (R7-08, MOT-05, COG-12, GAM): streaks, XP, standings, loss framing. */
const THEATRE = /стрік|streak|днів поспіль|\bXP\b|очки досвіду|рейтинг|лідерборд|leaderboard|бейдж|badge|нагород|медал|ти втратиш|не втрать|🔥/i;

test("R10/DESIGN-14 every screen: landmarks, lang, axe, target sizes, 320–390 px reflow and 200 % text, focus never hidden; no engagement theatre, notification prompts or tracking", async ({ page, browserName }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {                                   // MOT-03: the app must never ask to notify
    const w = window as unknown as { __notify: number; Notification?: { requestPermission?: () => Promise<string> } };
    w.__notify = 0;
    if (w.Notification) w.Notification.requestPermission = () => { w.__notify++; return Promise.resolve("denied"); };
  });
  const external: string[] = [];                                     // MOT-03: no tracking — nothing leaves this origin
  page.on("request", r => { const u = new URL(r.url()); if (!["127.0.0.1", "localhost"].includes(u.hostname) && !u.protocol.startsWith("data") && !u.protocol.startsWith("blob")) external.push(u.origin); });
  for (const s of SCREENS) {
    await test.step(s.name, async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await visit(page, s);
      // R10-01: one banner, one main, one contentinfo; skip link first; Ukrainian page, Finnish marked.
      await expect(page.locator("html")).toHaveAttribute("lang", "uk");
      await expect(page.locator("header.topbar, main#main, footer")).toHaveCount(3);
      const langs = await page.locator("main [lang]").evaluateAll(els => [...new Set(els.map(e => e.getAttribute("lang")))]);
      expect(langs.filter(l => l !== "fi" && l !== "uk"), `${s.name}: unknown lang`).toEqual([]);
      const untagged = await page.locator("main .prompt, main .reading-text, main .transcript, main textarea.answer[maxlength]")
        .evaluateAll(els => els.filter(e => e.closest("[lang]")?.getAttribute("lang") !== "fi").map(e => e.className));
      expect(untagged, `${s.name}: Finnish surface without lang=fi`).toEqual([]);
      const firstFocusable = await page.evaluate(() => document.querySelector("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")?.className);
      expect(firstFocusable, `${s.name}: skip link is the first stop`).toBe("skip");
      // WebKit does not tab to links by default (a platform setting), so the live Tab check runs in Chromium/Firefox.
      if (s.name === "home" && browserName !== "webkit") { await page.keyboard.press("Tab"); await expect(page.locator(".skip")).toBeFocused(); }

      // R10-07 / DESIGN-14: targets ≥ 24 px (WCAG 2.5.8), main actions ≥ 44 px. Inline text links are exempt.
      const small = await page.evaluate(() => {
        const out: string[] = [];
        for (const e of document.querySelectorAll<HTMLElement>("main button, main select, main input, main summary, main a[href], header button, footer select")) {
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(e).visibility === "hidden") continue;
          if (e.tagName === "A" && getComputedStyle(e).display === "inline") continue;
          const t = (e.matches("input[type=radio], input[type=checkbox]") ? e.closest("label") ?? e : e).getBoundingClientRect();
          const min = e.matches(".btn, .choice, .toggle") ? 44 : 24;
          if (t.height < min || t.width < 24) out.push(`${e.tagName}.${e.className} ${Math.round(t.width)}x${Math.round(t.height)}`);
        }
        return out;
      });
      expect(small, `${s.name}: targets too small`).toEqual([]);

      // COG-05/07/12, MOT-05, R7-08: no streaks, XP, standings or loss framing; no toast or running animation on arrival.
      expect(await page.locator("body").innerText()).not.toMatch(THEATRE);
      await expect(page.locator("[role=alert]")).toHaveCount(0);
      // Only token micro-transitions (≤ --motion-max 250 ms, finite) may run; no keyframe animation or loop.
      expect(await page.evaluate(() => document.getAnimations().filter(a => {
        const t = a.effect?.getComputedTiming();
        return a.constructor.name === "CSSAnimation" || !t || t.iterations === Infinity || Number(t.duration) > 250;
      }).length), `${s.name}: decorative animation`).toBe(0);
      expect(await page.locator("[aria-live=assertive]").count()).toBe(0);

      // DESIGN-14 / R10-18: axe WCAG 2.2 A/AA on every screen, light theme — no serious or critical violation.
      const axe = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations
        .filter(v => ["serious", "critical"].includes(v.impact ?? "")).map(v => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
      expect(axe, `${s.name}: axe`).toEqual([]);

      // R10-03 (WCAG 2.4.11): every focused control is on screen and not covered by anything else.
      const hidden: string[] = [];
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        const r = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const b = el.getBoundingClientRect();
          if (!b.width || !b.height) return `${el.tagName} has no box`;
          const x = Math.min(Math.max(b.left + b.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(b.top + b.height / 2, 0), innerHeight - 1);
          if (b.bottom < 0 || b.top > innerHeight) return `${el.tagName} off screen`;
          const hit = document.elementFromPoint(x, y);
          const label = el.closest("label");
          return hit && (el.contains(hit) || hit.contains(el) || (label && label.contains(hit))) ? "" : `${el.tagName}.${el.className} covered by ${hit?.tagName}.${(hit as HTMLElement)?.className}`;
        });
        if (r === null) break;
        if (r) hidden.push(r);
      }
      expect(hidden, `${s.name}: focus obscured`).toEqual([]);

      // R10-14: no mandatory canvas/GPU surface anywhere.
      await expect(page.locator("canvas")).toHaveCount(0);

      // R10-05/16: reflow at 390, 360 and 320 CSS px (= 400 % zoom of 1280 px), the last also with 200 % text.
      for (const width of [390, 360, 320]) {
        await page.setViewportSize({ width, height: 800 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${s.name} @ ${width}px — too wide: ${overflow > 0 ? await tooWide(page) : ""}`).toBeLessThanOrEqual(0);
      }
      const big = await page.addStyleTag({ content: "html{font-size:200%}" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${s.name} @ 320px + 200 % text — too wide: ${overflow > 0 ? await tooWide(page) : ""}`).toBeLessThanOrEqual(0);
      await big.evaluate(e => e.remove());
    });
  }
  expect(await page.evaluate(() => (window as unknown as { __notify: number }).__notify)).toBe(0);
  expect([...new Set(external)], "requests to other origins").toEqual([]);
});

test("SD-G04/R7-12 reduced motion and SD-G08 dark theme: no transition anywhere, dark palette, AA contrast on every screen", async ({ page }) => {
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  for (const s of SCREENS) {
    await test.step(s.name, async () => {
      await visit(page, s);
      const moving = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("body *")].filter(e => {
        const cs = getComputedStyle(e);
        const t = cs.transitionDuration.split(",").some(d => parseFloat(d) > 0);
        return t || cs.animationName !== "none";
      }).map(e => `${e.tagName}.${e.className}`).slice(0, 5));
      expect(moving, `${s.name}: moves under prefers-reduced-motion`).toEqual([]);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number));
      expect(Math.max(...bg), `${s.name}: page is not dark`).toBeLessThan(60);
      const contrast = (await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze()).violations
        .flatMap(v => v.nodes.map(n => n.target.join(" ")));
      expect(contrast, `${s.name}: dark contrast`).toEqual([]);
    });
  }
});

test("SD-G08 theme choice: explicit light or dark wins over the system and persists; the exam keeps its own neutral skin in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  const scheme = () => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  expect(await scheme()).toBe("dark");
  await page.getByLabel("Тема").selectOption("light");
  expect(await scheme()).toBe("light");
  await page.reload();
  await expect(page.getByLabel("Тема")).toHaveValue("light");
  expect(await scheme()).toBe("light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByLabel("Тема").selectOption("dark");
  expect(await scheme()).toBe("dark");
  const learnBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole("button", { name: /Симуляція YKI/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "exam");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(learnBg);
  await page.getByLabel("Тема").selectOption("system");
  expect(await scheme()).toBe("light");
});

test("DESIGN-05/R10-14 forced colours (Chromium): controls keep visible borders, focus stays visible, statuses remain text", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "forced-colors emulation is Chromium-only in Playwright");
  test.setTimeout(120_000);
  await page.emulateMedia({ forcedColors: "active" });
  for (const s of SCREENS.filter(x => ["home", "cloze mission", "reading item", "exam setup", "exam item"].includes(x.name))) {
    await test.step(s.name, async () => {
      await visit(page, s);
      const borderless = await page.locator("main .btn:visible, main .choice:visible, main textarea:visible, main input.answer:visible").evaluateAll(els =>
        els.filter(e => { const cs = getComputedStyle(e); return cs.borderStyle === "none" || parseFloat(cs.borderWidth) < 1; }).map(e => e.className));
      expect(borderless, `${s.name}: control loses its edge in forced colours`).toEqual([]);
      await page.keyboard.press("Tab");                                           // keyboard focus, so :focus-visible applies
      const ring = await page.evaluate(() => { const e = document.activeElement as HTMLElement; return e && e !== document.body ? getComputedStyle(e).outlineStyle : "no focus"; });
      expect(ring, `${s.name}: focus ring vanishes in forced colours`).not.toMatch(/none|no focus/);
      const steps = page.locator(".threshold-route [aria-current=step]");
      if (await steps.count()) expect(await steps.first().evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe("none");
    });
  }
});

test("AC-43 / COG-05: after feedback the single form cue never borrows a skill colour, and only one cue and one status note show", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Навчання/ }).click();
  await expect(page.locator("[data-trust-note]")).toHaveCount(1);                       // one status note, in one place
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjasto");
  await page.getByRole("button", { name: "Перевірити" }).click();
  await page.getByLabel("Впиши пропущену форму фінською").fill("kirjastoon");
  await page.getByRole("button", { name: "Перевірити ще раз" }).click();
  await expect(page.getByRole("heading", { name: "Що вийшло" })).toBeVisible();
  const cues = page.locator(".learning-cue");
  expect(await cues.count()).toBeLessThanOrEqual(1);
  if (await cues.count()) {
    const { colours, skills } = await cues.first().evaluate(e => {
      const cs = getComputedStyle(e), root = getComputedStyle(document.documentElement);
      const norm = (c: string) => { const d = document.createElement("i"); d.style.color = c; document.body.append(d); const v = getComputedStyle(d).color; d.remove(); return v; };
      return { colours: [cs.color, cs.backgroundColor], skills: ["reading", "listening", "writing", "speaking"].map(k => norm(root.getPropertyValue(`--skill-${k}`).trim())) };
    });
    for (const c of colours) expect(skills).not.toContain(c);
  }
  await expect(page.locator("[data-trust-note]")).toHaveCount(1);
});
