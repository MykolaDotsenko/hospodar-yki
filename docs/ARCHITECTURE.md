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
     └── S2 reviewer: throwaway Dexie DBs hospodar-yki:review-sandbox:<time>-<id> (deleted after each walk) + localStorage hospodar-yki:review-decisions:v1
     └── private real-life deed marks: localStorage hospodar-yki:web:deeds:v1 (not progress, not exported; erased with LEARN)
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
- **Persona «Господар»** (DEC-06 revised by the owner on 12.11.2026): a **master and mentor** (сенсей, владник) of his own life in Finland and of YKI. He is drawn as a semi-realistic half-length portrait of a village householder (original design, not a cartoon or caricature): human proportions, a kind weathered face with a grey moustache, a straw hat, a linen вишиванка with shoulder bands, a кептар and a крайка belt in brand colours; he holds a ring of keys. The illustration uses the `persona_*` colour tokens, which are the same in the light and dark palettes.
  - **Where he appears:** only on Home («Моє господарство») and on place screens. He is never shown during an answer or in feedback, and never in EXAM.
  - **What he says:** a greeting, a guilt-free welcome back after a break of 3 or more days, a daily «наука майстра», and how doors and keys work. Each «наука» names a rule the app enforces (retrieval before the model, spacing, self-repair, speaking aloud, delayed new-situation checks). He never praises or rates an answer and never promises a YKI pass.
  - **Presentation:** static and silent. The learner can hide him in the footer, and calm mode also hides him.
  - **Code:** `packages/domain/src/hospodar.ts` (`test/hospodar.test.ts`) and `apps/web/src/ui/Hospodar.tsx`. The drawing is a **temporary code silhouette** until a human illustrator delivers the final character (DESIGN-07).

## 2026-11-12 — «Майстерня слабких місць»: deliberate practice with interleaving and a delayed check

- **What it does** (methods error-bottleneck-deliberate, interleaving-grammar; PSY-06, COG-10, AC-50, GL-03):
  - **Weak spot:** a family of confusable forms (location cases, rektio, past tense, verb forms, nominal forms) becomes a weak spot when the learner's **first** answer was wrong on two or more different tasks. A later correct retry or a guided repair never clears it.
  - **Practice set:** up to 5 tasks the learner has **never seen**, mixed across the family's forms — the most-missed form first, then round-robin.
  - **Delayed check:** seven days after the last practice in a family, the next new task is a delayed check without hints. Its first answer is shown as delayed evidence («через N дн. на новому завданні: правильно з першої спроби / ще не так»), never as mastery, a level or a YKI estimate.
- **Code:**
  - pure logic in `packages/domain/src/bottleneck.ts` (`test/bottleneck.test.ts`);
  - families of forms and learner-facing names (Finnish grammar terms stay Finnish, the rest is Ukrainian) in `apps/web/src/content/workshop.ts`;
  - the screen in `screens/WorkshopScreen.tsx`, with Господар outside the task;
  - the mission opens a given new task and returns to the workshop (`MissionScreen` `initialTaskId` / `workshop`);
  - E2E in `e2e/workshop.spec.ts`; the screen is also part of the design audit.
- **Data:** no schema change. Everything is derived from existing `attempts` (first attempt per task, local calendar days).
- **Limits:**
  - The families draw on the 28 S2-pending cloze tasks (3–8 per family), so sets run out quickly. No Finnish task or key was written for this; when fewer than three new tasks remain, the set is marked thin.
  - Rektio practice cards and the ordinary R06 schedule are not interleaved yet.
  - The equal-time blocked-vs-interleaved comparison (PSY-E04) is NOT RUN.

## 2026-11-12 — pre-task planning before an opinion monologue

- **What it does** (methods pre-task-planning, learner-concept-map):
  - Before answering an opinion card, the learner may write a short own plan: main idea, two reasons, an example from life. Optional, untimed, ungraded.
  - The plan **disappears while answering**, so the learner speaks from memory and does not read notes, and it comes back only next to the model for self-comparison.
  - The plan text is never stored; the evidence only notes that a plan was used.
  - Quick reactions stay spontaneous, without a plan.
- **Code:**
  - phase `plan` and events `START_PLAN` / `SUBMIT_PLAN` in `packages/domain/src/practice.ts`, tests in `test/practice.test.ts`;
  - UI in `PracticeScreen`;
  - E2E in `practice.spec.ts`; the screen is also in the design audit.
- **Not yet:** planning before dialogue role-play and the writing clinic. The effect on fluency or complexity is not measured.

## 2026-11-12 — exam conditions: Finnish-only attempt, no writing aids, no "official" claims

- **Inside an attempt** (`section[data-exam-attempt]`, `translate="no"`):
  - task text, buttons, route step states and the recording controls are Finnish;
  - Ukrainian is allowed only in marked system notices (`data-system-notice`: privacy, voice consent, save failures), which the learner must understand for their data's sake;
  - `e2e/exam-conditions.spec.ts` checks every task of a full rehearsal (EXV-14, TZ-EXAM-09, EXAM-05).
- **Answer fields** switch off spellcheck, autocorrect, autocapitalize, autocomplete, browser translation and common writing-assistant hooks (TZ-EXAM-12, EXAM-PILLAR-04). IME composition and exact Unicode are unchanged.
- **Claims:** `src/ui/claims.test.ts` fails on any UI sentence that calls the app or its result the official YKI without a negation (TZ-EXAM-20, automated part).
- **Not done:**
  - S2 review of the Finnish interface strings;
  - a Finnish instruction screen before the start;
  - paste and counter policy, which waits for the OPH demo walkthrough (TZ-EXAM-01);
  - the legal review.

## 2026-11-12 — the YKI preparation cycle around the rehearsal

- **Exposure** (TZ-EXAM-14 exposure part, EXV-03, EXAM-09/11):
  - exposure is tracked per set **and** skill, derived from the finished-attempt history (no schema change);
  - setup defaults to a set never seen for the chosen skills and labels each set as unseen or already seen;
  - a repeat is allowed, but the setup and the history name it as a repeat of familiar material, never as a new check;
  - when no unseen set is left, the app says so instead of recycling tasks.
- **Interrupted, not failed** (EXAM-10): an unfinished attempt found on opening continues with the Finnish notice «Jatkat keskeytynyttä harjoitusta. Vastauksesi on tallennettu.».
- **After the rehearsal** (TZ-EXAM-19, AC-20):
  - «Що далі» lists, per skill, wrong and unanswered keyed tasks and ungraded productions, with a button into the matching LEARN area — on other material, since exam tasks never appear in LEARN;
  - 14 days after the latest rehearsal, an unseen set is offered as the delayed re-check;
  - counts only, never a level, a grade or a pass prediction.
- **Code:**
  - `packages/domain/src/examPrep.ts` (`test/examPrep.test.ts`);
  - `ExamScreen` (setup, history, `NextSteps`, resume notice);
  - `e2e/exam-prep.spec.ts`.
- **Limits:** only two mini sets exist. A real cycle needs the held-out bank of original full forms reviewed by two S2 teachers (TZ-EXAM-14, human).


## 2026-11-12 — speaking as in the exam: timed task (TZ-EXAM-11, MOCK-VID-07, E06-G08)

- **Flow** in `ExamVoice`: «Aloita ajastettu tehtävä» → preparation countdown «Valmistautumisaika m:ss» → short signal (Web Audio, silent if unavailable; the countdown text is the primary cue) → recording starts by itself → «Vastausaika» countdown → the recording stops by itself.
  - The learner may cancel during preparation or stop the recording early; a denied or missing microphone ends the timed task with the existing honest notice.
  - The microphone still starts only because of the learner's own action (starting the timed task); the Ukrainian privacy notice says so.
  - Consent, verified local storage and «ungraded» stay exactly as in E06; the manual record button stays.
- **Windows:** `packages/domain/src/examSpeaking.ts` (`speakingWindows`, `speakingPhase`) take `speaking.prep_seconds` / `speaking.response_seconds` from the pinned exam profile only when those records are verified; otherwise practice windows 30 s / 60 s, shown as «Harjoitusajat — virallisia vuoden 2027 aikoja ei ole vahvistettu». No OPH 2027 value is invented.
- **Evidence:** `packages/domain/test/examSpeaking.test.ts`; `apps/web/e2e/exam-voice.spec.ts` (fake recorder + Playwright clock: countdown, auto-start, auto-stop, cancel, early stop, denied mic).
- **Not done:** mic/headphone check before the start (TZ-EXAM-17); per-task windows; real-device microphone and codec testing (CI uses a stubbed recorder); verified OPH 2027 windows (human walkthrough).

## 2026-11-13 — device check before the rehearsal (TZ-EXAM-17, headphone/mic part)

- **Where:** the rehearsal setup, block «Перевірка пристрою · Laitetarkistus», shown only for the devices the chosen skills need (listening → headphones, speaking → microphone).
- **Headphones:** a 1.5 s test tone, then the learner reports «Чую звук» / «Не чую»; the app cannot hear the room, so it never claims more.
- **Microphone:** 3 s loudness metering (`AnalyserNode` → `byteRms` → `micResult`), then the tracks are stopped. Nothing is recorded, stored or sent (the E2E asserts no `MediaRecorder` and one stopped track).
- **Advisory:** it never blocks the start; unconfirmed devices are listed next to the start button. Without a microphone the typed plan remains the speaking answer path. No OPH device-check procedure is claimed.
- **Code:** `packages/domain/src/deviceCheck.ts` (`test/deviceCheck.test.ts`), `apps/web/src/screens/ExamDeviceCheck.tsx`, `apps/web/e2e/exam-device.spec.ts` (Web Audio fake microphone; the two metered tests skip only where the engine cannot run Web Audio, e.g. Firefox on a CI machine without an audio device; a separate test covers that suspended-engine path on every engine).
- **Robustness:** `AudioContext.resume()` is never awaited unbounded (it stays pending forever without an audio device); a tone that cannot play still leads to the learner's report, and a suspended engine is reported as «could not measure», never as silence.
- **Not done:** focus mode without app navigation; real-device microphone/headphone testing; the official 2027 device check (OPH demo walkthrough, human).

## 2026-11-13 — YKI preparation map: 9 themes × 4 skills (yki-constructive-alignment)

- **Map:** «Мій прогрес» shows a table of the nine YKI keskitaso themes (the «Господарство» places) × reading, listening, writing, speaking. A cell shows LEARN tasks tried / available (`1/3`) and keys (correct first answers). Counts only — no percentage, level, grade or pass prediction. Exam tasks never count (they are not in LEARN pools).
- **Skill per item:** `PlaceItem.skill` — reading texts and paraphrase cards → reading; long listening lessons → listening; writing clinic → writing; dialogues, reactions and opinions → speaking (typed today). Vocabulary and rektio cards train no single skill and stay off the map.
- **Found and fixed:** the six long listening lessons belonged to no place (their combined topic keys were unknown). They are now quests in their places and open the lesson directly.
- **Coverage check:** `apps/web/src/content/places.test.ts` keeps the content gaps as an explicit register (9 of 36 cells since the EXAM listening hold-out below) that may only shrink, and requires every place to have a receptive and a productive skill. An empty cell is shown as missing material, never as the learner's weakness.
- **Code:** `packages/domain/src/coverage.ts` (`coverageMap`, `SKILL_CAN_DO_UK`; `test/coverage.test.ts`), `apps/web/src/screens/YkiMap.tsx`, `apps/web/e2e/yki-map.spec.ts`.
- **Not done:** filling the 7 gaps (S2-authored listening/writing material); can-do per genre measured on unseen tasks (held-out S2 bank); recorded speech in LEARN speaking cells.

## 2026-11-13 — EXAM listening lessons held out of LEARN; «Ціла справа» (task-based)

- **Integrity fix (EXAM-11):** the two long listening lessons used by the EXAM mini rehearsals (`b1long-01`, `b1long-02`) were also offered in LEARN (the listening list and, since the YKI map, two places). `content/listening.ts` now exports the LEARN pool `listeningLessons` without any EXAM blueprint item; `allListeningLessons` stays for the delayed-check bank, which drops exam ids itself. The place test now checks the items quests open, not only index keys (the old check compared `b1long-1` prefixes and missed it). A learner's unfinished draft on a held-out lesson is shown as incompatible (fail closed), never resumed into LEARN. E2E fixtures moved to `b1long-03`.
- **«Ціла справа»:** on a place screen, one life situation as ordered steps: understand (reading → listening) → say (dialogue) → write (writing clinic), one existing LEARN item per skill, offered only where all three exist (services, travel, work, society). A step is done after the learner's own attempt; listening done only with text support shows as "with support". Completing it means "done yourself" — never a grade.
- **Code:** `packages/domain/src/scenario.ts` (`buildScenario`, `scenarioProgress`; `test/scenario.test.ts`), `content/places.ts` (`Place.scenario`), `PlaceScreen`, `e2e/scenario.spec.ts`.
- **Not done:** 20-minute scenarios with roles and conditions that change across steps; per-step task-success criteria for writing/speaking (needs human raters); new non-exam listening for housing and work.

## 2026-11-13 — own plan before writing in the writing clinic (pre-task-planning)

- **Flow:** in the clinic's first step the learner may open «Спершу скласти план (за бажанням)»: a short Ukrainian frame (addressee and purpose; each task point in 1–3 words; opening and closing) and a free plan box. «Без плану» skips it; it is offered once.
- **Writing is not speaking:** unlike the opinion monologue, the plan stays in view while writing (an outline), disappears during self-check and spotting, and comes back next to the model for self-comparison. It is never offered in the new-situation transfer, which stays independent.
- **Privacy and evidence:** the plan lives in the screen session only — not in the persisted clinic draft (whose shape is strictly validated) and not in exports. The draft evidence is labelled "after an own plan"; still ungraded.
- **Code:** `packages/domain/src/writingClinic.ts` (`CLINIC_PLAN_FRAME_UK`, `clinicEvidence(..., { planned })`), `WritingClinicScreen`, `e2e/writing-clinic.spec.ts`.
- **Dialogue role-play (2026-11-13):** the same optional plan before the learner's first own role-play reply, with a frame line for a repair move («Що скажеш, якщо тебе не зрозуміють»). Speaking-like: hidden while replying, back after the reply next to what they said; the role-play evidence is labelled "after an own plan". Code: `dialogue.ts` (`DIALOGUE_PLAN_FRAME_UK`, `dialogueEvidence(..., { planned })`), `DialogueScreen`, `e2e/dialogue.spec.ts`.
- **Not done:** any measured effect on fluency or complexity.

## 2026-11-13 — graduated task sequencing on practice cards (graduated-task-sequencing)

- **Flow:** after a reaction or opinion card is saved, «Ускладнити (за бажанням)» repeats the same situation in up to three steps, adding one constraint per step and keeping the earlier ones: reaction — brief → polite to an unknown official → specific (time, place or reason); opinion — a second reason → another view and why you still disagree → an own example.
- **No new keys:** constraints are Ukrainian instructions over the card's existing situation; no Finnish model or answer key is added.
- **Evidence:** each step is the learner's own Finnish text, saved ungraded (`<card>-step-<constraint>`) with their self-check (yes / partly / not yet) through the usual commit + verified readback. Optional and stoppable at any step; nothing locks or counts as a level.
- **Code:** `packages/domain/src/graduated.ts` (`stepUpFor`, `activeConstraints`, `stepUpEvidence`; `test/graduated.test.ts`), `PracticeScreen` (`StepUp`), `e2e/practice.spec.ts`.
- **Not done:** graduated steps on dialogues and writing; adapting the next constraint to the learner's own performance (needs a grader/human rater).

## 2026-11-13 — strategic audio notes in the listening mission (strategic-audio-notes)

- **Flow:** while listening and answering, «Мої нотатки під час слухання (за бажанням)» opens three short fields: when, where, what is happening or has to be done. Any language. The notes stay in view while answering and come back next to the keys for self-comparison; they are not editable after the answers.
- **Independence:** the notes are the learner's own processing, like note paper in an exam — not outside support — so the answers stay independent and scored (unlike transcript or slower speed).
- **Privacy:** session only; not in the persisted listening draft, exports or scores.
- **Code:** `packages/domain/src/listening.ts` (`AUDIO_NOTE_FIELDS_UK`), `ListeningScreen`, `e2e/listening.spec.ts`.
- **Not done:** notes in the EXAM rehearsal (OPH 2027 note-taking rules are unverified, so nothing is added there) and in the delayed checks.

## 2026-11-13 — dictogloss on listening lessons (dictogloss)

- **Flow:** «Диктоглос: відтвори уривок» on the listening screen. One ~10 s segment of a LEARN listening lesson (its own subtitle cue): heard at most twice → reconstructed in Finnish from memory → only then the transcript of that segment. Next time the next segment of the lesson.
- **Feedback, not a score:** words of the original that occur in the learner's text in the identical form are marked; a different but valid form or a synonym is not marked, and the screen says so. No number, percentage or level. The learner judges how much of the content they reconstructed (most / main / little).
- **Evidence:** saved ungraded (`dictogloss-<lesson>-<n>`, listening) through commit + verified readback. Exam lessons are excluded (LEARN pool only).
- **Fix found on the way:** listening E2E selectors are now scoped to the «Аудіозаписи» list, since a lesson title now also appears in the dictogloss list.
- **Code:** `packages/domain/src/dictogloss.ts` (`parseVttCues`, reducer, `markShared`, `nextDictoglossCue`; `test/dictogloss.test.ts`), `content/listening.ts` (`cuesFor`), `screens/DictoglossRun.tsx`, `e2e/dictogloss.spec.ts`.
- **Not done:** pair or group reconstruction (classic dictogloss), multi-talker human audio, teacher feedback.

## 2026-11-13 — repeated telling 4/3/2 after opinion cards (fluency-432)

- **Flow:** after a saved «Моя думка» card, «Розповісти тричі, щоразу коротше (4/3/2)»: the same opinion aloud three times with shrinking time — practice windows 120 / 90 / 60 s (a shortened 4/3/2 for B1 monologues, labelled practice). A countdown per round; «Я закінчив(ла) раніше» ends a round early; the learner may stop after any round.
- **Nothing recorded:** the microphone is not used. Only the learner's report of how the last round felt (easier / same / harder) is saved, ungraded (`<card>-fluency-432`).
- **Code:** `packages/domain/src/fluency.ts` (`FLUENCY_ROUNDS_SECONDS`, `fluencySecondsLeft`, `fluencyEvidence`; `test/fluency.test.ts`), `PracticeScreen` (`RepeatedTelling`), `e2e/practice.spec.ts` (frozen Playwright clock).
- **Not done:** a different listener each round (classic 4/3/2), any fluency measure, a measured effect.

## 2026-11-13 — mediation after reading and listening (cefr-mediation-paraphrase)

- **Flow:** after a LEARN reading text is saved, «Поясни комусь, що тут написано» (optional): choose the audience — in Ukrainian to a friend who reads no Finnish, or in simpler Finnish to a neighbour — and write the explanation with the text available again behind «Текст ще раз». A three-question self-check (who/what, when/where, what to do).
- **No model, no key:** nothing is compared automatically. Evidence is saved ungraded (`<item>-mediation`): a Ukrainian relay as reading comprehension, simpler Finnish as writing; commit + verified readback. EXAM texts never appear (LEARN pool only).
- **Code:** `packages/domain/src/mediation.ts` (`MEDIATION_MODES`, `MEDIATION_CHECK_UK`, `mediationEvidence`; `test/mediation.test.ts`), `screens/MediationStep.tsx`, `ReadingScreen`, `e2e/reading.spec.ts`.
- **After a dialogue (16.11.2026):** source `dialogue` with its own listeners and checks: `MEDIATION_MODES_DIALOGUE` (a friend who was not there; a neighbour) and `MEDIATION_CHECK_DIALOGUE_UK` (who talked and why, what was agreed, what happens next), via `mediationModes` and `mediationChecks`.
  - The conversation script opens only on request.
  - A Ukrainian relay of the written script is ungraded reading; simpler Finnish is ungraded writing.
  - `DialogueScreen` shows the step after a finished dialogue, before the graduated steps and the interlocutor ladder.
  - Test: E2E «mediation after a dialogue…».
- **Not done:** human feedback on the accuracy of the relay.

**Update 2026-11-15 — after listening.** The same step follows a saved LEARN listening lesson: «Поясни комусь, що ти почув(-ла)». The learner relays what was *heard*: the step shows no transcript, and the lesson's recording stays on the screen for a replay the learner starts. The wording follows the source (`mediationModes("listening")`: a friend who does not understand Finnish; simpler than the recording). A Ukrainian relay is stored as ungraded **listening** evidence, simpler Finnish as writing (`mediationEvidence(…, "listening")`); the checked answers of the lesson are untouched. Code: `ListeningScreen` done phase, `e2e/listening.spec.ts`. Not done: mediation after a dialogue or a multi-speaker recording.

## 2026-11-14 — strict CSP in the built web app; E2E entry helper

- **CSP:** `apps/web/csp-plugin.ts` adds a same-origin Content-Security-Policy and `no-referrer` as `<meta>` to the **built** `index.html` (the dev server is exempt: Vite HMR inlines scripts). No inline or eval code, no third-party origins; `blob:` only for images and media such as local recordings. `e2e/csp.spec.ts` asserts the policy and zero violations across the main screens. Tests that need 200 % text use CSSOM instead of injected `<style>`.
- **E2E helper:** `e2e/helpers.ts` `openLearn()` waits for Home's loaded progress before clicking «Навчання» (Home re-lays out when progress loads; an early click raced on CI Firefox).
- **Plan:** the ordered development plan lives in [29 — ТЗ](29-tz-development-plan.md). No deployment pipeline exists.

## 2026-11-14 — S2 reviewer workspace for every LEARN bank (docs/29 stage 1, code queue 1)

- **What:** `#review` is now a workspace for all 20 LEARN banks (449 review units: cloze, R08 drafts, the five practice banks incl. 132 chunks and 40 rektio, dialogues and partner moves, reading, writing clinic, listening lessons and the human story, picture missions, the diagnostic reading and listening (its writing and speaking prompts belong to EXAM and are held out), delayed-check banks, the nine theme files, LibriVox excerpts, legacy A1 audio-visual). A gate warns learners first, because the unit page shows keys, accepted variants and models.
- **Walk as a learner without touching progress:** «Пройти як учень» renders the real learner screen (MissionScreen, PracticeScreen, ReadingScreen …) on the real repository code, but on a throwaway IndexedDB database per walk (`storage/reviewSandbox.ts`), deleted when the walk ends; leftovers older than 12 h are cleaned. The learner database is never opened by the workspace (E2E reads it before and after).
- **Decision:** approve only with a complete review card (level, skills, communicative outcome, redistributable source, key and variants checked, transcript checked when there is audio, version, pseudonymous reviewer id, date) or return with categories and a reason — `packages/domain/src/review.ts` mirrors `scripts/validate_content_publication.py`. Decisions stay in this browser (read back after every write) until downloaded as `hospodar-review-decisions-v1`.
- **Into the repository:** `python3 scripts/apply_review_decisions.py FILE [--dry-run]` — all or nothing: known content file, exactly one item with the id, item hash still the one the reviewer saw; approve → card `s2_reviewed` with the item untouched; return → `draft` card with who/when/why; the whole publication gate must pass afterwards or every file is restored. The browser hash (`canonicalReviewJson` + `crypto.subtle`) equals the Python hash for every unit in every engine (E2E); integral floats are written as integers on both sides and sub-1e-4 decimals are refused on both.
- **Gate widened:** the publication gate now also covers `knowledge/dictionaries/**` (chunks, rektio); a returned draft card must name reviewer, date, categories and reason. `negotiation-moves-v1.json` got a root `id` so it can carry a card.
- **Not done:** no item is reviewed (needs a human S2 teacher); `published` and the release mode «learners get only published» are the next step (code queue 2); EXAM items are excluded here and reviewed in their own sealed process (stage 4); the app cannot verify that a reviewer is a qualified S2 teacher.

## 2026-11-14 — release channel: learners get only S2-published content (docs/29 stage 1, code queue 2)

- **Channel:** `VITE_HOSPODAR_CHANNEL=release` at build time makes a release build; anything else is the beta build used today (`packages/domain/src/release.ts` `releaseChannelOf`, `releasePool`; `apps/web/src/content/release.ts`).
- **Pools:** every learner pool goes through `learnerPool` in its content module: cloze, the five practice banks, dialogues (partner moves join only when that file is published), reading, writing clinic, listening lessons and the human story, picture missions, delayed grammar transfer, delayed skill checks (no checks at all if too few are published), LibriVox excerpts, the diagnostic (only when its reading block, first writing and first speaking task are published) and EXAM forms (only when every task they use is published). R08 stays published-only in every build. In a release build the R06 ranker no longer accepts labelled drafts.
- **App:** a learner view whose pool is empty shows «Ще не перевірено» (`screens/NotReviewedYet.tsx`) instead of the screen; Home says how many published tasks the build carries; `TrustNote` drops the draft prefix but keeps notes such as "no automatic grading"; `#review` and its footer link do not exist; draft video question seeds are hidden.
- **Beta:** unchanged content, every unpublished task labelled; the dialogue and listening labels now read the review card instead of legacy fields.
- **Publishing:** `scripts/publish_reviewed.py` moves `s2_reviewed` → `published` and approves the item's own pending markers; review-status markers are excluded from the content hash in both languages (`REVIEW_MARKER_KEYS`), so the card still certifies the reviewed content. Items with `script_only`/`NOT_VALID` markers (text-only dialogues, script-only listening) cannot be published until recorded or editorially changed and reviewed again.
- **Not done:** the release bundle still contains draft JSON (runtime filter); Ukrainian guidance texts (repair cues, place deeds, can-do lines) are editorial UI copy, not per-item reviewed content.

## 2026-11-14 — EXAM-11: the starting diagnostic no longer shows EXAM prompts

- **Problem:** the LEARN starting diagnostic showed the baseline file's writing and speaking tasks `d-w1`/`d-s1`, which EXAM mini rehearsal A uses (and `d-w2`/`d-s2` belong to rehearsal B), so a learner met the exam prompt before the exam.
- **Fix:** `apps/web/src/content/diagnostic.ts` keeps the baseline's reading block and takes the writing and speaking tasks from the theme files (`DIAGNOSTIC_PRODUCTION_IDS`: a formal message about language courses, a call to move an appointment) — neither is used by an EXAM blueprint or by the withheld delayed checks (`content/diagnostic.test.ts`, which fails on the old diagnostic). The draft fingerprint covers the whole diagnostic, so an unfinished draft from before is reported incompatible and offered for explicit discard; saved diagnostic records keep their old task ids.
- **Not done:** the legacy `app/` diagnostic still shows `d-w1`/`d-s1` (legacy app, not developed further).

## 2026-11-14 — interlocutor change in speech acts (pragmatic-speech-acts)

- **Flow:** after a saved «Реакція в ситуації» card, «Різні співрозмовники (за бажанням)»: the card's own situation for a friend, a neighbour the learner barely knows, and an official or employer, in turn. Each step: a Ukrainian cue for that listener, the learner's own Finnish reply, then a separate appropriateness self-check (three register questions, not content); saved ungraded through commit + verified readback before the next listener; stoppable. At the end the learner's own replies are shown side by side to notice what changed.
- **No invented rule:** the screen says many people in Finland use «sinä» with officials too; cues are an editorial draft pending S2 review. No model answer, no key, no score; the self-check is stored as a count (`<card>-register-<listener>`).
- **Code:** `packages/domain/src/pragmatics.ts` (`INTERLOCUTOR_LADDER`, `interlocutorEvidence`; `test/pragmatics.test.ts`), `screens/InterlocutorShift.tsx`, `PracticeScreen`, `e2e/practice.spec.ts`.
- **On dialogues (16.11.2026):** after every finished dialogue the same ladder takes the learner's role-play situation (`roleplay_transfer_fi`). It sits below the graduated steps and runs the same flow: three listeners, separate self-checks, replies side by side, each saved ungraded as speaking with the task id `<dialogue>-register-<listener>`. `hasInterlocutorLadder` accepts reaction cards and dialogues.
- **Not done:** the ladder on dialogues; human feedback on appropriateness.

## 2026-11-14 — graduated steps in the writing clinic and dialogues

- **Flow:** the optional «Ускладнити (за бажанням)» that followed practice cards now also follows a saved writing-clinic task (the same message: a concrete detail → linked ideas with conjunctions → a clear next step for the reader) and a saved dialogue (the own role-play: a reason → a question to the partner → a proposed next step). Constraints accumulate; each step is the learner's own Finnish, saved ungraded with a yes/partly/not-yet self-check (`<item>-step-<constraint>`); stoppable; no model or key appears.
- **Code:** `packages/domain/src/graduated.ts` (`StepUpTarget`, sequences `clinic` and `dialogue`; `test/graduated.test.ts`), `screens/StepUp.tsx` (extracted from `PracticeScreen`), `WritingClinicScreen`, `DialogueScreen`, `e2e/writing-clinic.spec.ts`, `e2e/dialogue.spec.ts`.
- **Not done:** constraints adapted to the learner's own performance; human assessment of the harder versions.

## 2026-11-15 — private real-life deed marks (real-world-interaction)

- **Flow:** under «Справа в реальному житті» on each place, «Я зробив(ла) це в житті» records a private mark (the local date); «Зняти позначку» removes it. Nothing is marked by default (MOT-03: opt-in with revoke).
- **Private and never graded:** stored in `localStorage` key `hospodar-yki:web:deeds:v1`, separate from learner progress (`LearnerState` is unchanged, so export/restore and the legacy-parity reader are untouched); never exported, counted, scored or turned into a door, key, streak or level. Erasing LEARN data on «Мої дані» also erases the marks (the option is enabled by marks alone); the data screen says marks are not in the backup.
- **Two tabs:** every change is applied to what is stored at that moment (`updateDeeds`), and open place screens refresh on the `storage` event, so a second tab never overwrites another tab's mark and an erase is never resurrected.
- **Code:** `packages/domain/src/deeds.ts` (`parseDeedLog`, `markDeed`, `unmarkDeed`; `test/deeds.test.ts`), `storage/deeds.ts` (readback-verified write, verified clear, `updateDeeds`, `onDeedsChanged`), `PlaceScreen` (`DeedMark`), `DataScreen`, `e2e/places.spec.ts`.
- **Reflection (16.11.2026):** after a mark, an optional private note can record how it went («Вдалося», «Частково», «Було важко») and what to say or do differently next time. The note holds at most 300 characters, in any language.
  - It is stored as `notes` in the same key and comes back at the top of that place on the next visit. When the deed did not go well, the place points to practising the situation first (self-regulated learning: plan → do → reflect → plan).
  - It can be changed, deleted, or removed together with the mark. The reader drops a note without its mark.
  - It is never scored, counted or exported. Code: `setDeedNote`, `clearDeedNote`, `deedNote`; `PlaceScreen` shares one deed state for the reminder and `DeedMark`.
- **Not done:** any measure of transfer to real communication; no human feedback on the note.


## 2026-11-15 — own memory cue on a problem phrase (keyword-mnemonic-retrieval)

- **Flow:** after a phrase or rektio card is judged «Частково» or «Інакше» (so it enters the 1/3/7/14/30 schedule), «Своя зачіпка для пам'яті (за бажанням)» lets the learner write a sound-alike word, an image or a situation, in any language. A phrase judged «Те саме» on first sight gets no field: the method's limitation says not to make a mnemonic for every word. On the next review the cue stays hidden. «Показати мою зачіпку (за бажанням)» shows it before answering, and the text the learner has already typed is kept. After the phrase is shown again the cue can be edited or cleared. Then comes the existing new-sentence transfer.
- **Honest evidence:** the cue is the learner's own note. It is never a key, never scored, and never changes the schedule. A first answer given after opening the cue is saved as `[own first answer, after opening own memory cue; …]`, still ungraded and self-compared.
- **Safe schema change:** `Card.ownCue?: string`. The field is optional, normalised (one line, 1–200 characters, no surrounding spaces) and has no version bump.
  - `readState` keeps a valid cue and drops a malformed one; the card and its schedule are always kept.
  - `updateCard` carries the cue through every review.
  - States and exports from before the change read and restore unchanged.
  - Export → restore is lossless.
  - `inspectWebLearnBackup` admits `ownCue` as the only extra card field, and only in normalised form. Anything else fails closed (`UNSAFE_LEARN_DATA`).
  - The legacy `app/core.mjs` never writes the field and its reader drops it; the parity divergence is pinned in `test/own-cue.test.ts`.
  - The V1 legacy import stays strict: legacy data has no cue.
  - Erasing LEARN data erases the cues with the cards.
- **Code:** `packages/domain/src/learner.ts` (`OWN_CUE_MAX_CHARS`, `isOwnCue`, `normaliseOwnCue`, `withOwnCue`), `practice.ts` (`SHOW_CUE`, `SET_CUE`, `completePractice`), `dataRestore.ts`, `test/own-cue.test.ts`, `screens/PracticeScreen.tsx`, `e2e/practice.spec.ts`, `e2e/restore.spec.ts`.
- **Not done:**
  - cues for grammar-mission cards or for words met in reading;
  - guidance on cue quality;
  - fading: opening the cue does not change scheduling;
  - the 14-day recall/use study (the evidence is one EFL experiment).

## 2026-11-15 — «План заняття» on 10, 20 or 30 minutes (docs/29 stage 3; DEC-01)

- **Flow:** under the next-step card on Home, «Або склади план заняття: 10 / 20 / 30 хв». Choosing a length replaces the card with the plan, so Home still has one main action (UIO-01). Each block shows:
  - what to do and roughly how long it takes («≈ N хв»);
  - why now;
  - how much is done since the plan was made;
  - a «Почати»/«Продовжити» button that opens the exact task: a due phrase card, a due grammar task, the delayed checks, «Майстерня», or a specific reading text, recording, writing task or dialogue.
  - Only the current block's button is primary.
  - The learner may change the length, choose the skill and the place (topic) for new tasks, skip any block, or close the plan.
- **Order (pure, deterministic — `packages/domain/src/sessionPlan.ts`):**
  1. Повторення: due delayed 7/14/30 checks → phrases not recalled → scheduled grammar, at most 10 minutes. The rest is shown as «іншим разом, надолужувати не треба», never as a catch-up quota (MOT-04).
  2. Слабке місце: the «Майстерня» set of a family with repeated first-answer errors; a re-test comes first.
  3. Нова справа: never-tried LEARN tasks ranked by the parity-tested R06 ranker over the four YKI skills. Equal scores follow the «Сьогодні» skill order. Several new tasks go to different skills unless the learner chose one.
  - From 20 minutes on, 10 minutes are kept for something new.
  - No task longer than the time left is offered (R6-04). A choice that cannot fit is said honestly («не вміщується в час, що лишився»).
  - Minutes are editorial estimates (reading/listening 8, dialogue 10, writing 15), not measurements.
- **Honest signals:**
  - Reasons cite only saved evidence or the learner's own choice: never practised / least practised (saved answers, i.e. exposure), due today, re-test due, chosen skill/place.
  - No level, score, readiness, streak, timer or notification.
  - Writing and speaking stay ungraded.
  - A block counts as done only from evidence saved after the plan was made, and only from the task's final evidence (reading `-transfer`, writing-clinic `-transfer`, dialogue `-roleplay`, listening questions written at the end). A writing draft saved before the model and rewrite marks the task as tried, never as done.
- **Storage:** none. The plan lives in App memory for the page visit (MOT-11); a reload forgets it; erasing or importing LEARN data closes it. Candidates come only from LEARN pools that already exclude EXAM items and, in a release build, unpublished items.
- **Code:** `packages/domain/src/sessionPlan.ts` (`planSession`, `blockProgress`, `skillExposure`; `test/session-plan.test.ts`), `apps/web/src/content/session.ts` (+ `session.test.ts`), `screens/SessionPlanPanel.tsx`, `HomeScreen`, `App`, `e2e/session-plan.spec.ts`.
- **Not done:**
  - the R08-MOT if-then plan with a personal cue;
  - opt-in reminders (none exist);
  - skill prerequisite chains;
  - any measured effect of plans on delayed Finnish outcomes.

## 2026-11-15 — form language «Господарська книга»: no generated-UI sameness (DESIGN-11, DESIGN-02)

- **What changed (apps/web only; the legacy `app/` keeps its earlier look):** the stylesheet's form language, two bundled typefaces, and nothing else. No screen structure, copy, colour token, answer policy or storage changed.
- **Removed, because they are the stock forms of generated interfaces:**
  - grids of identical rounded cards;
  - an accent stripe down the left edge of a box (15 uses);
  - pill badges;
  - small uppercase tracked labels;
  - the system font as the only voice;
  - the guide's speech bubble.
- **Instead (rules in [brand identity §9](../brand/identity-v03-screen-system.md#9-мова-форми-v04--господарська-книга-15112026)):**
  - Sheets are square and hang from rules. Lists are ruled register rows with a chevron: places, skills, exercises, a place's tasks, text lists.
  - Skill or state colour sits on the rule above a block and on the icon.
  - One signature per screen: the H-mark's bottom-right cut with the gold step along it. It sits on the next-step / plan sheet on Home and on the task sheet elsewhere. The exam, calm mode and the reviewer's nested sheet have no gold; forced colours get a real border and no cut.
  - Two voices: Ukrainian in Arsenal, Finnish always in Finlandica (`[lang="fi"]`), so the target language is visible at a glance.
- **Fonts:**
  - `apps/web/src/fonts.css` declares six woff2 files (about 92 KB) from `@fontsource/arsenal` and `@fontsource-variable/finlandica` (SIL OFL 1.1, see [LICENSING](../LICENSING.md)).
  - Vite emits them into the build; the offline shell already precaches `woff2`; CSP stays `font-src 'self'`.
  - `font-display: swap`, with the system font as fallback.
- **Guards:**
  - `apps/web/src/design-language.test.ts` (static): stripes, radius, uppercase, shadows, gradients, where the cut may be, fonts from the package only.
  - `apps/web/e2e/design.spec.ts` «DESIGN-11 authored form language…» (rendered Home, a task and the exam): both faces really loaded, no rounded element or left stripe, exactly one cut per screen, no request to another origin.
  - Two existing tests now read the skill colour from the rule above the block (`border-top-color`) instead of the removed left stripe.
- **Not done / not claimed:**
  - no review by a human designer;
  - no recognisability study (DESIGN-06/15);
  - no screen-reader or real-device check of the new faces;
  - the nine places still share one door glyph;
  - illustrations in one human-made style (DESIGN-07) are still to come.

**Update 2026-11-16 — the form language checked against learning research ([research/design №20](../research/design/20-form-language-typography-evidence-2026-11.md)).** The owner asked that the design follow the evidence on learning, not only look authored. Eight claims were checked with their counter-evidence; five changes followed:

- **No decoration on a task sheet (COG-07, ATT-01, COLOR-20).** The gold step added to every task sheet in the first version was a seductive detail. It is removed: gold now appears only on Home; a task sheet keeps the quiet cut with no colour.
- **One apparent size.** `font-size-adjust: 0.53` scales every face to the same x-height (measured: Arsenal 0.50, Finlandica 0.50, Arial 0.53), so Arsenal is no longer about 9 % smaller than the fallback and a font swap does not move the layout. Body text is 17 px in `rem`.
- **Readable measure.** Long Finnish text is limited to 31em (about 65–70 characters) at regular weight.
- **Rows look clickable.** Every row that opens a place, skill, exercise or task carries the same chevron.
- **The learner's own font.** «Шрифт» in the footer switches both languages to the device font (`appearance.ts`, `localStorage` key `hospodar-yki:web:font`, presentation only).

Kept after checking: Finlandica for Finnish, because it tells I, l and 1 apart ("Illalla", "Ilta"), which the system font of the test environment does not. Rejected: hard-to-read fonts as a memory aid. Not claimed: that any of this improves learning — no user study was run. Guards: three new static tests and two E2E tests in `design-language.test.ts` and `e2e/design.spec.ts`.

## 2026-11-16 — «Перший запуск»: two modes, an optional real-life goal, an optional diagnostic (docs/29 stage 3, code queue 8; MOT-02, MOT-11)

- **When:** only for a learner with nothing saved on the device: no attempts, diagnostics or retention checks, and no goal record. A learner who already has data never sees it, even if the goal record is lost (`shouldWelcome` in `packages/domain/src/goals.ts`). The welcome takes the place of the next-step card, so Home still has one main action (UIO-01), and focus moves to its heading.
- **What it says:**
  - what the app is: no account, everything stays on this device;
  - the two modes in plain words: LEARN (own answer first, then help, self-repair, a new situation; review after 1/3/7/14/30 days) and the YKI rehearsal (no hints, results only at the end, «Це не офіційний YKI»; the 2027 digital rules are not confirmed).
- **What it asks:** «Що тобі треба робити фінською?». Optional, several allowed: the nine life places or «Скласти іспит YKI». It never asks for a level, age or country, and it never shows a level. Two buttons:
  - «Почати з короткого знайомства» opens the existing starting diagnostic;
  - «Без знайомства — одразу до справ» goes straight to Home.
- **Storage:**
  - Nothing is stored until a button is pressed.
  - Then `localStorage` gets `hospodar-yki:web:goals:v1` = `{version:1, goals, seen}`, with readback; a refused write is reported and the welcome shows again next time.
  - A damaged record reads as no record. Unknown goals are dropped and the order is fixed.
  - Other tabs follow via the `storage` event.
  - The record is not part of the export: like the deed marks, it is a preference, not learning evidence.
  - «Мої дані» → erase LEARN clears it with the progress (verified), so the device is new again.
- **Effect:** «Моя мета» on Home shows the goals, with «Змінити мету» (save or cancel). Place rows say «твоя мета». In «План заняття» the goal places are preferred among new tasks with equal skill balance (+2 preference in the R06 ranker), with the visible reason «це місце — твоя мета». A place the learner chooses explicitly wins over goals. Skill balance and «review first» are unchanged. The YKI goal changes no ranking, so it opens no EXAM item in LEARN.
- **Code:** `packages/domain/src/goals.ts` (+ `test/goals.test.ts`), `sessionPlan.ts` (`goals`, `GOAL_PLACE`), `apps/web/src/storage/goals.ts`, `screens/Welcome.tsx` (`Welcome`, `MyGoals`), `HomeScreen`, `SessionPlanPanel`, `DataScreen`, `App`.
- **E2E:**
  - `e2e/first-run.spec.ts` covers the new learner.
  - All other specs start from `e2e/state/returning-learner.json`, an empty goal record set as the global Playwright `storageState`, so they open Home as before.
  - `data.spec` now expects the welcome after a LEARN erase.
- **Not done:**
  - the R08-MOT if-then plan with a personal cue («коли …, я …»);
  - a weekly time goal;
  - opt-in reminders;
  - any measured effect of a goal on practice or delayed Finnish outcomes (MOT-STUDY not run).


## 2026-11-16 — one set of media rules on every screen with audio or video (docs/29 stage 3; R7-05, R7-03, AUD-03, UIO-10)

- **Rules (pure, `packages/domain/src/mediaRules.ts`):**
  1. The learner starts the sound: nothing autoplays; a task loads nothing ahead.
  2. Own answer first: text appears after the answer, or on request as help.
  3. Help makes the attempt ungraded: in a LEARN task, text or a slower speed before answering is allowed for accessibility; the answers are then saved as supported, never as a failure or independent evidence.
- **Contexts (`mediaRules(context)`, `rateVerdict(context, rate, supportRecorded)`):**
  - `learn-task`: before the answer is saved.
  - `learn-after`: review, mediation, after the answers.
  - `exam`: no help at all; the speed is locked at 1× because a speed aid is not an OPH-verified 2027 feature. Replay stays unlimited and labelled practice.
  - `own-recording`, `library`: rule 1 only.
- **One task player (`apps/web/src/ui/TaskAudio.tsx`)** is used by the listening mission, the delayed listening check and the EXAM rehearsal:
  - `preload="none"`, no autoplay;
  - the browser's own speed menu is hidden (`controlsList="nodownload noplaybackrate"`);
  - a speed changed by any other route (browser, shortcut, extension) is checked on `ratechange`. In a LEARN task a slower speed is put back to 1× and handed to the screen, which records the help durably first and only then plays at 0.75×. In the EXAM any change goes back to 1×.
  - Before this, a slower speed chosen in Chrome's own player menu was not recorded as help.
  - Also fixed: after the answers (review), «0,75×» used to fail with «Цей крок зараз недоступний», because it tried to record help that is no longer possible. It now just plays slower and is no longer labelled «(підтримка)».
- **Delayed listening check (`skillRetention.ts`):**
  - The same 1× / 0.75× choice as the mission. Slower is recorded as `support: ["slow"]` and the diagnostics say `[supported: slower]`; text keeps its earlier label `[supported: text shown]`; both give `text shown + slower`. All of these are ungraded.
  - Fixed while doing this: any support used to switch on the text and allow answering without listening. Now only the text does that; a slower speed still has to be listened to.
  - The session object is never stored, so no migration is needed.
- **Guards:**
  - `apps/web/src/media-rules.test.ts` (static) registers every `<audio>`, `<video>` and `<TaskAudio>` in the source with its context and its E2E test. A new media element fails until it is registered. It also forbids `autoplay` and `.play()` outside the dictogloss button. Mutation-checked: autoplay, a raw `<audio>` in a task, or a visible speed menu each fail it.
  - `e2e/media-rules.spec.ts` checks every surface rendered: the listening mission (before and after the answers), the delayed check, dictogloss, the EXAM listening item and the media library.
  - `packages/domain/test/media-rules.test.ts` covers the pure rules and the delayed check.
- **Not done:**
  - UIO-02 (pause at a semantic boundary before a question): it needs human-verified segment boundaries;
  - verified OPH 2027 replay/pause/seek rules for the EXAM;
  - screen-reader and real-device checks of the players.

## 2026-11-16 — UIO-06: one picture of a place for the inner location cases (docs/29 stage 3 exit: UIO rules under test)

- **What:** in the LEARN cloze mission's feedback, after the first attempt, a closed «Схема: де? звідки? куди?».
  - Opened on request, it shows a square house and the task's own relation: a dot inside (`missä?`, -ssa/-ssä), an arrow out (`mistä?`, -sta/-stä) or an arrow in (`mihin?`, -Vn/-hVn/-seen).
  - The learner may pick another relation to compare.
  - An equivalent static table with all three relations and the task's own form sits beside the picture.
- **When:** only for a task whose tag is inessive, elative or illative and whose editor wrote a spatial meaning (`semantic_relation_uk`). Today that is three items (kirjastoon, kaupasta, koulussa). "bussilla" (adessive of means) and an elative without a place meaning get no picture, so the picture never teaches a wrong meaning. Never while answering, in repair or in the new-situation step (R7-06); never in EXAM.
- **Rules kept:**
  - no motion at all;
  - keyboard buttons with `aria-pressed`;
  - the SVG has a text description that changes with the choice;
  - colours from tokens, square shapes, no gold on the task sheet;
  - the only Finnish shown is the task's own key, plus question words and endings (grammar metadata, not new answer keys).
- **Code:** `packages/domain/src/locationCases.ts` (+ `test/location-cases.test.ts`), `apps/web/src/ui/LocationScheme.tsx`, `MissionScreen` feedback, `e2e/location-scheme.spec.ts`.
- **Not done:**
  - outer cases (-lla/-lta/-lle);
  - pictures for other grammar families;
  - UX-I03, the controlled comparison of picture vs static explanation (not run).

## 2026-11-16 — the exam runs by rules from its profile, each with its status on screen; focused mode (docs/29 stage 4, queue 9 part 1)

- **Rules as data (`packages/domain/src/examRules.ts`):** for each of the 18 critical parameters, `resolveExamRules(profile)` returns:
  - **verified:** the pinned profile has a verified record (source, date, reviewer, scope) with a value of the right type. That value is used and shown with its date.
  - **practice:** otherwise. `PRACTICE_RULES` says what the simulator does today, labelled practice. An unknown rule is never guessed.
  - **applied:** `ENGINE_APPLIES` lists the parameters whose verified value the engine reproduces today: going back, spellcheck, paste, counter and the speaking windows. A verified value for any other parameter is shown as «спостережено…, симулятор ще не відтворює — діє тренувальне», never as reproduced.
- **Profile check:** `validateExamProfile` now refuses a verified value of the wrong type (`INVALID_VALUE`, e.g. "maybe" for a yes/no rule). `PARAMETER_TYPES` lives in `examProfile.ts`.
- **Engine (`ExamScreen`):**
  - «Edellinen» appears only if going back is allowed.
  - The writing editor takes spellcheck, paste blocking and a word/character counter from the rules.
  - The rules panel «Правила цієї спроби: N з 18 підтверджено, M тренувальних» lists every rule with its value and status. It is a closed Ukrainian system notice outside the Finnish exam content.
  - Today all 18 are practice: no OPH demo walkthrough has been recorded (human queue, TZ-EXAM-01).
- **Focused mode (TZ-EXAM-17):** while an attempt is open, App shows the brand as plain text («Зосереджений режим репетиції») and hides the calm toggle, theme, font, guide and reviewer links. The footer keeps the "not official YKI" line. The way out is the exam's own «Keskeytä ja jatka myöhemmin», enabled only when everything is saved; the attempt resumes as interrupted (EXAM-10). Results end the focus.
- **Tests:**
  - `packages/domain/test/exam-rules.test.ts`: today's profiles, a verified and applied rule, a verified but not applied rule, a wrong type, practice/live never claiming;
  - `e2e/exam-rules.spec.ts`: rules list, editor rules, focused mode with leave and resume;
  - `design.spec` DESIGN-12 now leaves the attempt via «Keskeytä».
- **Not done:**
  - per-subtest timers and on-expiry from the profile;
  - number of listening plays and pause/seek from the profile;
  - the review screen and section locks;
  - recording start and re-record rules;
  - the values themselves, which need the OPH demo walkthrough by a person.

**Update 2026-11-16 — part 2: listening plays, pause/seek and a review screen from the profile or the learner's practice choice.**

- **Practice choices:** the PRACTICE profile is the learner's own settings (docs/21). Before starting, «Тренувальні правила» lets the learner choose:
  - how many times a recording may be played: no limit, 2 or 1;
  - whether going back is allowed;
  - whether a review screen of all answers comes before finishing.
  - They are stored in the session (`practiceChoices`) and listed in the rules panel as «тренувальне правило, яке ти обрав(ла) перед стартом». A verified profile value always wins over a choice.
- **Listening plays:** `recordPlay` counts plays per recording (`session.plays`) and refuses one when they are used up. The machine's `AUDIO_PLAYED` persists the count before anything else changes, so a reload never gives a play back. A damaged count reads as used up (99).
- **Counted player:** with limited plays or pause/seek off, the exam uses its own player with no seek bar: «Kuuntele äänite (jäljellä N)», plus «Tauko/Jatka» if pausing is allowed. The play is counted first. The static media test now allows `.play()` only in that button handler and in dictogloss.
- **Review screen:** with a review screen, «Lopeta koe» first lists every task as vastattu/vastaamatta. Jumping to a task works only when going back is allowed.
- **Rules now applied:** `ENGINE_APPLIES` adds `listening.plays_allowed`, `listening.pause_seek` and `navigation.review_screen`.
- **Old sessions:** sessions without the new fields load unchanged (legacy parity kept).
- **Not done:**
  - per-subtest timers and on-expiry;
  - section locks;
  - recording start and re-record rules;
  - human multi-speaker audio.

## 2026-11-16 — saved synthetic recordings become LEARN listening (CURATED-09, code queue 10 part 1)

- **What:** `learning/exercises/b1/audio-training/index.json` (23 lessons, 37 Piper TTS files that no screen used) feeds `trainingLessons` in `apps/web/src/content/listening.ts`. These lessons are now part of `allListeningLessons`, the listening list and the places:
  - the nine theme dialogues and nine theme notices sit in their place (topic by theme number);
  - the inference texts 004 and 005 appear in the listening list with no place.
- **Rules kept:** the same mission and media rules as every lesson:
  - audio first; transcript only after the answers;
  - labelled synthetic, one voice; S2-pending draft label in beta; release builds keep only published items.
- **Question mapping:** true/false questions become «Oikein/Väärin» choices. Open questions are left out, because the mission is choice-only.
- **Other tempos:** the notice's slower recording (0.87×) and the inference text's faster recording (1.12×) are offered only after the answers, as «Повільніший/Швидший запис» in review. During the task, slower is still recorded help (media rules).
- **Held out:** the inference texts 001–003 are the delayed reading checks (`heldOutReadingIds`, now one shared domain function used by `buildSkillRetentionBank`). Their recordings never become LEARN listening and are registered as `HELD_OUT`. The reviewer workspace bank «Аудіювання: короткі записи…» lists only what learners can see.
- **Effects:**
  - the YKI map's listening gaps are closed (9 gaps → 4, all writing; 27 → 32 cells with material);
  - «Житло» gets a full «Ціла справа»;
  - the delayed listening check has more unseen lessons.
  - Places, reviewer and map tests were updated to these numbers deliberately.
- **Tests:** `apps/web/src/content/listening.test.ts`, the E2E «saved theme recording (CURATED-09)…» in `e2e/listening.spec.ts`, updated `places.test.ts` / `yki-map.spec.ts`; `scripts/validate_material_usage.py` (register: 26 entries).
- **Not done:**
  - open questions of the inference texts as a listening task;
  - several voices: still one synthetic speaker, not a substitute for licensed multi-talker audio (R05).

**Update 2026-11-16 — part 2: corpus sentences as «Форма слова в реченні» practice cards.**

- **Source:** `learning/exercises/b1/grammar/ftb-frequency-cloze-v1.json`, 120 sentences from UD Finnish FTB (CC BY 4.0) with one word form removed, loaded by no screen. They are now the practice kind `form` (`formCard` in `packages/domain/src/practice.ts`).
- **The card:** the sentence with a gap and the lemma in brackets. After the own attempt it shows:
  - the corpus form and the whole sentence;
  - the note that another natural form may be right;
  - the source line: «UD Finnish FTB … CC BY 4.0 · адаптовано: одне слово замінено пропуском».
- **Not scored:** the corpus keeps one form, so the first answer is self-compared, never scored (the data set's own limits: alternative forms exist; S2 curation before release, and release builds keep only published items). A card whose form would already be visible in the prompt is filtered by the leak guard.
- **Elsewhere:** the reviewer workspace has the bank «Форма слова в реченні», 22 banks in all.
- **Tests:** `practice.test.ts` (source named, no score, Finnish grammar terms as group names) and the E2E «corpus form card (CURATED-09)…».
- **Not done:** S2 curation of literary or archaic sentences; not spaced like chunk/rektio cards.

**Update 2026-11-16 — part 3: tense and clock lessons as «Час дієслова й годинник» practice cards.**

- **Source:** `learning/exercises/grammar/tenses/lessons.json` (4 tense explanations, 8 choices and 1 open item) and `time-and-clock/lessons.json` (4 examples, 3 choices). No screen loaded them.
- **The cards:** they are now the practice kind `time` (`tenseCard`, `clockCard`). The learner chooses first; that choice is scored like any keyed choice, as reading. Then comes the explanation:
  - for tenses: the tense's form and examples;
  - for clock items: the matching example.
- **Pictures:** a card may carry an `illustrationId`. `PracticeScreen` shows that picture from the illustration library with its credit, only in the reveal, because it shows the answer:
  - the tense timeline for tenses;
  - the clock face whose time is the answer for clock items. No picture is invented for 9.45.
- **Open item:** the open pluperfect item becomes the new-situation prompt of the pluperfect cards. The own sentence stays ungraded.
- **Elsewhere:** reviewer banks «Часи дієслова» and «Годинник і час» (24 banks). Release builds keep only published items.
- **Tests:** `practice.test.ts` (counts, scored choice, ungraded rest, picture only after the attempt) and the E2E «clock card (CURATED-09)…».

**Video questions and writing criteria (CURATED-09 part 4, 16.11.2026):**
- `content/media.ts` loads `learning/exercises/video/exercises.json`. In the media library each open video, playable or link-only, shows its questions in Finnish (gist, detail, opinion), with the Ukrainian wording in a `<details>` on request. There is no answer key, and the note under a playable video is the learner's own Finnish answers, ungraded. Reviewer bank «Питання до відео» (25 banks).
- `content/writingClinic.ts` loads `feedback-rubrics.json` for the criteria **labels only**. The rewrite step of the writing clinic shows them as a wider self-check «не бал і не шкала YKI». The internal weights are heuristic, not OPH, and never shown. The file holds no Finnish, so it is in `NO_FINNISH_FILES`, not a reviewer bank.
- **Tests:** E2E «video questions (CURATED-09)…» and «writing criteria (CURATED-09)…».

**Masterclasses (CURATED-09 part 5, 16.11.2026):**
- `packages/domain/src/masterclass.ts`: `toMasterclass` (refuses a lesson without two keyed questions, a repair, a response and a transfer, or whose text already prints the better version or the model), the phase machine check → checked → repair → repaired → respond → model → transfer → done, `masterclassView` (keys after both answers, better version after the own repair, model after the own answer, no text or model in the transfer) and `masterclassEvidence`. Only the two keyed questions are scored, as **reading**: the listening masterclasses show a teaching text, not a transcript, so they never count as listening. Repair, response and transfer are ungraded; the comparison list is the file's feedback dimensions as Ukrainian labels, never weights.
- `apps/web`: `content/masterclasses.ts` (release builds keep only S2-published lessons), `MasterclassScreen` (Home → «Майстер-класи»; verified save of the finished lesson only). A listening masterclass offers its recording's own listening lesson first. Reviewer bank «Майстер-класи» (26 banks).
- **Tests:** `packages/domain/test/masterclass.test.ts`, E2E `e2e/masterclass.spec.ts`.

**Where to learn next (CURATED-09 part 6, 16.11.2026):**
- `admitCatalogLink` in `packages/domain/src/media.ts`: https only, no credentials or port, host on `CATALOG_LINK_HOSTS` (Yle, Yle Areena, Kielibuusti, Finna, Suomi-koulut, OPH, aoe.fi), never official YKI material. Competitor platforms are not on the list, so the comparison-only entries of `independent-sources.json` never reach learners.
- `content/learnMore.ts` builds three groups from `sources/publishers/publisher-series-catalog.json`, `publisher-episode-catalog.json` and `independent-sources.json` (Ukrainian `why_uk` in each catalog). The media library tab «Зовнішні джерела» shows them as ruled link rows above the YouTube cards. Nothing is downloaded, copied or embedded; draft Finnish prompts appear only in beta builds. `independent-sources.json` holds no authored Finnish, so it is in `NO_FINNISH_FILES`.
- **Tests:** `media.test.ts` «where to learn next…», E2E «where to learn next (CURATED-09)…».

**Missions with an external source (CURATED-09 part 7, 16.11.2026):**
- `packages/domain/src/externalMission.ts`: `toExternalMission` reads the three mission catalogs in `sources/`. A mission is refused if it is official YKI, not marked usable, missing a task field, or its link fails `admitCatalogLink`. Audio and video kinds are listening; slides, PDFs and written dialogues are reading.
- Phases: open → reflect → transfer → done, or `not_found` with nothing saved. Where the publisher's teacher page shows the answers, only the audio index is linked before the learner's own answer; the teacher page comes after it.
- Evidence: two ungraded records. The app never hears the recording the learner chose, so nothing is scored.
- `apps/web`: `content/externalMissions.ts` (release: published only) and `ExternalMissionScreen` (Home → «Місії із зовнішніми джерелами»).
- **S2 review:** the three mission catalogs are `REVIEWABLE_SOURCE_CATALOGS` in `scripts/validate_content_publication.py`, mirrored in `reviewBanks.ts` and kept in sync by a unittest. The publication gate, `apply_review_decisions.py` and `publish_reviewed.py` treat them like content files; any other `sources/` file is refused. The reviewer workspace has three banks for them, «Місії: …» (29 banks). A release build shows a mission only after it is published.
- **Tests:** `packages/domain/test/external-mission.test.ts`, E2E `e2e/external-missions.spec.ts`.

**What the exam looks like (CURATED-09 part 8, docs/29 stage 4, 16.11.2026):**
- `packages/domain/src/examLook.ts` builds three groups from `sources/official/yki-mock-simulation-sources.json`:
  - two OPH pages;
  - five SOLKI organizer example pages;
  - five practice videos.
- Link rules: https on `EXAM_LOOK_HOSTS` only; Ukrainian `title_uk`/`note_uk` required; a "verified 2027 mock" claim is refused.
- A video with model answers says the time they start, so the learner answers first. The A1–A2 story videos are left out because they are not exam simulations.
- `ExamLook` is a `<details>` on the rehearsal set-up screen only, never inside an attempt. It says that examples are not past exam items and that old formats are not the 2027 digital exam.
- **Tests:** `exam-look.test.ts`, E2E «exam look (CURATED-09)…» in `exam-rules.spec.ts`.
