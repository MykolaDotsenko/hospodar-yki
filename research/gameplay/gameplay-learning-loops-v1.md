# Gameplay learning loops — anti-gimmick 2D proposal

**Status:** architecture/design proposal only; no Phaser implementation. Sources: [Android game ADR](../../docs/23-android-offline-game-and-3gb-media-architecture.md), [methods](../pedagogy/README.md), [product modes](../product-session-modes-v1.json).

## Loop contract

```text
Choose goal → NPC real-world situation → comprehend Finnish → independent response
→ immutable FirstAttemptEvent → meaningful feedback / repair
→ changed scenario requiring transfer → delayed spaced review
```

A quest rewards **transfer or helpful persistence**, not inflated clicks, autoplay, streaks or memorized answer keys. Player can always skip a scene without losing access to the actual lesson.

## Candidate scenarios

| Quest ID | Everyday challenge | Main skill | Proof of meaningful transfer | Accessibility |
| --- | --- | --- | --- | --- |
| Q-01 | Contact a housing caretaker about a water outage | speaking/writing | Different maintenance request without phrase copying | Transcript + typed answer |
| Q-02 | Ask a bus driver about a changed route | listening/speaking | Different destination and timing | Subtitles + repeatable *learning* audio |
| Q-03 | Return a faulty online order | reading/writing | Compose complaint for a different product | Plain text form |
| Q-04 | Negotiate a shift/course schedule | listening/writing | New time constraints without hints | Reduce motion + clear transcript |

## Product and technical acceptance

- DOM text/forms remain accessible; Phaser canvas reserved for world/visual transitions, lazily loaded only.
- One canonical TS learning domain for Web/Android; video/audio referenced by stable asset IDs and rights.
- In EXAM, **no game engine, hints, NPC guidance, quest score or unlocked answer keys**.
- Measure memory, frame drops, battery/thermal on a real mid-range Android **after** Capacitor build exists. Until then, claims of 30 FPS or Android offline media success are unproven.
- A/B hypothesis for language learning must compare delayed independent responses and dropouts to non-game equivalent, accounting for novelty and effort.
