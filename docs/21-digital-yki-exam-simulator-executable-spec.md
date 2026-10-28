# 21 — Hospodar YKI Digital Exam Emulator: executable fidelity specification v2

**21.10.2026** · Ціль: максимально достовірна **самостійна** цифрова симуляція `YKI suomi keskitaso` з чотирма незалежними модулями. Чесна межа: **strict exact-2027 OFF**, поки OPH не підтвердить відповідність цифрових демонстрацій фактичним правилам UI/playback/timing живого іспиту 2027 та це не буде перевірено.  
**Джерела:** [20 — детальний фактчек](../research/yki/20-yki-official-complete-audit-2026-10.md), [official evidence JSON](../research/yki/official-yki-deep-audit-v2.json), [task patterns](../research/yki/yki-official-patterns-v2.json), [попередня v1](14-digital-yki-fidelity-spec.md). Відповідає [15 — режимам](15-two-modes-skill-scopes.md).

## R02 evidence-first changes: current digital YKI links vs 2027 production (28.10.2026)

[Original OPH R02 source audit](../research/yki/20-yki-official-complete-audit-2026-10.md#r02-deep-follow-up--28102026-oph-digital-yki-2027-eight-dates-demos-and-fail-closed-quality-gate) confirms **all 4 demo entrypoints** (external Inspera), 8 spring-2027 Finnish test dates and a mixed 2011/paper procedural description on the OPH site. **Automated access to the 4 Inspera UI returned HTTP 403, not actual UI observations.** Preserve exact 2027 constraints `module_order / durations / counts / audio repeat / Back / seek / recording / autocorrect / autosave / accessibility` as `null/unknown`. Link demos with ungraded warnings, don't automatically infer `Inspera practice UX == live 2027 exam UX`. Any future update to `F4/F5/F6` requires dated OPH/JYU first-party documentation, version hash and E2E test; no automatic grade 3/4 without S2-calibrated human rubric. Updated [source ledger](../research/yki/yki-digital-fidelity-evidence-2026-10.json) and [validator](../scripts/validate_yki_deep_fidelity.py) reject false `ui_observed=true` and missing official calendar days. **No runtime changes here.**

## Продуктова директива 24.10.2026 — EXAM як другий рівноцінний продукт

**APPROVED TARGET.** Hospodar YKI = **(A) відбірне, науково обґрунтоване LEARN без AI-залежності + (B) високодостовірний самостійний YKI suomi keskitaso DIGITAL EXAM SIMULATOR**. Для EXAM точність важливіша за художні елементи, інтерактивні навчальні підказки та будь-яку генеративну оцінку. Головний статус продукту залишається `practice_only`, доки всі обов'язкові gates не закрито.

**НОВІ ОФІЦІЙНІ ДАНІ:** OPH нині надає зовнішні [4 Inspera digital practice demos](https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia) для читання, аудіювання, письма та говоріння. Це нове джерело **для ручного дослідження цифрових інтеракцій**, але саме посилання не доводить конкретні controls або тотожність до реального 2027 production. Докладні URL, статуси та протокол: [14 — digital fidelity evidence update, 24.10.2026](14-digital-yki-fidelity-spec.md#нова-вимога-2026-10-24-другий-рівноцінний-стовп-hospodar-yki).

**Обов'язковий engineering gate для всіх F1–F6:**
1. На кожен critical exam параметр створити itemized evidence record з `parameter`, `observed_value|null`, `source_url`, `observed_on`, `applies_to` (`legacy`/`OPH official digital demo`/`live 2027`), `confidence`, `licensing_status`, `reviewed_by`; unknown = `null`, не довільне значення.
2. Спеціальний `PRACTICE`-профіль дозволяє користувачу свідомо задати навчальний таймер/аудіоповтор; ці налаштування **завжди** візуально відрізняються від `OFFICIALLY_VERIFIED`. Обрати режим «exact live 2027» можна тільки з підтвердженим джерелом та E2E доказом на кожен critical field.
3. Зіставляти ручні спостереження OPH demo та текстові OPH/JYU правила, з датами/версіями. Якщо відрізняються — не підвищувати статус до exact, залишати `unknown/conflict`, збирати докази. Жодного screen scraping/copyright material extraction.
4. Acceptance: full 4 skills + standalone subtests + OPH date-verified partial days; attempt integrity; keyboard/screen reader; mic denied; audio interruption; atomic save/refresh/retry/failure; no leakage of feedback; writing/speaking `ungraded` unless human calibrated.
5. Виводити шість роздільних доказових статусів і coverage (verified critical / total critical) з **переліком gaps**, а не число «95% точно», засноване на дизайні. Всі заяви про готовність підтверджують runnable browser/Android tests, а не лише контракт.

## 0. Визначення «точної» імітації: шість незалежних вимірів

| Рівень | Назва | Мета | Стан |
|---|---|---|---|
| F1 | **Construct fidelity** | ті ж компетенції, жанри, цілі й чотири модулі | висока впевненість, OPH/2011 |
| F2 | **Item-family fidelity** | MCQ/T-F/open, guided writing, dialog, reaction, monologue | висока впевненість для історичних SOLKI прикладів |
| F3 | **Prompt & genre realism** | надійна, природна фінська, діалоги/наголоси/реальні цілі | залежить від S2 teacher review, запису аудіо |
| F4 | **Timing fidelity** | підготовка/відповіді/переходи в секундному масштабі | лише **legacy-example timings**; digital 2027 unknown |
| F5 | **Interaction/UI fidelity** | точні кнопки, статуси, back, word editor, playback, locks | **UNVERIFIED** до post-pilot |
| F6 | **Scoring fidelity** | близькість оцінок 3/4 до людських оцінювачів | **UNVERIFIED**, потрібна людська калібровка, не ASR/LLM самі |

**Метрика fidelity dashboard має 6 окремих статусів**, ніколи одну оцінку «98% точно». Якщо хоча б один обов'язковий аспект F4/F5/F6 не підтверджено, рекламне `official_2027_exact=true` заборонено.

## 1. Режими / типи сеансу

`LEARN`: необмежені педагогічні підказки, повторення, CEFR пояснення, gradual fading і SRS.  
`EXAM_PRACTICE`: максимально суворий самостійний тест на **власному** original bank, але з `practice_only` замість некоректного ідентичного UI.  
`LEGACY_SOLKI_PATTERN_DEMO`: опційний **демонстратор структури історичних прикладів**, аудіо з оригінального URL відкривається **на сторонньому сайті**, якщо немає прав на вбудовування. Таймінги беруться тільки з атрибутів конкретної задачі; екзаменаторські бланки мають візуальний банер **паперовий історичний зразок**.  
`DIGITAL_2027_VERIFIED`: прихований/disabled, поки *всі критичні* поля профілю не мають незалежного джерела, дати й тестів. `null` ніколи не перетворюється на default із інтерфейсу без warning.

Модульність: `ALL_4`, `reading`, `listening`, `writing`, `speaking`, або дозволена **лише навчальна** комбінація. **Не** називати часткову навчальну збірку «повним офіційним тестом».

## 2. State machine

```text
HOME / MODE_SELECT
  -> PROFILE_SELECT {known version, evidence ledger, not-official badge}
  -> SYSTEM_CHECK {audio playback, headphones, mic permission for speaking}
  -> EXAM_INSTRUCTIONS {finnish_only, reviewed, no learning solutions}
  -> READY / CONFIRM_START
  -> MODULE_INTRO
  -> TASK_PREPARE [only if profile explicitly configures]
  -> TASK_RESPOND [text answer OR bounded audio]
  -> TASK_COMMIT [persist + immutable attempt]
  -> NEXT_TASK | MODULE_CLOSE
  -> BREAK [only if independently confirmed or optional practice label]
  -> NEXT_MODULE | FINISH_CONFIRMATION
  -> SUBMITTED [immutable session snapshot]
  -> PRACTICE_REPORT {per-skill, no official grade}
  -> OPTIONAL_LEARNING_REVIEW [outside exam session; no chance to edit submitted results]
```

Transitions require `event`, `from`, `to`, `timestamp`, `evidence_profile_hash`, `session_id`. Invalid transitions fail closed; no replay of task until policy allows. Back navigation controlled by `back_nav` official field with `null|allowed|forbidden`, practice setting explicit warning if official unknown.

### Data contracts (TypeScript intent, implement as validated schemas in app)

```ts
type EvidenceStatus = "official_current" | "legal_2011" |
  "historical_sample" | "teacher_reviewed" | "unknown";
type ExamProfile = {
  id: string; version: string; language:"fi"; level:"keskitaso";
  mode:"practice"|"legacy_demo"|"official_verified";
  modules: ("reading"|"listening"|"writing"|"speaking")[];
  verified_source_urls: string[]; verified_at: string;
  module_order: string[] | null; // 2027 pending
  module_time_seconds: Record<string,number|null>; // 2027 pending
  allow_back: boolean|null; audio_replays: number|null;
  audio_seek_allowed: boolean|null; speech_recording_policy: string|null;
  input_methods: string[]|null; breaks: unknown|null;
  strict_verified: boolean;
  is_official_exam: false; // Hospodar is never the official provider
};
type Item = {
  id: string; skill: string; task_family: string; topic_id: string;
  function_ids: string[]; source_kind:"original"|"historical_external";
  status:"draft"|"S2_reviewed"|"approved"| "external_link_only";
  rights:string; source_url?:string; content_version:string;
  official_time_seconds:null|number; practice_time_seconds:null|number;
  instructions_fi:string; answer_schema:object;
  evidence_reference_ids:string[]; exposure_eligible:boolean;
  transcript_policy:"not_available"|"hidden_until_after_submission"|"learn_only";
};
type Attempt = {
  session_id:string; item_id:string; raw_answer:string|null;
  user_audio_ref:string|null; first_response_at:string|null;
  saved_at:string; submitted_at:string|null; skipped:boolean;
  elapsed_seconds:number; capture_error?:string;
};
```

**Runtime guard:** `strict_verified` implies **all** required values known, each `evidence_reference` points to OPH official post-pilot source, no `null` among mandatory fields. Pure tests on these invariants. Current official digital profile **must fail** this guard.

## 3. Four independent engines

### A. Reading

- Renderer: longform letter/news/ad/article view and 1+ `question`, optional paragraph navigation with accessible focus. No UA translation, colored evidence, hints in exam.
- Families: `MCQ_3` (as in SOLKI sample), `TRUE_FALSE`, `SHORT_OPEN`; optional other families only if evidenced/labelled practice.
- `Response`: radio one-of-three / boolean / short text; **answers may be blank** but flagged in progress/confirmation; no negative scoring inference.
- Verification: `MCQ exact`; `short_open accepted_answers` only after human reviewer; equivalence matching semantics never trust substring answer.
- `Scoring`: task score for practice, display separate `cannot_determine_official_yki_grade`.

### B. Listening

- `AudioAsset` has `durationMs` from actual file, `speakers[]`, `codec`, `rights`, `checksum`, `source`, `alignment`.
- `PlaybackSequence` with `question_read_window`, `segments`, `repeat_count`, `answer_windows`, `autoplay` only when ***known*** for profile; in legacy sample use only per-example timings. NEVER let user choose training repeat as claim of actual 2027 settings.
- Consent/permissions: audio playback no microphone permission; prevent 0-byte silent clip claiming success.
- Audio first; no transcript before answers. In standalone LEARN replay w/ licensed accurate VTT only **after** first answer.
- Realistic multiple speakers, natural speaking rate and accents need reviewed content, not forced TTS for all questions.

### C. Writing

- Render **3 guided genres in historical content blueprint**: `MESSAGE_OR_EMAIL`, `FORMAL_REQUEST_OR_COMPLAINT`, `OPINION`, examples from SOLKI. Number/type in digital profile pending. No arbitrary official word minimum, no official autocorrect claims.
- Session `draft` autosave and typed answer immutable on final submission; `selected_topic` for either/or opinion. Check draft survival after reloading **implementation quality**, not evidence it behaves so in the real exam.
- Evaluation separate `task_completion`, `coherence`, `vocabulary`, `grammar`, `register`. AI-assisted coaching with `not_official_score`, confidence and human review option; `B1_grade` only if independently calibrated human assessment policy.

### D. Speaking

- Categories from official sample: `KERTOMINEN`, `KESKUSTELU` (simulated phone/dialogue), `TILANTEITA` (short situational replies), `MIELIPIDE` (longer opinion).
- Async pipeline: `peer_prompt_from_licensed_audio` → `beep` (if source-validated demo) → `start_recording` → `time_window` → `stop` → `persist_audio_local` → next turn. All within user-granted mic permission. No upload by default.
- EXAM voice playback: NO tutoring interruption, waveform ranking, on-screen transcript or "pronunciation correction" until final submission; recorded answers can be marked unassessed if no human grade.
- Handling: loss of mic permission, no mic detected, silent recording, user muted, 0-byte audio, interrupted network/browser, early stop, late start. Do **not** mark `completed_and_scored` when audio missing.
- Dual criteria: task/interaction completion and linguistics; accent not inherently failure, pronunciation intelligibility more important than native similarity.
- Audio demo windows `60/90`, `20s preparation`, turn windows in [20,20,10,15,20,10,10], etc. are **example-scoped**, never default official timer.

## 4. Full, per-module and exam-adjacent builds

- **Full practice**: four modules and separate result pages, original bank only, visible label `HARJOITUS — ei virallinen YKI-koe`. **No promise** actual 2027 length/time because unknown.
- **Single skill**: one module identical state machine and independent local results; no implied certificate.
- **Legacy single pattern**: one exact *documented* preparation/response sequence on original *non-official* prompt with carefully labelled example timings; do not replay SOLKI official audio in repo without license.
- **Digital familiarization**: keyboard writing with `ä/ö` input, headphones and mic checks, focus navigation, safe own autosave; clearly says software UX is original.
- **Practice timer**: time choices user-controlled, never asserted official; visible "тренувальний таймер".
- **Results**: reading/listening objective count; writing/speaking `submitted / awaiting human assessment`, cannot merge into `YKI3`. All attempts versioned and deletable.

## 5. Content coverage and hard separation

Source blueprint: [nine topics + six communication functions](../research/yki/20-yki-official-complete-audit-2026-10.md), `source`, `contentVersion`, `reviewStatus`, `license`, `difficultyHint`, `audioStatus`, `heldOutGroup`, `seenBy`.

Coverage testing:
- each task family has ≥2 **S2-reviewed, original** specimens before claim `genre-supported`;
- each **skill** requires multiple genres and scenarios, including `new topic × function combinations`; no per-skill grade on one item;
- different paper-legacy task variants in SOLKI index must map to separate `task_pattern_id`;
- sample tasks used in LEARN cannot later count as UNSEEN EXAM; enforce database invariant `exposed_item_id => unseen=false`;
- reading/listening questions have correct-option rationale/validity review; production tasks have domain-specific anchors, no template answer before submission.
- bibliography and rights metadata attached at **asset** level; no external official MP3 copied.

## 6. Human rubric validation

- `WritingRubricDraft`: purpose (did candidate perform the requested action?), required information, audience/register, comprehensibility, sequencing/cohesion, vocabulary breadth/appropriateness, grammar/structure. Each `assessment=not_scored | provisional | human_moderated`.
- `SpeakingRubricDraft`: communicative goal, responsiveness/timing, fluency, coherence, lexical range, phonological intelligibility, grammatical accuracy, register. ASR WER is **not** pronunciation grade.
- Independent raters: 2 qualified Finnish S2 assessors on a calibration set; blind to automated scores; agreement (weighted κ or ICC as appropriate), subgroup error, false B1 promotion, disclosure. Human YKI scores from actual official exam **not available** unless lawfully supplied and consented.
- No raw AI numbers default `official_score`; graders separate `model_feedback` and `human_rubric_assessment`.
- Flags on review: `pending`, `low_confidence`, `insufficient_audio`, `off_topic`, `requires_retake` (practice only) but no unwarranted official decision.

## 7. Test inventory and acceptance

| Test ID | Scenario | Expected |
|---|---|---|
| EXV-01 | digital 2027 official profile has unknown navigation | strict fidelity **false**, fail closed |
| EXV-02 | user selects full vs only writing vs only speaking | sessions contain exactly chosen module set |
| EXV-03 | item reused in training | never marked unseen in exam assessment |
| EXV-04 | listening demo `legacy x2`, 2027 official repeats `null` | do not propagate x2 to 2027 |
| EXV-05 | speaking demo prep 60 sec, response 90 sec | applies only to identified pattern |
| EXV-06 | fixed `no-back` rule not verified | practice explicit and labelled, strict disabled |
| EXV-07 | user loses microphone / silent input | capture failure; never YKI grade |
| EXV-08 | writing typed response before submit / after submit | persistence before submit; immutable after submit |
| EXV-09 | MCQ correct option plus writing ungraded | objective count and `ungraded` stay separate |
| EXV-10 | copy-paste invented 2027 screen styling | reject as source unverified |
| EXV-11 | external official sample text/audio rights unknown | link only; no repository asset |
| EXV-12 | module result `3` from 4 MCQs | prohibited; show `practice objective correctness` |
| EXV-13 | browser refresh during session | no lost answer/recordings if compatible with privacy settings; not claimed official behavior |
| EXV-14 | Finnish instruction screen accidentally includes Ukrainian hint | reject for exam |
| EXV-15 | answer leakage in audio transcript overlay during exam | reject |
| EXV-16 | source URL changes or provenance missing | fail data validation and quarantine feature |
| EXV-17 | missing audio asset version/codec/checksum | cannot publish realistic listening/voice |
| EXV-18 | 2011 basis surfaced as «2026 revised exam standard» | fail metadata validation |
| EXV-19 | app prints «official YKI» as accreditation | block/deceptive-marketing check |
| EXV-20 | post-pilot OPH releases exact UI and durations | update source evidence, version fixture, QA, only then allow behavior |

## 8. Release milestones / accuracy gates

1. **Stage A — source dossier (now):** confirmed 4 skills, tasks, B1/B2 human criteria, 9 topics, 6 functions, legacy timings, 2027 unknowns. **Ready as evidence** after CI.
2. **Stage B — original task bank:** 4 skills × multiple task families × 9 topics, Finnish speaker-reviewed and legally licensable audio, generated from **our own prompts**, teacher-reviewed.
3. **Stage C — robust mock engine:** mode choice, full/single, objective answer widgets, per-skill state, audio turns, timers that self-identify as practice, autosave, isolation, accessibility.
4. **Stage D — post-pilot fidelity confirmation:** retrieve actual digital UI/software instructions from OPH or SOLKI, verify 10 unknowns, define exact task counts/time/navigations/audio rules, update `strictDigitalProfile` via semver.
5. **Stage E — human calibration:** teacher scoring of production, double-rating, validate thresholds and honest uncertainty, independent held-out sample-based comparison. **Do not call Stage C exact official.**
6. **Stage F — integration QA & risk review:** E2E browsers, Android/mobile/mic/playback, 200% zoom, color contrast, privacy; legal/trademark/copyright review, learner dry-runs.

## 9. Unresolved OPH follow-up checklist (questions to send, not claims)

1. Is full spring-2027 **participant digital demo** publicly available (URL/version/screens)?
2. Are **reading & listening** screens paginated by passage, can learner revisit previous questions?
3. Exact times for each full keskitaso subtest and mandatory breaks?
4. Audio: replay once/twice, can learner pause, seek, revisit; separate prep/read and answer times?
5. Speaking: prerecorded peer prompts? headphones/microphones, record auto-start or manual? preparation/how many seconds?
6. Writing: autosave, allowed copy/paste, spellchecker, character count, textarea size, drafts?
7. Accommodations: extra time, accessibility tools, modified playback?
8. How are AI translation browser plugins and virtual keyboards handled? How to type Finnish `ä`, `ö`?
9. Are new sample packs and updated calibration rubrics provided after November 2026 pilot?
10. Is there an official rule about **scoring thresholds** for understanding modules (likely non-public)? Respect confidential test security if unavailable.

**Priority:** ask only for legitimately public instructions; never seek secret live bank or participant private exam captures. **Progress truth:** current Hospodar app still has short 9-item practice mini-test, not complete 2027 full simulator. These are design requirements only.
