# Hospodar YKI — MVP architecture and implementation checklist

## Product architecture extension: shared skills, distinct mode policies

The **canonical product-mode & module-choice requirements** are [docs/15-two-modes-skill-scopes.md](15-two-modes-skill-scopes.md) and the matching machine-readable [session scopes](../research/product-session-modes-v1.json). This is a **target architecture**, not a claim that the full selector is in the current app.

```text
ModePicker (LEARN | EXAM)
   └── SkillScopePicker (ALL or individual READING/LISTENING/WRITING/SPEAKING)
       ├── LEARN: adaptive_mix | structured_all | single_skill | custom_mix
       │    └── LearningPlanner → question → feedback/self-repair/transfer → SRS
       └── EXAM: full_exam | single_subtest | practice_subset | official_partial_profile
            └── ExamBlueprintAssembler → timed/untimed rehearsal → delayed per-skill result
```

**One content registry; two policies.** Shared canonical skill IDs: `reading`, `listening`, `writing`, `speaking`. All item records need provenance, item version, exposure flag and `assessment_eligibility`. Independent `held_out_exam` items must not be exposed to students by training mode before unseen assessment. No training-only shortcuts inside exam policy.

**Selector invariants:** `adaptive_mix` and `structured_all` have four skills; `single_skill` and `single_subtest` have one; `full_exam` has four; custom practice subsets have two or three. `official_partial_profile` allows one or two skills drawn strictly from `allowedSkills` for a verified OPH date (not an arbitrary calendar booking). Order/timing/replay are official only if separately evidenced.

**Persistent data:** `selectionByMode` + separate `learningAttempts`, `srsCards`, `practiceExamAttempts`, `skillEvidence`, with schema migration/version and export/delete. Do not combine objective mock accuracy with subjective writing/speaking into one purported YKI grade.

**Implementation status:** existing `app/index.html` contains a mission, and `app/exam.html` contains 9-item 4-skill rehearsals. A fully implemented home mode picker and single-module route, a four-skill adaptive planner, true full-length digital exam and official-profile feature are **still planned**. See [acceptance scenarios](15-two-modes-skill-scopes.md#7-критерії-приймання-матриця-тестування-не-декларація-виконання).

## Decision record (2026-10-21)

**Stage 1 architecture: zero-build browser ES modules** (`app/index.html`, `app/core.mjs`, `app/app.mjs`, `app/styles.css`). The existing repository is content-first, not a frontend project. No backend, Node package downloads or paid speech API is needed for a truthful runnable vertical slice.

**Source of truth:** existing `content/b1/grammar/contextual-cloze.json`, `content/b1/diagnostics/baseline-v1.json`, `content/b1/contextual/reading-pack-v1.json`, `content/b1/audio-long/lessons.json`. App loads these relative to project root with fetch. JSON files contain generated uncalibrated materials; UI must show training-only label and pending language review. Do not paste the content into JS to make competing copies.

**State:** versioned localStorage document `hospodar-yki:mvp:v1`. Pure core library handles normalization, scoring, spaced scheduling, diagnostics, error events. Browser layer renders routes and manages audio/voice. No storage of microphone blobs after page unload, no remote calls. JSON export and delete are available. On unreadable storage, start clean and show warning. This is private per browser/device but not encrypted at rest; browser removal deletes local data.

**CI:** Node's built-in test runner and static source/content checks in GitHub Actions, avoiding third-party test runtime and external credentials.

## Data contract

```ts
type LearnerStateV1 = {
  version: 1;
  attempts: Array<{ taskId: string; firstAnswer: string; secondAnswer?: string;
    firstCorrect: boolean; repairCorrect?: boolean; transferText: string;
    completedAt: string; skill: "grammar"; }>;
  cards: Record<string, { stage: number; due: string; reviews: number;
    failures: number; lastCorrect: boolean; lastReviewed: string }>;
  diagnostics: Array<{ skill: "reading"|"listening"|"speaking"|"writing";
    taskId: string; correct?: boolean; status: "scored"|"ungraded";
    completedAt: string }>;
  errors: Array<{ taskId: string; grammarTag: string; at: string }>;
};
```

**SRS scheduler:** first correct independent recall → stage + 1, interval [1,3,7,14,30] days; first incorrect → reset to stage 0/due tomorrow. A guided correction cannot replace independent recall. This is an explicitly provisional heuristic, not FSRS or a claim about YKI pass probability.

## MVP data flow

1. User opens learning mode; `fetch` the existing JSON corpus. Never expose `answer_fi` until submission.
2. `core.checkCloze` checks Finnish form and declared alternatives only. Error first triggers guided retry with no answer.
3. Show feedback and a **new-transfer task**; transfer is an ungraded text submission and is logged separately from the first attempt score.
4. On completion `core.completeMission` produces a new immutable state, SRS card, optional confirmed grammar error, capped history. Save to localStorage; export or erase via explicit controls.
5. **Diagnostics:** reading scored through verified answer keys; listening uses real existing audio not script-only baseline; writing/speaking ungraded. The UI must not produce CEFR/B1 estimates from 1–2 tasks.
6. **Audio player:** synthetic originals marked synthetic, real speech marked real. Transcript hidden until user chooses to reveal after a first response. MediaRecorder uses explicit permission and ephemeral memory only.
7. **Exam-like rehearsal:** separate training route; only publishes real official schedules and explicit training approximation. Unpublished timer/recording constraints remain unset.

## QA / acceptance

- [ ] First incorrect answer does not show key; guided retry then key and explanation.
- [ ] Completion is impossible with empty transfer.
- [ ] First-try success schedules longer SRS than failed first attempt after repeated reviews.
- [ ] Corrupted localStorage recovers with clear warning; history capped.
- [ ] Reopen the browser: cards, errors and diagnostics remain (when storage is allowed).
- [ ] Reading/listening objective items are scored; speaking/writing never auto-graded.
- [ ] Voice recording requires active permission; text fallback if unsupported.
- [ ] All user content remains local, including exports. No auto-upload.
- [ ] Tests pass on every PR and main push.
- [ ] Test on actual mobile browser; complete S2 review before public release.

## Future architecture (explicitly **not** built)

Once usage/learning efficacy and compliance are proven: TypeScript + componentized frontend, offline-capable PWA, vetted speech capture and server-assisted scoring behind an auditable adapter, Postgres row-level access control for opt-in multi-device sync, job queues for consented speech evaluation. Require authentication/threat modeling, GDPR data-processing register, deletion/export, human-rated evaluation set, versioned content publish pipeline, and tracing stripped of raw learner PII.

## Run locally

From repository root: `python3 -m http.server 8080`. Then open `http://localhost:8080/app/`.
Tests: `node --test app/tests/*.test.mjs` (Node 20+).
**Do not** double-click `app/index.html` via file:// — browser fetch security blocks JSON requests.

**Status:** this architecture document is for MVP scope, not evidence of a deployed service.
