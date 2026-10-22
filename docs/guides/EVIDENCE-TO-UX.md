# From learning research to product UX — implementation handoff

**Status: PROCESS FOR FUTURE FEATURE PRs.** Nothing in a research paper, UI mock, design system or feature contract is proof that the method improves actual Finnish/YKI outcomes.

Read [the canonical research protocol](../../research/RESEARCH-PROGRAM.md), [starting critical evidence](../../research/pedagogy/22-memory-attention-sensory-learning-evidence-2026-10.md), and [evaluation protocol](../../research/ux/learning-impact-evaluation-protocol.md) before implementing a learning feature.

## Learning-first handoff: one concrete proposal at a time

1. **Cite:** stable evidence ID and direct DOI/official source, source design/effect/limitations and applicability. Do not invent transfer to Finnish or use method-fit /100 as experimental effect.
2. **Specify one learner behavior:** \`trigger → independent Finnish response → feedback/repair → delayed new-context recall\`. Identify four YKI skills, typical A2–B1 needs and content rights/S2 editorial review.
3. **Map to LEARN or EXAM:** LEARN may provide controlled supports **after independent first try**; EXAM forbids prior hints/answer leakage. Freeze task content/profile when attempt begins; productive skills remain ungraded unless calibrated.
4. **Design minimally:** semantic text + targeted color/sound only when it serves the task; clean quiet/default interface; explicit user choices for sound, captions, animation, reduced effects, accessible DOM/keyboard/screen reader, text scaling and offline/mic-denied alternative. An assistive feature is not a cheating penalty.
5. **Assign boundaries for our target stack:** React/Vite/TS UI → pure domain/use cases → versioned content/learner event contracts → browser Dexie/IndexedDB or Android Room native adapter; Phaser only for justified game scenes, native Media3/PAD for licensed Android media. This is a *future design*, not current build status.
6. **Acceptance (concrete):** unit/contract tests, meaning-first teacher-reviewed items, no first-try leakage, recovery/idempotency, accessible usable controls, media rights; baseline and 7/14-day independent transfer study design **before** an effectiveness claim.
7. **Release decision:** feature can be shipped as explicitly experimental/optional on usability evidence while pedagogy efficacy is uncertain; marketing "best/most effective" requires credible fair comparative outcomes. Do not call a feature scientifically proven because it appears in an ADR.

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

## UI research acceptance checklist for a scoped PR

- [ ] Research owner + status + sources/evidence limitations identified; negative and conflicting data noted.
- [ ] Precise Finnish first-answer / correction / transfer mechanism and content-review path.
- [ ] One control variant + active comparator; comparison does not conflate sound/motion, content and extra practice time.
- [ ] LEARN/EXAM constraints, accessibility and user control, privacy/voice permissions, rights and offline fallback.
- [ ] Domain contracts, Web/Android adapters and failure behavior mapped to current code vs target architecture.
- [ ] Testing and study design recorded with delayed unseen learning outcome and falsifiable failure criteria.
- [ ] Implementation, empirical outcomes and release status described separately; update owning docs, not another registry.

**Existing authoritative engineering docs:** [ARCHITECTURE](../ARCHITECTURE.md), [CONTRACTS](../CONTRACTS.md), [TESTING](../TESTING.md), [PRODUCT](../15-two-modes-skill-scopes.md), [AI workflow](../AI-WORKFLOW.md).
