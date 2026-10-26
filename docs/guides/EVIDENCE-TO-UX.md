# From learning research to product UX — implementation handoff

**Status: PROCESS FOR FUTURE FEATURE PRs.** Nothing in a research paper, UI mock, design system or feature contract is proof that the method improves actual Finnish/YKI outcomes.

Read [the canonical research protocol](../../research/RESEARCH-PROGRAM.md), [starting critical evidence](../../research/pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md), and [evaluation protocol](../../research/ux/learning-impact-evaluation-protocol.md) before implementing a learning feature.

**Recent world L2 method evidence:** [№26, 25.10.2026](../../research/pedagogy/26-global-effective-language-learning-2026-10.md) уточнює «сильний контроль» для усіх педагогічних A/B: meaningful elaboration + feedback (не лише слабке rereading), окремі phonetic perception/production outcomes, writing/speaking repeated-task transfer, graded reading і delayed true held-outs. Це **RESEARCH**: release gate — S2-verified original content, runnable tests, no fake YKI results/AI dependency, відкладена незалежна перевірка. Зберігати 70 методів у єдиному канонічному каталозі.

**Cognitive attention and memory gate (26.10.2026):** consult [research #27](../../research/pedagogy/27-cognitive-memory-attention-psychology-2026-10.md) for COG-01…16 and `PSY-01…09` whenever changing task length, attention prompts, spaced-retrieval scheduling, optional breaks, interleaving, attention UX or progress widgets. Mind wandering and time-on-task are **secondary** to independent unseen Finnish 7/14/30-day competence; task-specific prompt/feedback must not turn into popup spam. A 25/5 Pomodoro interval is **not** experimentally universal; mindfulness/sleep knowledge is no diagnostic or app-treatment promise. Five studies PSY-E01…05 are **unrun**; no eye-tracking/camera/protected data without separate legal ethical review. EXAM unaffected except verified OPH rules.

## Required output for all research: "What will Hospodar YKI actually gain?" (26.10.2026)

Apply the [mandatory research-to-Hospodar rule](../../research/RESEARCH-PROGRAM.md#обовязковий-прикладний-висновок-із-кожного-дослідження--research--hospodar-yki-26102026) even for psychology, sound, colors, gamification, competitor UX or learning-science searches. Every substantial source finding must lead to a **specific, bounded product recommendation OR documented no-adoption judgment**:

- **Evidence:** source and real measured result, scientific uncertainty/negative findings.
- **Learner benefit:** named Finnish problem for A1.3–B2.1 and target skill(s); don't conflate motivation/time-on-app with actual language gains.
- **Implementation:** one Finnish scenario plus interaction sequence, correct repository owner and limits of LEARN vs verified EXAM; human S2 and rights.
- **Quality gate:** relevant independent first attempt, exact UX/data test, informed consent/accessibility; an appropriate delayed unseen task or OPH fidelity audit.
- **Decision:** `ADOPT`/`ADAPT`/`EXPERIMENT`/`REJECT`/`RECHECK`, justified P0–P2 and dependencies; no claim of existing runtime/effect until code/results are verified.

Research can correctly recommend **building nothing** when the evidence is irrelevant, uncertain, harmful or the app already has a better grounded mechanism. Do not duplicate canonical method registries.

## Learning-first handoff: one concrete proposal at a time

1. **Cite:** stable evidence ID and direct DOI/official source, source design/effect/limitations and applicability. Do not invent transfer to Finnish or use method-fit /100 as experimental effect.
2. **Specify one learner behavior:** \`trigger → independent Finnish response → feedback/repair → delayed new-context recall\`. Identify four YKI skills, typical A2–B1 needs and content rights/S2 editorial review.
3. **Map to LEARN or EXAM:** LEARN may provide controlled supports **after independent first try**; EXAM forbids prior hints/answer leakage. Freeze task content/profile when attempt begins; productive skills remain ungraded unless calibrated.
4. **Design minimally:** semantic text + targeted color/sound only when it serves the task; clean quiet/default interface; explicit user choices for sound, captions, animation, reduced effects, accessible DOM/keyboard/screen reader, text scaling and offline/mic-denied alternative. An assistive feature is not a cheating penalty.
5. **Assign boundaries for our target stack:** React/Vite/TS UI → pure domain/use cases → versioned content/learner event contracts → browser Dexie/IndexedDB or Android Room native adapter; Phaser only for justified game scenes, native Media3/PAD for licensed Android media. This is a *future design*, not current build status.
6. **Acceptance (concrete):** unit/contract tests, meaning-first teacher-reviewed items, no first-try leakage, recovery/idempotency, accessible usable controls, media rights; baseline and 7/14-day independent transfer study design **before** an effectiveness claim.
7. **Release decision:** feature can be shipped as explicitly experimental/optional on usability evidence while pedagogy efficacy is uncertain; marketing "best/most effective" requires credible fair comparative outcomes. Do not call a feature scientifically proven because it appears in an ADR.

## Evidence-based visual/audio UX gate (25.10.2026)

**Read [the updated critical multimodal synthesis #18](../../research/design/18-multisensory-learning-interface-evidence-2026-10.md)** whenever changing semantic color, captions, speed, background music, motion, game SFX or interactive grammar diagrams. Its `SENS-01…12` are **expert implementation priorities**, not new canonical learning methods or empirical effectiveness percentages.

1. **One meaning-bearing cue:** distinguish functional accent colors for skills from grammatical signals; do not expose correct morphology before the first independent attempt. Test form mastery **and meaning comprehension**; L2 visual enhancement may trade the latter for the former.
2. **Audio is user-controlled:** no background music/SFX by default; independent controls for speech, music, and effects; transcript/caption accommodation without accidentally granting an assessment answer. Real human voices, S2 transcript/rights review, offline fallback and microphone denied scenario.
3. **Motion serves explanation:** opt-in animation for real spatial/temporal contrast only; every action has a readable static version, `prefers-reduced-motion` and low-stimulation alternative. Compare against an equally informative static version.
4. **First-party WCAG 2.2 gates:** test audio control SC 1.4.2, prerecorded video captions SC 1.2.2, automatically moving content SC 2.2.2, reduced-motion preference (SC 2.3.3 is **AAA**, not part of AA). Screen reader, keyboard, 200% zoom, contrast and no color-only statuses.
5. **Preserve EXAM fidelity:** no LEARN colors, sounds, game cues, transcripts, answer highlighting, guessed audio-repeat or fake timers while independent YKI practice runs; an official 2027 accommodation/rule remains `UNKNOWN` until documented by OPH.
6. **Pre-register a causal comparison:** same Finnish item/teacher input/time/exposure; record burden/dropout; primary independent, unseen Finnish comprehension and functional production 7/14/30 days later (separate skill outcomes). Neither click-through nor subjective liking establishes learning gains.

**Current state:** the app has partial feedback color and audio examples; SENS implementation acceptance must come from future code/CI plus teacher and participant evaluation, not from this handoff text.

## Example: Finnish vowel/consonant quantity training (proposal, not built)

| Layer | Precise decision |
| --- | --- |
| Evidence | [L2 review](../../research/pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md) and real Finnish phonetic expert review needed; no fake 100% ASR validity |
| Learner action | Hear \`tuli / tuuli / tulli\` in meaningful context → select meaning → pronounce / type independently → receive targeted, uncertainty-aware feedback |
| UI | Explicit play/replay and slow clip, visual duration bar **after first try**, captions/transcript accessible, sound-off text fallback |
| Domain | Independent response event separate from exposure/hint; no false mastery for copied/assisted answer |
| Measurement | New recordings and word contexts, blind human pronunciation/comprehension rating at day 7/14, matched baseline without duration cue |
| Guardrails | No autoplay, no forced microphone recording, no unsupported claim that ASR transcript grades pronunciation |
| Implementation | \`RESEARCH_ONLY\` until code/tests/protocol evidence; link PR if actual implementation begins |

## Comparison with real products (future study, not marketing claim)

When reviewing a competitor, evaluate comparable **Finnish-capable** learning tasks with current screenshots/workflows, accessible interaction, offline/rights and independent outcomes, controlling for prior skill, practice time, learner attrition and content quality. The fact a competitor has immersive 2D worlds or branded sound does not itself imply better learning. Save study observations with the relevant [UX research protocol](../../research/ux/learning-impact-evaluation-protocol.md), **not a copied competitor asset or new master catalog**.

## UI research acceptance checklist for a scoped PR

- [ ] Research owner + status + sources/evidence limitations identified; negative and conflicting data noted.
- [ ] Precise Finnish first-answer / correction / transfer mechanism and content-review path.
- [ ] One control variant + active comparator; comparison does not conflate sound/motion, content and extra practice time.
- [ ] LEARN/EXAM constraints, accessibility and user control, privacy/voice permissions, rights and offline fallback.
- [ ] Domain contracts, Web/Android adapters and failure behavior mapped to current code vs target architecture.
- [ ] Testing and study design recorded with delayed unseen learning outcome and falsifiable failure criteria.
- [ ] Implementation, empirical outcomes and release status described separately; update owning docs, not another registry.

**Existing authoritative engineering docs:** [ARCHITECTURE](../ARCHITECTURE.md), [CONTRACTS](../CONTRACTS.md), [TESTING](../TESTING.md), [PRODUCT](../15-two-modes-skill-scopes.md), [AI workflow](../AI-WORKFLOW.md).
