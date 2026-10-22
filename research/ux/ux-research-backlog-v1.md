# UX research plan — hypothesis → task → observation → engineering change

**Status:** proposed study protocol, **no participant data collected**. 2026-10-22. Related [UX evidence](README.md), [use cases](../user-cases/core-flows-v1.md).

## Research questions

1. Can an A2.2 learner distinguish LEARN (feedback/repair) from EXAM (no hints) without reading long instructions? Measure first-action correctness, task completion, confusing terms.
2. Can users locate a B1 activity by **skill + real-world goal** in under two intentional navigation steps? Record actual taps and participant statements; no fabricated completion rate.
3. Does the Finnish prompt remain readable with optional Ukrainian explanations, captions and different font sizes on 360–400px Android screens?
4. When storage quota, microphone denial or offline media access fails, does the UI preserve work and clearly state **what was not saved**?
5. Does a 2D quest improve delayed independent language production versus an equivalent plain form? Pre-register comparison, item difficulty and 7–14-day transfer outcome; do not assume gamification causes learning.

## Study design and accessibility

- Recruit with informed consent, no raw voice/video to public Git; include keyboard-only, reduced-motion, text scaling and basic screen reader tasks.
- Sessions: baseline task → observe user behavior (no nudging) → collect qualitative explanation → review UI alternatives → retest.
- Document participants/cohort, devices, language level, scenarios, consent/retention, observed problems, severity and alternative explanation.
- Use W3C accessible images/alt guidance and interactive control semantics; mark decorative illustrations accordingly.
- File follow-up engineering changes with screenshot *of real existing UI*, specific acceptance case, reviewer and privacy-safe evidence.

**Output required for a completed study:** reproducible anonymized observations and task logs, never just agent-estimated scores.
