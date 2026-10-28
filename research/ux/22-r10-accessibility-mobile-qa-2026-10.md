# 22 — R10: доступність Web/Android і когнітивно легкі мобільні інтерфейси для фінської

**Досліджено й перевірено джерела:** 28.10.2026. **Owner:** research/ux (source); app styles & QA (implementation). **Status:** SELECTIVE OFFICIAL STANDARD / SCIENTIFIC PRODUCT-SAFETY FOLLOWUP + REAL CODE STATIC AUDIT/FIX + NODE SOURCE-LEVEL CONTRACT TESTS; **NO REAL MOBILE DEVICE/TALKBACK/VOICEOVER USER SESSION, NO AXE/RUNTIME ALL-SCREEN AUDIT, NO VALIDATED WCAG 2.2 AA CONFORMANCE, NO HUMAN FINNISH LEARNING IMPACT TEST**. Coverage: adult UA-speaking Finnish A1.3–B2.1; equal LEARN and high-fidelity EXAM (only independently confirmed 2027 behavior).

**Avoid duplicating:** [UX R07](21-r07-meaningful-interactive-finnish-ux-2026-10.md) owns staged meaning-first multimodal intervention and delayed L2 effect protocol; [R05 sound-first](../design/19-r05-sound-visual-design-transfer-2026-10.md) owns audio/colors/animation; [existing palette](../../brand/tokens.json); [R01 outcome study](learning-impact-evaluation-protocol.md); [R06 evidence separation](../pedagogy/33-r06-transparent-adaptive-finnish-learning-2026-10.md); [R08 original Finnish drills](../pedagogy/34-r08-finnish-case-stems-meaning-transfer-2026-10.md); [Android 3–4GB architecture](../../docs/23-android-offline-game-and-3gb-media-architecture.md). This document is **testable R10-specific normative mobile QA matrix**, not a new teaching-method registry, second color taxonomy or claim of measured L2 gains.

## 1. Research question and evidence-validity boundary

**Question:** can an adult learner complete **real independent Finnish reading/listening/writing/speaking tasks** on narrow/zoomed mobile and with TalkBack/keyboard/switch/captions, preserving meaning, optional learner aid, data, and honest evidence, without being excluded by vision/hearing/motor/device/network constraints? When comparing design choices, does giving accessible control improve day-14 independent novel Finnish communication relative to a **strong, equivalently understandable** accessible control interface at matched time/content? **Not measured.**

**Normative accessibility ≠ randomized learning result.** WCAG/EN 301 549 establish requirements/good practice. Removing a barrier is a P0 product duty even if no RCT measures effect on Finnish memory. We must not make users with disabilities prove a learning uplift to be offered accessible interfaces. Human task completion and safety should be measured before "best 2027 YKI" marketing.

**ADOPT P0:** real keyboard/screen-reader, text zoom/reflow, media control, alternative paths, protected independent response evidence, no sound overlap, recovery. **ADAPT P0:** compact soft-Scandinavian + restrained Ukrainian theme with accessible ink/navy, not gold-only focus; quiet short interactions; task-specific context diagrams. **REJECT:** inaccessible drag-only case selector, voice-only entry as forced pass condition, punitive no-caption listening failure, hidden focus, invented legal conclusions or official 2027 exam accommodations. **EXPERIMENT:** optional decorative/game UI only when a genuine matched-delay L2 comparison justifies complexity, without withholding accessibility to control group.

## 2. Critical original-source ledger (normative primary, engineering and counterevidence)

| ID / source type | What is actually required/shown; no invented study effect | Hospodar implementation & test |
|---|---|---|
| A10-01 **W3C normative WCAG 2.2** [standard](https://www.w3.org/TR/WCAG22/) | Level A/AA success criteria (including newly 2.4.11 focused element not *entirely* obscured; 2.5.7 non-drag alternative; 2.5.8 targets 24×24 CSS px **with exceptions**). Not a causal memory study. | **ADOPT/P0:** fixed answer actions, no canvas-only words, focus + keyboard and visible state; test actual controls manually, not only CSS. |
| A10-02 **W3C 1.4.10 Reflow** [understanding](https://www.w3.org/WAI/WCAG21/Understanding/reflow) | At **320 CSS px equivalent width** vertical content should not require both-axis scrolling, except components requiring two-dimensional layout. 320px also represents 1280px viewport at 400% zoom example, not a universal "minimum supported screen hardware". | **ADOPT/P0:** inspect 320/360/390 widths and 200% text/400% browser reflow; test all four entry pages and steps, not screenshots only. |
| A10-03 **W3C 1.4.4 Resize Text** [understanding](https://w3c.github.io/wcag/understanding/resize-text.html) | Page text can be resized to **200% without loss of information/function**, excluding captions and images of text per SC. | **ADOPT/P0:** keep scalable real text, no maximum zoom, no text baked into scene art. |
| A10-04 **W3C 1.4.3 Contrast** [understanding](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) | Normal text **≥4.5:1**, large text **≥3:1**, exemptions. Does not require each decorative border to meet body-text ratio. | **ADOPT/P0:** brand navy and ink on paper/white, not gold text for controls. Check real composed foreground/background per state. |
| A10-05 **W3C 1.4.11 non-text contrast** [understanding](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html) | Important control edges/states/focus **≥3:1** against adjacent colors, with exceptions. Mere gold ring on white risks failure. | **ADOPT/P0:** switch global focus outline **gold → navy**; expected contrast navy:white ~10.95:1, gold:white ~2.77:1 (calculated from current tokens). Border/blue focus on tinted cards to be inspected in browser/forced colors. |
| A10-06 **W3C 2.4.11 Focus Not Obscured Minimum** [understanding](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) | A focused item must not be **entirely hidden** behind author-made content; enhanced visibility is AAA separately. | **ADOPT/P0:** don't conceal first Finnish answer field behind mobile keyboard, sticky route or notification; must confirm with actual keyboard + TalkBack, not static CSS. |
| A10-07 **W3C 2.5.8 Target Size** [understanding](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) | AA minimum **24 CSS px** with spacing/inline/equivalent exceptions, **not universal WCAG 44px requirement**. | **ADAPT/P0:** our ergonomic target ≥44px height for tabs/radio/big buttons and exam "back", 24px SC still independently check on every real tappable item. |
| A10-08 **W3C 1.4.2 Audio Control** [understanding](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) | Autoplay >3 sec must have pause/stop or independent volume control, screen-reader competing audio concern. | **ADOPT/P0 stricter:** never autoplay Finnish or music; native audio controls; support transcript-on-demand in LEARN and label assisted attempts (doesn't establish audio-only listening competence). EXAM transcript disclosure only when consistent with independently verified official accommodations; don't fake strictness. |
| A10-09 **W3C accessible form notifications** [WAI tutorial](https://www.w3.org/WAI/tutorials/forms/notifications/) | Clear, actionable form success and error messages to users, not just red borders. No direct L2 learning causal outcome. | **ADOPT/P0:** status role aria-live polite already exists on 4 entry pages; test dynamic message content/focus after submissions, which static tests cannot prove. |
| A10-10 **Google Android testing** [official docs](https://developer.android.com/guide/topics/ui/accessibility/testing) | Recommends **manual accessibility services (TalkBack, Switch Access, Voice Access)**, analysis tools and automated tests together. Automated testing doesn't replace person/device. | **ADOPT/P0:** require Android real device TalkBack + switch/keyboard, hardware/BT audio, mic denied, dark mode/large fonts and airplane mode. Android prototype in repo **not a buildable released AAB**; can't report it tested. |
| A10-11 **web.dev automated a11y limits** [engineering guide](https://web.dev/learn/accessibility/test-automated) | Automated scans find *some*, not all, accessibility faults; may yield false positives; manual/aided testing essential. | **ADOPT/P0:** our 12 Node contract tests are *source assertions*, not axe/WCAG certification; manual matrix and actual user-task success still outstanding. |
| A10-12 **W3C Easy Checks** [WAI preliminary](https://www.w3.org/WAI/test-evaluate/preliminary/) | Basic checks for page title, alt text, headings, contrast, keyboard, content structure and motion are **not comprehensive audit**. | **ADAPT/P0:** initial page inventory + regression tests + later real QA, never advertise "100% accessible" based on checklist. |
| A10-13 **Traficom Finland official** [EN 301 549 and digital-services law](https://www.saavutettavuusvaatimukset.fi/en/requirements-act-provision-digital-services-0) | EN 301 549 includes beyond-WCAG interoperability with assistive tech/settings, media etc. **Whether a commercial standalone education app falls in each legal category depends on its services and operator**, not assumed. | **RECHECK P0 before market:** evaluate whether subscription checkout/e-book/e-commerce/consumer provisions apply, microenterprise exceptions, accessibility statement/feedback if subject to law. No unsupported blanket "all Finnish apps required on date X". |
| A10-14 **Traficom coverage/2025** [official](https://www.saavutettavuusvaatimukset.fi/en/obligation-notify-deficiencies-and-grounds-derogation) | 28 June 2025 new accessibility obligations for named consumer categories **excluding microenterprises** for relevant chapter; not blanket education app classification. | **RECHECK P0:** compliance owner/legal review for web shop/service, app/payment and legal entity before publish. No legal certification from this research. |
| A10-15 **R07 selected L2 / cognitive learning evidence** [cross-reference](21-r07-meaningful-interactive-finnish-ux-2026-10.md) | Audiovisual/caption, cognitive load, 2D/game evidence supports *some learning task forms* but doesn't measure a11y barrier removal for Finnish. | **ADAPT/P1:** make content equivalent with controlled assistance and new independent voice/word; no claim "bigger UI increases YKI by X%". |

**Limitations:** R10 mostly normative/engineering evidence rather than 15 independent RCTs; URLs reused from prior studies are explicitly cross-references. No users recruited, no screen-reader or real Android test executed, and no person-specific disability or health data collected. No categorical legal conclusion or 2027 official exam accommodation rule inferred.

## 3. Real-code audit baseline (main before R10) and actual changes in this PR

**Audited source pages:**
- [LEARN](../../app/index.html), [EXAM](../../app/exam.html), [real-life A1–A2](../../app/real-life.html), [authentic-listening](../../app/authentic-listening.html): Ukrainian HTML document language; skip to main with focusable target; aria-live polite status region, unique page title/viewport. These are positive **source facts**, not confirmed assistive-technology experience.
- [shared styles](../../app/styles.css): warm Nordic system palette and skill colors, reduced-motion-controlled transitions, 4-stage threshold-route, two-card mobile gateway. **Pre-R10** global focus outline was decorative **gold** `#C99135`. W3C relative luminance ratio using RGB tokens: gold on white **2.77:1**, gold on paper **2.54:1**; navy on white **10.95:1**, navy on paper **10.04+:1**. Gold alone is inadequate for our 3:1 important non-text indicator design gate.
- At <=380px pre-R10 route remained four columns with ~0.68rem stage label/~0.57rem index (too small *as product usability concern*, **not a definitive violation of WCAG solely from font-size**); native audio controls width may be constrained by browser UA min-size; mobile status rows may have long content.
- [EXAM styles](../../app/exam.css): `back` anchor had no guaranteed ergonomic min target; two-column mobile module grid can become cramped.

**Changes in this PR (real CSS, not merely proposed):**
- `:focus-visible` navy 3px ring; forced-colors uses system `Highlight`, providing stronger contrast on known light surfaces.
- `tab` and radio min-height 44px, exam `back` 44px, `mode-label` 44px, native audio min-width 0/max-width 100%; text/content flex no-overflow safeguard.
- On <=380px 4-stage threshold-route becomes **2 columns**, min-height 48px and improved text size, preserving DOM step order; narrow EXAM module grid becomes 1 column.
- Existing application logic, original authored Finnish and EXAM attempt persistence untouched; no new sounds/animations/media and no claim that static changes cover all controls.

**Regression tests:** [12 source-level Node tests](../../app/tests/r10-accessibility-contract.test.mjs) run by current `node --test app/tests/*.test.mjs` GitHub browser-core job: WCAG color math, main brand tokens for contrast, skip targets/zoom/lang and status for four HTML entry pages, no auto audio, large target CSS, two-column route, reduced motion, mode identity and source visibility. **A passing source test is not an end-to-end browser accessibility test**. [docs/TESTING.md](../../docs/TESTING.md) has the exact command. Existing browser CI also tests real Chromium IndexedDB but **not** the actual rendered R10 UI breakpoints or TalkBack.

## 4. Distinct English/Ukrainian/Finnish + disability-sensitive test cases

1. **UA page language, FI utterances:** HTML `lang=uk`, Finnish prompts `lang=fi` at element level where language differs so screen readers switch pronunciation voices. Check dynamic feedback and `lang=fi` for generated prompts after runtime render (source HTML alone insufficient). Avoid forcing screen reader to pronounce Finnish as Ukrainian and vice versa.
2. **Blind or low vision reading:** TalkBack+Chrome on Android or desktop NVDA + Firefox; navigate mode gateway, enter B1 grammar, hear prompt without answer leak, first form response, feedback and next; no 2D-only diagram or image-only prompt; alt text indicates semantic content.
3. **Auditory access:** LEARN transcripts and synchronized captions available on request; record learning completion as **supported/ungraded** when text exposed before first independent listening attempt. The app must not equate missing hearing with failed Finnish; EXAM must reflect confirmed OPH accommodations.
4. **Motor/touch:** 320/360/390 CSS px, 200% text and desktop 400% reflow equivalent, external keyboard and Android Switch Access; complete task and navigate backward without losing typed answer; no mandatory drag-only quiz.
5. **Reduced motion/sensory:** OS prefers-reduced-motion; stable content hierarchy; no click/answer SFX over Finnish voice, no autoplay, no alarm in exam; neutral quiet mode and visual confirmation.
6. **Mic unavailable/denied:** user can decline mic, see a truthful `not recorded/ungraded` state and plan typed response in LEARN; in EXAM textual alternative **not automatically treated as official equivalent speaking submission** until OPH guidance verified; preserve first intent/attempt data carefully.
7. **Offline/storage:** Android airplane mode and full 3–4GB install-time PAD **only after real AAB exists**; Web PWA media cache may be restricted by browser quota, and offline fallback must not silently substitute an audio-only scored task with text scoring.
8. **RTL/long text and keyboard:** user-entered long Ukrainian paragraphs, Finnish long compound words, 200% zoom; never hide submit button beneath OS keyboard or sticky nav; scroll focus into view and preserve voice/typing status on screen rotate.
9. **Error recovery:** broken media, denied quota, corrupt draft, interrupted recording, no Bluetooth, no speech permission; plain language instruction and legitimate next action rather than false success or punitive fail.

## 5. Required *manual / real-device* test matrix, result = NOT RUN

| Platform and assistive tech | 320/360/390, text zoom, keyboard and Finnish focus | Essential task + failure state | Status |
| --- | --- | --- | --- |
| Chrome Android (mid-range) + TalkBack | 320/360/390 CSS px; OS 200% large text; TalkBack forward/back reading order | LEARN morphology and listening; transcript before answer marked supported; no leaked key | **NOT RUN** |
| Chrome Android + Switch Access / external keyboard | Scanning + selection, visible focus under soft keyboard, rotate, back/return | Complete reading/writing + prevent duplicate submit | **NOT RUN** |
| Chrome/Firefox desktop + keyboard + NVDA/Orca | 1280→320px equivalent, 200% text, full screen-reader workflow | EXAM timer/status, progress, failed storage, keyboard focus | **NOT RUN** |
| Safari iOS + VoiceOver | iPhone narrow viewport, zoom, VoiceOver reading semantics and audio | Finnish listening, text alternative, muted audio and microphone denial | **NOT RUN** |
| Android Capacitor/Room real native build | Google Play AAB 3–4GB compressed install-time PAD, real airplane mode and TalkBack | Media pack installation/hash, interrupted install, 4-skill EXAM save/restart | **NOT BUILDABLE/NOT RUN** |
| Consented adult learners with varied access needs | No required diagnosis or disclosure; comparable content and task goals | Independent Finnish meaning transfer + usability completion and comfort | **NOT RUN** |

**Use actual sessions** to report device/browser version, test width, step-by-step input, expected and observed outcome, screenshot/assistive-technology output when permission granted, severity and reproducible fix. Do not claim a test was performed because the matrix exists.

## 6. Accessibility release criteria R10-01..R10-20 (some source-level fixes done, product release NOT certified)

1. Web four entrypoints correct localized UA language/landmarks/skip destination; generated Finnish voice spans have correct fi language.
2. Consistent LEARN/EXAM navigation with keyboard and screen reader, no feedback/answer leak.
3. Focus strong 3:1+ indicator and visible at every UI state; never fully hidden by sticky panels or keyboard (WCAG 2.4.11).
4. Body regular text >=4.5:1; large >=3:1; important control-state nontext >=3:1, with documented WCAG exceptions.
5. 320px reflow, 200% text resize and 400% equivalent browser zoom manually pass without content loss or two-axis scrolling except genuine exceptions.
6. Accessible label, instructions, error status, and no redundant keyboard entry across form states.
7. Every operable target meets applicable 2.5.8 AA 24px-with-exceptions; major actions ergonomic target 44px+ project rule.
8. Complex four-stage route labels readable in 320px without relying only on shape/color.
9. Native LEARN audio start/pause/repeat user controlled, screen-reader output not covered by background music.
10. Correct captions/transcripts with editorial timing, optional before response in LEARN, assisted evidence clearly differentiated.
11. EXAM accessibility matches officially verified 2027 conditions, never invented timing/grade accommodations.
12. Speaking fallback if mic denied shows `ungraded/not recorded`, no false successful recording; permission flow not auto-triggered.
13. Real user safe persistence after rotate/interrupted attempt, no silent answer corruption or deadline loss.
14. Reduced-motion and high-contrast options, no mandatory GPU/canvas path; meaningful alt text for graphic clues.
15. Offline core learning operates without subscription/cloud AI; optional media pack integrity and legal rights clear.
16. Web 320/360/390, multiple browsers and forced-colors verified with *rendered* page, not only source grep.
17. Android TalkBack, Switch Access, keyboard, large text and Voice Access tested on real devices, real user workflows included.
18. Test automation (source checks plus axe/Playwright later) supplemented by manual testing and zero critical blockers.
19. Actual task completion, error recovery, reading/listening comprehension and blinded day14 Finnish new-task transfer measured without discrimination; secondary time, burden, discomfort.
20. Legal/standards owner assesses EN 301 549, Finnish Traficom scope, statement and checkout obligations if applicable; report only verified compliance.

## 7. Follow-up & result accounting

**Implemented in this R10 PR:** limited CSS usability fixes to current MVP, 12 source regression tests, this evidence audit and manual QA matrix, updated index and test docs. **Not implemented:** production Android app/AAB, verified offline 3–4GB packs, real device screenshots, automatic axe of all dynamic states, microphone denial E2E, sound/caption accessibility assets, actual human testing or demonstrated increased Finnish results. No unnecessary new styles, lesson content or licensed media.

**Next canonical R11** after merging R10 should follow [12-workstream plan](../29-twelve-product-research-studies-execution-2026-10.md), rather than repeating the completed R08-MOT.
