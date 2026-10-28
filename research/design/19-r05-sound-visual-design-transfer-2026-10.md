# 19 — R05 adjunct: дизайн, стилі, музика й ефекти з вимірюваною користю для фінської

**Перевірено 28.10.2026. Owner:** research/design. **Статус:** NEW EVIDENCE FOLLOW-UP / PROPOSED UX+SOUND CONTRACT / NOT_IMPLEMENTED / NO_USER_STUDIES. **Популяція:** дорослі українськомовні A1.3–B2.1; два окремі режими LEARN та EXAM.

**Не дублювати канонічне:** [№16 кольори](16-color-attention-memory-research-2026-10.md), [№17 когнітивні візуальні сигнали](17-color-attention-l2-deep-dive.md), [№18 multisensory UI](18-multisensory-learning-interface-evidence-2026-10.md), [№27 увага та пам'ять](../pedagogy/27-cognitive-memory-attention-psychology-2026-10.md), [бренд v0.3](../../brand/identity-v03-screen-system.md), [brand tokens](../../brand/tokens.json), [R01 human trial](../ux/learning-impact-evaluation-protocol.md). Нове — **task×audio звук, сцена→завдання, підтверджені контрдокази 2024–2026, 3–4GB packs і випускові criteria**, не друга база методів.

## 1. Art direction: гіпотеза, НЕ доведена ідеальна палітра

**Recommended direction:** warm Nordic editorial × subtle Ukrainian identity × optional restrained 2D-life-story world. Універсальної «найкращої палітри для запам'ятовування фінської» не підтверджено. ЗБЕРЕГТИ поточні токени: primary navy #083B7A, warm paper #F8F5ED, ink #18251F, gold #C99135, LEARN green tint. Це brand choices, не науково оптимальні кольори. Gold лише для виразних акцентів, не для слабоконтрастних дрібних текстів. Українські геометричні мотиви — лише на gateway/маршруті/нагороді, а не за фінським текстом або хвилею звуку. EXAM — нейтральний оригінальний тренажер без прапорів, державних печаток чи нагород, без імітації непідтвердженого UI 2027.

**Focus principle:** першою видно змістовну фінську дію й результат, далі вторинні засоби. Навчання не повинно виглядати так, ніби 4 GB обов'язково потребують fullscreen анімацій та музики. **Meaning before morphology:** до самостійної відповіді не розфарбовуємо підказкою закінчення, не відкриваємо транскрипт і не показуємо очевидну картинку-ключ.

## 2. Scientific source updates → explicit Hospodar choices

| ID / джерело / design | Valid finding, limitations and counterevidence | Product action |
|---|---|---|
| SD-01 [Bali et al. (2026), 2 experiments N=61](https://doi.org/10.1186/s41235-025-00699-2) | More relevant images helped audio+picture recall, but not audio-only recall. Lower English proficiency/attention suffered at high visual load. Lab immediate memory, not delayed Finnish YKI. INDIRECT. | **ADAPT/P0:** максимум одне meaningful contextual picture/route map for speaking or scene comprehension, no moving decorative images during voice. |
| SD-02 [2026 TELL cognitive-load meta, 35 studies](https://doi.org/10.1016/j.system.2026.104068) | L2 overall achievement g=.69, cognitive load g=-.20; heterogeneous technology/education effects, not an isolated brand/color/music experiment. L2_GENERAL. | **ADAPT/P0:** clear focused controls, one independent response at a time, not a claimed Finnish %-uplift. |
| SD-03 [Cao, Sá Pinto & Bernardes (2025), systematic review 21 serious-game studies](https://doi.org/10.5220/0013504400003932) | Sound supports varied purposes, but evidence is heterogeneous, descriptive and no standardized causal optimal SFX is established. INDIRECT. | **EXPERIMENT/P1:** optional short semantic event sounds after completed actions; effect measured on delayed language and distraction. |
| SD-04 [Sun et al. (2024), experiment N=90](https://doi.org/10.3389/fpsyg.2024.1363562) | Lyrical background music lowered comprehension in Chinese L1/English L2 university reading vs silence, effects changed with music listening habits. Not Finnish. INDIRECT. | **REJECT/P0:** no lyric music while speaking/reading/listening/writing. Default silence when language-focused. |
| SD-05 [Ding & Choi (22.08.2026), registered report N=96](https://doi.org/10.1002/acp.70279) | Preregistered predicted language-congruency effects **not supported** in Cantonese ESL reading; counterevidence against universal music theories, NOT proof songs improve learning. INDIRECT. | **ADAPT/P0:** silence baseline, optional music only on navigation, study user preference vs new-language performance. |
| SD-06 [W3C WCAG 2.2](https://www.w3.org/TR/wcag/) | Normative accessibility: text contrast normal ≥4.5:1, large ≥3:1, meaningful non-text UI ≥3:1; not color-only; audio autoplay >3s controllable; moving >5s pause/stop/hide. This is a normative standard, not a memory study. | **ADOPT/P0:** AA testing actual color pairs/light/dark, captions, focus, alternatives, reduced motion, sound controls. |
| SD-07 [Uchihara et al., HVPT meta (2025)](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6) | Phonetic training requires exposure to interpretable spoken signal, effects for perception not automatically production. L2_GENERAL. | **ADOPT/P0:** foreground voice, prohibit concurrent music or win chimes over phonemes. |
| SD-08 [captions meta (2025)](https://doi.org/10.1111/lang.12697) | Caption help applies to incidental vocabulary acquisition, not verified no-caption independent listening transfer. L2_GENERAL. | **ADAPT/P0:** requested captions after first meaning response only; EXAM no invented transcripts. |

**Evidence overlap:** do not sum effect sizes with older reviews #17/#18 or claim new colors were shown superior. All population changes to adult Ukrainian-speaking Finnish learners need controlled evaluation.

## 3. Skill×phase visual + sound contract

| Screen/action | Visual | Sound, explanations and transfer |
|---|---|---|
| Mode gateway / world exploration | Warm editorial UI, clear two modes, restrained original Nordic/Ukrainian scene; optional animation, clear skill labels | Optional scene sound only by consent; never spontaneous loud sound; not a language outcome |
| First independent LEARN listening | One meaningful prompt, play/stop, no transcript until answer; no grammar highlighting | **Natural Finnish voice only**; mute other channels; save first answer; new voice held out |
| Guided listening / phonetics | One contrast at a time, optional post-answer subtitle and visual/phonetic cue; explicit normal vs slower practice modes | User replay, stable meaningful speaker recordings, no sine-tone/magic frequency claim; no fluency grade from ASR |
| Writing/reading | Calm editorial text, readable width, body ≥16px guideline, line-height ~1.5 target, no permanent movement | **Silence** during sustained language attention; optional event sound only once after explicit submit, visual equivalent |
| Role-play | Static/limited avatar (optional), separate speaker turn, large mic control, recording consent | No effects under speech; protect natural conversational prosody; resume after interruption |
| Delayed no-hint check | Neutral focus state, no colored endings/captions | Only task speech, no cues, new scenario/talker; measure understanding independently |
| EXAM 2027 practice | Neutral verified-only controls; **no Phaser overlay/NPC**, nothing implying endorsement | No music/score SFX/reward cues; audio/replay/timing per R02 first-party confirmed profile only |

**Legibility:** fonts from existing brand fallbacks (system UI, Segoe UI, Arial), Finnish ä/ö/å and Ukrainian glyphs, accessible reading length; avoid proprietary font bundles. Important text remains selectable DOM, not drawn only on Phaser canvas. Default/quiet mode support does not remove task content. Motion tokens 180–250 ms are **brand decisions, not experimentally optimal durations**. OS reduced-motion and Calm Mode override all decorative animation.

## 4. Detailed sound UX specification (engineering hypothesis, not measured ideal acoustics)

**Independent audio channels:** foreground speech, guided replay, UI status, ambience, music. **Priority:** speech / accessibility reader > status > optional environmental > music. In independent listening and recording, background ambience+music+SFX = SILENT. During written language tasks = SILENT by default. All audio must be opt-in or direct user request, with persistently accessible mute/volume controls. No automatic intro blast.

Allow just three optional functional sounds after an action: saved / ready / mission completed; pair every tone with textual/icon feedback so no information relies only on audio. No harsh failure buzzer, escalating reward jackpot, repetitive keystroke clicks or arbitrary "432/528 Hz focus" claims. Sound cannot mark correct answers during EXAM. A sound is not feedback about Finnish grammar: present the **actual explanation**.

Voice QA: capture real speech, compare recording quality, no clipped consonants, stable intelligibility at low phone volume/headphones, correct speaker-turn timing and optional accessible transcript in supporting LEARN phase. Do not mandate an invented exact LUFS or tone frequency absent device testing. Separate content audio, SFX and music rights. Respect microphone permissions, system screen readers, headphone unplug/call interruptions and playback recovery; never mark technical failure as learner failure.

## 5. Testable, preregistered study proposals (NOT RUN)

| ID | Comparison / matched content+time | Primary independent outcome + guardrails |
|---|---|---|
| SD-H01 | Quiet player vs optional status cues after learner action | Day-14 unseen Finnish gist, time-to-answer, distraction and opt-out; don't optimize by clicks |
| SD-H02 | One relevant context image vs none vs 3 decorative | Day-14 novel Finnish situation comprehension + cognitive-load report |
| SD-H03 | Post-first-answer captions vs instant captions | Day-14 unseen voice no-caption gist/detail, form knowledge |
| SD-H04 | Quiet world screen vs optional instrumental map music | Session choice + next-day/14d language tasks, hearing fatigue; no EXAM SFX |
| SD-H05 | Warm route/map UX vs plain navigation with identical tasks | Day-14 new-situation communicative success, cost/time, dropout; results may be null |
| SD-H06 | Silent meaningful error explanation vs same with optional chime after submission | Day-14 self-repair / new-context writing, anxiety, screen-reader interference |

Before running: S2-approved tasks, participant consent, accessibility QA, sample feasibility/power, randomization, blinded evaluators and **strong task-equivalent comparison**. Never claim an effect of Hospodar without participants and new-situation outcomes.

## 6. Release gates SD-01…SD-12: all PROPOSED / NOT PASSED

1. No duplicate token palette; source of truth remains brand/tokens.json, color pairs AA-audited.
2. Text/speech/mic action focus with no decorative or answer-cue leakage.
3. No color-only feedback; visible distinguishable state labels.
4. Respect OS reduced motion + configurable Calm Mode; moving content user-controlled per WCAG.
5. No surprise autoplay; ability to mute/pause independent of system volume where applicable.
6. No competing audio during learning speech or learner recording.
7. Captions only after first independent answer or in explicit teaching mode, never independent exam.
8. Finnish (ä/ö/å) and Ukrainian text accessible across light/dark/reflow/mobile.
9. Accessible mic, player, volume, caption, save and error messages.
10. Sound assets licensed per audio file; any bundled assets include manifests/hashes/rights.
11. Test efficacy on independent day-14 language actions, not only satisfaction or animation impressions.
12. Neutral no-sfx EXAM UI; no invented official digital 2027 controls.

## 7. Handoff

- **R05 language learning:** [№32](../pedagogy/32-r05-multitalker-phonetic-transfer-2026-10.md) phonetic contrasts, new talkers, human oral checks.
- **R05 source/rights:** [material intake](../../sources/audio/R05-MULTITALKER-MATERIAL-INTAKE-2026-10.md).
- **Product design tokens and architecture unchanged:** brand/tokens.json, [ADR-023](../../docs/23-android-offline-game-and-3gb-media-architecture.md), [ADR-027](../../docs/27-stack-architecture-compatibility-and-implementation-gates.md). Target full offline install up to 3–4GB, but do not spend on decorative animations instead of language data.
- **Implementation status:** no app mixer added, no user trial, no new SFX binaries, no production style changed in this research PR. P0 next feature: one usable human-voiced, low-distraction LEARN lesson with optional captions and no exam leakage, and runnable tests.
