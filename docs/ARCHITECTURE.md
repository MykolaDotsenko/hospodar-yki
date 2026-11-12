# Architecture map — real implementation and approved target

**Status:** source map updated for the 2026-11-07 G2 Web progress-recovery slice; release targets remain separate from implemented code. [Authority/index](INDEX.md) · [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md).

See the [ADR lifecycle and current decision map](architecture/README.md) for explicit precedence, and the [Web/Android migration how-to](guides/WEB-ANDROID-MIGRATION.md) for implementation sequencing. These navigation pages do not replace the canonical contracts in [CONTRACTS](CONTRACTS.md).

**Module boundaries are actively checked:** [independent domain and contracts rule](architecture/MODULE-BOUNDARIES.md) runs in CI. React/Phaser/Dexie/Room are platform-specific TARGET choices, not dependencies of pure domain logic.

## Implemented now (source exists)

```text
app/index.html ── app/app.mjs ── app/core.mjs ── learning/exercises/**/*.json
     │                                 └── LEARN progress: localStorage
     └── app/exam.html ── app/exam.mjs ── app/exam-core.mjs
                                  └── app/attempt-storage.mjs
                                       └── IndexedDB (exam event + checkpoint)
app/session-v2-idb.mjs ── isolated experimental V2 Web adapter (not active app storage)
apps/web (React 19 + Vite 8 + TS) ── packages/domain (pure TS, parity with app/core.mjs)
     └── Dexie DB hospodar-yki:web:v1 (LEARN progress, legacy import and Web JSON LEARN-only restore; v3 separate cloze draft)
app/media-platform.mjs ── browser/native media contract prototype
packages/contracts/src/{index,media}.mjs ── first-attempt & rights contracts
native/android/prototype/*.kt ── Kotlin SOURCE ONLY: Room + Media bridge
```

**Runnable Web MVP:** plain JavaScript ES modules; browser pages served via a local HTTP server (not a build step). UI, progression, sample exam and limited audio exist. Browser exam V1 IndexedDB uses event+snapshot transactions with event-receipt recovery and a Chromium integration check; an **isolated** V2 adapter separately proves first-attempt uniqueness. The live learning SRS still uses `localStorage`.

**G2-a…G2-d (03.11.2026):** `apps/web` React/Vite/TS app with Dexie persistence and `packages/domain` strict-TS policies with parity tests ([plan](exec-plans/active/2026-11-03-g2-web-react-scaffold.md)). **IMPLEMENTED (tested, S2 content pending):** LEARN missions (cloze, R08 reviewer preview, listening, reading, writing clinic, dialogues, picture missions, diagnostic, 7/14/30 delayed checks, media library), legacy progress import, «Мої дані» (verified JSON export + per-scope typed-confirmation erase + fail-closed LEARN-only restore from Web v1 backup into an empty profile, LEARN-16/WEB-07), and an EXAM practice rehearsal on an **XState** machine with its own IndexedDB (`hospodar-yki:web-exam:v1`: checkpoint + attempt history), full or skill-subset sessions, draft autosave and consented local voice recording (E06 receipts, separate `hospodar-yki:web-exam-voice:v1`), plus E07 IME-safe writing (composition gate and exact Unicode readback), and an offline app shell and explicit offline media packs with an exam-safe update guard (service worker, WEB-05/06). installable as a PWA (web app manifest). **Not implemented:** `apps/android` Capacitor/Gradle app, Phaser gameplay, cross-platform Kotlin/TypeScript V2 persistence parity, durable Android Room binary, real Play Asset Delivery (planned ≈3.6GB compressed within the 4GB Play ceiling, [R05](23-android-offline-game-and-3gb-media-architecture.md#r05-follow-up-28102026--storage-ceiling-increased-implementation-unchanged)), full online sync, verified official YKI 2027 reproduction. See [implementation status](25-implementation-vertical-slice-roadmap.md).

## Planned modular monolith (direction, **not** current paths)

```text
                  Pure TypeScript domain/contracts
                ↗           ↑               ↖
React/Vite Web UI       XState exam policy     Phaser 2D scenes
       │                       │                       │
       └──────── application use cases ────────────────┘
                         │
       ┌─────────────────┴──────────────────┐
 Web: Dexie / IndexedDB                Android: Capacitor bridge
 Web: CDN + selected cache                    Kotlin Room + Media3
                                        Google Play AAB / install-time PAD
                         │
          Optional future EU sync/AI gateway
```

**Dependency rule:** domain may depend on pure validation/schema utilities, never React, Phaser, Capacitor, browser globals, platform DB or Supabase. UI and native adapters depend on the shared contracts. Domain and application decisions must be deterministic and unit-testable with mock ports.

## Critical flows

1. **EXAM:** `start → edit checkpoint → atomic durable commit → next/finish`. A save failure blocks progression. Mark typed event evidence separately from editable drafts. On lost ACK confirm actual **event ID plus fingerprint**, not just matching snapshot. Never expose correct answers/coaching before appropriate submission.
2. **LEARN:** independent first response → immutable `FirstAttemptEvent` → corrections/transfer events → SRS update. A draft isn't evidence of independent recall. Do not silently migrate learning `localStorage` without export and repeatable migration tests.
3. **CONTENT:** identity = `itemId + version + sha256`; freeze content identity in an in-flight attempt. Rights/source validation comes before media bundling; never copy multi-GB media assets into IndexedDB/Room.
4. **ANDROID MEDIA:** install-time pack is target, not shipped. A provided `packId` must actually select a verified pack; native seek/subtitles/video and path traversal controls require compiled-device evidence.
5. **AI/VOICE:** core offline first; optional remote feedback only after explicit opt-in, with minimal data and no default voice upload.

## Where to change what

| Feature change | Current owner | Documentation / tests |
| --- | --- | --- |
| LEARN flow/SRS | `app/app.mjs`, `app/core.mjs` | [MVP spec](11-mvp-product-requirements.md), `app/tests/` |
| EXAM behavior | `app/exam.mjs`, `app/exam-core.mjs` | [21 — exam contract](21-digital-yki-exam-simulator-executable-spec.md), `app/tests/` |
| Exam persistence | `app/attempt-storage.mjs` | [CONTRACTS](CONTRACTS.md), IDB real-browser test |
| Immutable attempts | `packages/contracts/src/index.mjs` | [CONTRACTS](CONTRACTS.md), `packages/contracts/tests/` |
| Media/rights | `app/media-platform.mjs`, `packages/contracts/src/media.mjs` | [SECURITY](SECURITY.md), media tests |
| Kotlin source prototype | `native/android/prototype/` | [native README](../native/android/prototype/README.md); compile gate still absent |
| Curriculum and audio | `learning/exercises/`, `assets/audio/`, `assets/video/` | [content authoring](../learning/CONTRIBUTING.md) |

## Change protocol

When design and source disagree, keep both statuses visible and open a scoped fix with a regression test. Treat [ADR-024](24-reliability-hardened-architecture-web-android.md) and [ADR-027](27-stack-architecture-compatibility-and-implementation-gates.md) as the latest architecture integration decisions; do not edit old ADRs as if they were live source code. Read [TESTING](TESTING.md) before reporting "implemented".

## 2026-11-08: recoverable cloze LEARN draft (separate store, same Web DB)

The React LEARN cloze now uses the additive Dexie **v3 `missionDraft` table** with optimistic draft revision and learner-state revision. Step submission is checkpointed and reread before updating the UI. A frozen first attempt is kept separate from guided repair. A short idle debounce saves unfinished typing; **Зберегти та вийти** flushes immediately; reload validates the saved phase by re-running the pure mission reducer against the current editorial content fingerprint. A stale, malformed or old-content draft blocks silent continuation and requires deliberate discard; EXAM store and feedback rules are untouched. Finishing a mission updates the LEARN history and removes the matching draft **in one transaction**, verified afterward. LEARN deletion removes draft too; an unfinished draft blocks new-profile restore and legacy import rather than being overwritten. The existing Web JSON export remains **completed-records-only** and cannot be called a full paused-draft backup; UI says so explicitly. A physical power-kill/IDB eviction/Android resilience matrix and expanded autosave on the other LEARN skill screens are **NOT RUN**.

## 2026-11-08: WEB-05 offline cached-media integrity and fail-closed status

**Code:** `apps/web/src/pwa/offline.ts`, `apps/web/src/screens/OfflineScreen.tsx`; **evidence:** `apps/web/src/pwa/offline.test.ts`, `apps/web/e2e/offline.spec.ts`. Content URLs may remain the same after a build, so a Cache Storage hit is *not* proof that an offline file matches the current manifest. Both status and explicit repeat-download now verify each cached response's actual byte count and SHA-256; a stale, truncated, unreadable or hashless match never counts as ready. Re-download removes invalid bytes before network repair, and a fresh cache readback must match after writing before the UI reports success. A verification failure clears previously displayed ready rows rather than implying offline availability. This does **not** add content, install media automatically, touch LEARN/EXAM/voice records, prove resilience under physical device eviction, or guarantee future multi-gigabyte pack performance.

**Performance/standards trade-off:** Web Crypto `SubtleCrypto.digest` does not support incremental streaming, so every status check reads and hashes one media file in memory at a time; run real-device memory/latency measurements and evaluate an incremental hash strategy before deploying any 3–4GB Android/browser media catalogue. Reference: [MDN Cache.match](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match), [MDN SubtleCrypto.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest). This is a reliability fix under existing WEB-05 / QL-08, **not** a claim of new language-learning outcomes or official YKI fidelity.

## 2026-11-08: EXAM C-04 navigation ACK gate (durable before visible)

On the React/XState EXAM Web rehearsal, a prior implementation changed `session.index` to the destination before its IndexedDB transaction/readback completed. E2E could observe `Tehtävä 2 / 9` and reload while the saved checkpoint still pointed at item 1. A new internal `pendingNavigation` keeps the visible session/index unchanged during `saving` and across `saveError`/`RETRY` until the repository confirms exact readback. Next item appears only in the `persist.onDone` transition. The Finnish status text now says `Tallennetaan siirtymää…` while pending and `Tallennus epäonnistui.` after refusal, not `Tallennettu.`. The pending state is in memory only and never exported or scored.

**Acceptance:** domain Vitest uses a deferred repository commit to prove old index before ACK / new index after ACK, restores an independent IndexedDB reader on both sides; failure+retry regression asserts old task remains visible. Existing three-engine Playwright EXAM reload checks the new item is displayed only after the save receipt. No official YKI UI/timing fidelity claim. This addresses the failed post-merge main CI run 42510644046, which observed the next task on-screen before a persisted reload; S2/Android/device validation remain separate gates.

## 2026-11-09 — LEARN Writing Clinic checkpoints (IndexedDB v4)

An additive clinicDraft table, separate from cloze missionDraft and completed learner evidence, holds the unfinished stage, exact editable Finnish text and a content fingerprint. Checkpoints are serialized, version-guarded by both learner and draft revisions, and confirmed by fresh readback. Each phase is reconstructed with the pure clinic reducer before the UI can show a model. The first independent writing submission is committed atomically with the spot-stage checkpoint; final guided rewrite and new independent transfer are committed atomically with checkpoint deletion.

A second tab cannot replace or erase stale work. LEARN wipe clears this store under a revision check; legacy import and JSON restore fail closed if it is populated. The existing portable JSON export intentionally omits unfinished cloze and clinic drafts, which the data screen now discloses. No EXAM/YKI grade, S2 approval, true power-loss recovery, Android persistence or measured learning effect is claimed.

Evidence: apps/web/src/storage/clinicDraft.test.ts; clinicDraft.repository.test.ts; apps/web/e2e/writing-clinic-restore.spec.ts; plus unchanged full Playwright and architecture gates.

## 2026-11-09 — LEARN Reading checkpoint (Web Dexie v5)

The React LEARN Reading screen previously had no durable stage/input state. The new additive `readingDraft` table (Dexie v5) holds first-choice/open answers, editable Finnish input, self-judgements and the transfer stage, independent of completed diagnostics, cloze drafts, Writing Clinic, EXAM and voice. Content fingerprints and exact `readingReducer` replay reject stale or impossible phases before exposing answer keys/highlights. Serialized, CAS-checked writes with fresh readback gate each visible stage transition; final evidence and deletion of the matching checkpoint share one transaction. Stale tabs cannot overwrite a newer answer, and LEARN erase/import/restore handle the paused draft without destructive merging. Explicit Save & Exit flushes, whereas a sudden tab/process kill before idle autosave and device storage eviction remain **unverified**.

**Implementation / test owner:** `apps/web/src/storage/{readingDraft.ts,learnerRepository.ts}`, `apps/web/src/screens/{ReadingScreen.tsx,DataScreen.tsx}`, `apps/web/src/storage/readingDraft*.test.ts`, `apps/web/e2e/reading-restore.spec.ts`; [execution plan](exec-plans/active/2026-11-09-durable-reading-draft.md). **Status at authoring:** coded, awaiting independent CI. No S2 approval, Android or YKI fidelity claim.

## 2026-11-10 — LEARN Listening checkpoint (Web Dexie v6)

React Listening gains a separate additive `listeningDraft` store for current prediction/question text, frozen answers, audio-start count, and slow/transcript accessibility support flags. The exact lesson fingerprint and pure `listeningReducer` replay gate every resumed phase, preventing early answer-key reveal and stale-version restoration. Queued CAS/readback writes gate visible progression; support remains sticky and makes affected session evidence ungraded. Final diagnostic write plus draft removal is one IndexedDB transaction. LEARN erase/legacy import/JSON restore protect these drafts; the portable JSON export excludes unfinished drafts and says so.

Evidence owner: `apps/web/src/storage/listeningDraft*.ts`, `apps/web/src/storage/learnerRepository.ts`, `apps/web/src/screens/ListeningScreen.tsx` and `apps/web/e2e/listening-restore.spec.ts`. [Execution and validation plan](exec-plans/active/2026-11-10-durable-listening-draft.md). **Code authored; CI not yet asserted.** Audio kill/replay, disk eviction, full mobile a11y and native Android remain separate blockers.

## 2026-11-11 — LEARN «Практика без підказки»: existing banks connected (G2 Web)

Five already-authored banks that no app loaded are now playable in `apps/web`: 24 paraphrase drills and 18 opinion prompts and 18 speaking reactions (`learning/exercises/b1/high-yield/`), 132 contextual chunks and 40 rektio items (`knowledge/dictionaries/b1/`). One pure phase machine `packages/domain/src/practice.ts` (attempt → reveal → [paraphrase recall] → transfer → done) and adapters keep each file its single physical owner. Only the editor-keyed paraphrase choice is scored; every Finnish text is ungraded with an explicit learner self-comparison — no string matching of free answers (R03: valid variants). A validator refuses a card whose first screen already prints the expected Finnish answer, and any id used by an EXAM blueprint is excluded. A finished card is written as `diagnostics` evidence through the existing CAS commit + exact readback; **no new Dexie store and no paused-card checkpoint** (cards are short; the UI says an unfinished card is not kept across reload). A chunk/rektio card enters the existing 1/3/7/14/30 `cards` schedule **only** when the learner judged the first answer «частково/інакше» (the bank's own usage rule; never the whole bank); a later «те саме» moves it up one stage, anything else back to day 1; due cards are offered first («Сьогодні на повторення»). The signal is a self-report that schedules practice — never a score. All cards remain S2-pending drafts; no learning-effect claim.

Evidence: `packages/domain/test/practice.test.ts`, `apps/web/e2e/practice.spec.ts`. Not connected in this slice: the 9 theme files (readings lack evidence spans), `reading-inference-bank.json` (no transfer prompts — would require new Finnish authoring), masterclasses, tenses, time-and-clock.

## 2026-11-11 — research → code gate for AI-assisted development

`docs/design/design-traceability-v1.json` now also holds `methods`: one status for each of the 70 methods of `research/pedagogy/learning-methods-v1.json` (today ENFORCED 20, PARTIAL 25, NOT_YET 21, EXCLUDED 4), with test evidence, gap/plan and an optional `blocked_by` human dependency. `scripts/validate_design_traceability.py` fails on a registry method without status or with non-existent evidence; `--next` prints the prioritized open methods, open EXAM-simulator requirements and authored content no app loads. Procedure: top of [AGENTS.md](../AGENTS.md) and step 0 of [AI-WORKFLOW](AI-WORKFLOW.md). Static evidence only; not a learning-effect claim.

## 2026-11-11 — delayed 7/14/30 checks for all four skills (GL-03)

`packages/domain/src/skillRetention.ts` adds per-skill delayed checks next to the unchanged grammar bank (`retention.ts`). Each skill counts from the learner's first LEARN evidence in it (a `diagnostics` entry that is not itself a delayed check). On real elapsed day 7/14/30 one **new** item is due: reading — three withheld texts from `reading-inference-bank.json`; writing and speaking — three withheld prompts each from the 9 theme files (no LEARN screen loads these files); listening — the first lesson this learner has not met yet (first exposure), never an EXAM blueprint lesson, and honestly "unavailable" when none is left. Objective questions are answered one at a time with frozen first answers; listening needs a started audio, and showing the text for accessibility saves the attempt ungraded. Keys, explanations and the task points (self-check) appear **only after** a CAS commit + exact readback. Missed windows stay missed; a late check records `lateByDays`. Storage uses existing V1 shapes only: one `retention` entry (`taskId: skill-<skill>`) and `diagnostics` with `d<day>-<questionId>` for each objective answer; Progress shows delayed results separately from immediate ones. No schema change, no grade for production, no learning-effect claim.

Evidence: `packages/domain/test/skill-retention.test.ts`, `apps/web/e2e/skill-retention.spec.ts`. Gaps: speaking is a typed plan (no voice), the listening pool is small, all items are S2-pending.

## 2026-11-11 — dialogues with a clarification request and a changed condition

`packages/domain/src/dialogue.ts` gains an optional `negotiation` per dialogue (method `negotiation-repair-dialogues`). At one learner turn the partner "did not understand": the learner must say it again in other words **before** the script line is shown, then confirms by self-report whether the second wording carried the meaning; a skipped reply gets no clarification. After the comprehension questions the learner first role-plays the new situation (`roleplay` phase), and only then the condition changes (`transfer` phase) and they adapt. Moves and their pairing to the 9 dialogues live in `learning/exercises/b1/contextual/negotiation-moves-v1.json` (S2-pending draft: task instructions, not answer keys). The existing Dexie v7 dialogue checkpoint replays the new steps exactly (no script, continuation or changed condition without the learner's own text); the content fingerprint includes the moves, so an older paused dialogue is blocked for explicit discard instead of being silently continued. All productions are saved ungraded (`-repair`, `-roleplay`, `-change`). The partner's lines are fixed editorial moves, not reactions to the learner's text.

Evidence: `packages/domain/test/dialogue.test.ts`, `apps/web/src/storage/dialogueDraft.test.ts`, `apps/web/e2e/dialogue.spec.ts`.

## 2026-11-11 — two work queues: `--next` (code) and `--human` (people)

`scripts/validate_design_traceability.py --human` prints what code cannot close, in order: the S2 review queue (every content file learners already see, with item counts — 0 approved today), methods waiting for licensed human audio, raters or partners, EXAM gates that need a person, and the number of human studies not run. Together with `--next` it is the operating loop described in [AI-WORKFLOW](AI-WORKFLOW.md#operating-loop-two-queues-one-definition-of-better). `--next` now detects loaded content by `folder/file`, so files that merely share a basename (`lessons.json`) are no longer reported as used.

## 2026-11-11 — EXAM profile as data, three profiles, fidelity panel (TZ-EXAM-02…04)

`packages/domain/src/examProfile.ts` + `learning/exercises/b1/exam-patterns/exam-profiles-v1.json`. Each of 18 critical exam parameters (docs/21 §9 and the §10.3 observation form) is a record `value | null` with source URL, date, scope (`legacy_paper` / `oph_digital_demo` / `live_2027`), confidence, reviewer and — for live 2027 — an E2E test title. A value without its source is refused; an unknown is written as `null`. Three profiles: `PRACTICE` (selectable; learner-chosen practice settings, no claims), `OPH_DEMO_OBSERVED` (selectable only after at least one human observation; stale after 30 days without a recheck), `LIVE_2027_VERIFIED` (disabled until all 18 parameters have a live-2027 first-party source and a test). Today every value is `null`, so only `PRACTICE` can be chosen. The setup screen shows a fidelity panel: F1–F6 as six separate statuses (F4/F5 computed from the chosen profile's verified records; F1/F2/F3/F6 declared in the file, with F3/F6 never allowed to be "verified" without human evidence), the verified count (0 of 18) and the list of gaps — never one percentage. A new attempt is pinned to the profile id + content hash (`ExamSession.profileId/profileHash`, optional fields, legacy parity unchanged); the pin survives reload, is written to attempt history, and the profile name ("Profiili: Harjoitus") is shown on every exam screen. Exam behaviour itself (timers, navigation, playback) is **not yet** driven by the profile — that is TZ-EXAM-07/08/10–13.

Evidence: `packages/domain/test/exam-profile.test.ts`, `apps/web/src/exam/examMachine.test.ts`, `apps/web/e2e/exam.spec.ts`.

## 2026-11-12 — front end: "Сьогодні" home, shared mission chrome, own icons

Goal: replace the generic "wall of buttons + emoji + white cards" with the brand's own screen grammar (brand v0.3 «Поріг → Маршрут → Дія») and the research rules for interfaces (UIO-01 one main action, UIO-08 actionable progress, DESIGN-03 skill colour with icon and name, DESIGN-11 anti-sameness, COG-07 no decoration).

- **Home** (`apps/web/src/screens/HomeScreen.tsx`): one recommended next step with a visible reason, chosen by the pure `todayPlan` in `packages/domain/src/today.ts` (due delayed check → phrases missed last time → grammar scheduled today → starting diagnostic for a new learner → a never-practised, otherwise the least-practised skill). Then the two mode entries, four skill tiles (constant colour + own icon + Ukrainian and Finnish name + text state, never a percentage), other exercises, and service links (progress, data, offline, import) moved out of the way.
- **Mission chrome** (`apps/web/src/ui/MissionChrome.tsx`): one `Eyebrow` (skill icon + colour) and one `ThresholdRoute` used by every mission type — grammar, practice, dialogue, reading, listening, writing clinic, picture mission, diagnostic — showing the real steps of that task with a text state for screen readers. The panel carries the skill colour as a top rule.
- **Icons** (`apps/web/src/ui/icons.tsx`): one hand-drawn SVG family (24 px grid, round 1.75 px stroke, `currentColor`, decorative with text labels). All emoji are removed; a test fails if one returns, and an E2E check rejects gradients, glass blur and animation loops.
- Practice cards show Ukrainian theme names instead of internal keys; the exam-profile radio list no longer breaks its labels.

No logic of tasks, storage or scoring changed. Not done yet: Finnish-first typography, a distinct exam skin, per-skill progress rows, entry by life situations (the remaining points of the plan). Whether the product became more recognisable needs a user test (DESIGN-06, DESIGN-15) — not run.

Evidence: `packages/domain/test/today.test.ts`, `apps/web/e2e/home.spec.ts`, `apps/web/src/ui/noEmoji.test.ts`, `apps/web/src/content/practice.test.ts`; unchanged suites still pass.

## 2026-11-12 — Finnish-first typography and a distinct exam skin

- **Finnish first** (brand §3.4, PSY-03): the Finnish task (`.prompt[lang=fi]`) is the largest and calmest text on the screen and carries the threshold rule in the skill's colour; Finnish answer fields, options and dialogue lines are a step above body size; Ukrainian field labels step back; long Finnish compounds hyphenate on narrow screens (`hyphens: auto` on `[lang=fi]` inside `main`). Reading passages get a comfortable measure (≤ 42em).
- **Exam skin** (DESIGN-12): `App` sets `html[data-mode="exam"|"learn"]`. The exam uses a cool neutral page instead of cream, a navy top rule, no gold signature and no skill colours; the threshold route shows the **subtests of the session** (Tekstin ymmärtäminen → Puheen ymmärtäminen → Kirjoittaminen → Puhuminen), never learning steps. The fidelity panel becomes a compact strip of six labelled cells with the status in text; the basis of each status and the list of unverified parameters are behind two disclosure toggles.

Presentation only — no exam rule, timing, navigation or data changed. Evidence: `apps/web/e2e/design.spec.ts`.

## 2026-11-12 — design research conformance on every rendered screen

- **Rendered guards, every screen** (`apps/web/e2e/research-design.spec.ts`, 16 screen states from home to an exam item, 3 engines in CI):
  - landmarks, skip link and `lang`: the page is `uk`, and every Finnish surface is `fi`;
  - axe WCAG 2.2 A/AA;
  - targets: at least 24 px, main actions at least 44 px;
  - reflow at 390/360/320 px and at 320 px with 200 % text;
  - focus is never covered or off screen (WCAG 2.4.11);
  - under `prefers-reduced-motion` nothing moves;
  - only token micro-transitions run, never keyframe or looping animation;
  - no streaks, XP, standings or loss framing, no notification prompt, no request to another origin;
  - in forced colours (Chromium), controls keep their edges and focus stays visible;
  - after feedback, the single form cue never uses a skill colour.
- **Dark theme** (SD-G08, SD-06):
  - `brand/tokens.json` `colors_dark` defines the same roles with lighter tints of the same hues;
  - `validate_design_tokens.py` re-checks every contrast pair on it and emits the palette only for pages that opt in with `html[data-theme-support="dark"]`, so the legacy `app/` stays light;
  - the theme follows the system or the learner's choice (footer: «Тема»), stored per viewer as a convenience.
- **One place for status disclaimers:** `ui/TrustNote.tsx` replaces 15 hand-written notes with one wording, look and position, at most one per screen state, never in EXAM.
- **Fixed by the new guards:**
  - `body` font size in `rem`, so the browser's own text size wins;
  - a long Finnish word no longer widens the page (`fieldset` min-width, `overflow-wrap` in `main`);
  - the mobile fidelity-strip rule was declared before its base rule and never applied;
  - the file picker on «Мої дані» widened the page at 360 px;
  - an R08 transfer prompt lacked `lang="fi"`.

Not covered by automation: screen readers (TalkBack/VoiceOver/NVDA), real devices, and a manual 400 % zoom and contrast review (R10-17/R10-18).

### «Моє господарство» — the name made visible, with research-bounded game elements

- **Meaning:** Hospodar = self-reliance in your own daily life (brand platform), so LEARN is organised as **nine everyday places**, one per YKI keskitaso theme (Я і моє життя … Суспільство). Each place has:
  - a real-life goal («Бути тут господарем: …»);
  - its real missions: reading, dialogue, writing and practice cards from LEARN pools that already exclude EXAM items;
  - one optional real-life deed that the app never tracks.
- **Game elements, only where research allows** (R08-MOT MOT-01…09, MOT-E03/E06/E09, GAM-01, UIO-09):
  - places are never locked;
  - the **door** opens after the first own attempt (the brand threshold with its golden step);
  - a **key** is given only for a correct first independent answer, never for a later retry or guided repair;
  - ungraded Finnish writing and speaking show as practice, never as a score;
  - nothing decays or resets;
  - no XP, streak, level, rank, percentage, mascot or sound;
  - never in EXAM.
- **Code:**
  - pure logic in `packages/domain/src/places.ts`, tested in `test/places.test.ts`;
  - content in `apps/web/src/content/places.ts`;
  - UI in `screens/PlaceScreen.tsx` and `ui/PlaceGlyph.tsx`;
  - E2E in `e2e/places.spec.ts`.
- **Media budget:** the planned 3–4 GB offline packs (R05) are for licensed human audio and video. The game layer is static SVG (kilobytes). Richer illustration waits for one human-made style with cleared rights (DESIGN-07); no generated art.
- **Not measured:** whether the place layer changes delayed independent Finnish outcomes (UIO-09 comparison, R08-MOT-H01) — NOT RUN.
- **Persona «Господар»** (DEC-06 revised by the owner on 12.11.2026): a **master and mentor** (сенсей, владник) of his own life in Finland and of YKI. He looks like a kind village uncle from a cartoon (original design): a big round head, a straw hat, a big moustache, a round belly in a вишиванка with a крайка belt, a кептар in brand colours and boots; he holds a ring of keys.
  - **Where he appears:** only on Home («Моє господарство») and on place screens. He is never shown during an answer or in feedback, and never in EXAM.
  - **What he says:** a greeting, a guilt-free welcome back after a break of 3 or more days, a daily «наука майстра», and how doors and keys work. Each «наука» names a rule the app enforces (retrieval before the model, spacing, self-repair, speaking aloud, delayed new-situation checks). He never praises or rates an answer and never promises a YKI pass.
  - **Presentation:** static and silent. The learner can hide him in the footer, and calm mode also hides him.
  - **Code:** `packages/domain/src/hospodar.ts` (`test/hospodar.test.ts`) and `apps/web/src/ui/Hospodar.tsx`. The drawing is a **temporary code silhouette** until a human illustrator delivers the final character (DESIGN-07).

