# Core user journeys — executable-test backlog (not a claim of implementation)

**Date:** 2026-10-22 · **Status:** design scenarios with partial Web MVP evidence. [Product scope](../../docs/15-two-modes-skill-scopes.md), [roadmap](../../docs/25-implementation-vertical-slice-roadmap.md).

| ID | Actor / goal | Main path | Failure/alternative | Status |
| --- | --- | --- | --- | --- |
| UC-01 | A2.2 Ukrainian speaker learns Finnish `rektio` | Context → independent answer → feedback → repair → new transfer → review | Unfamiliar item/hint: do **not** re-score as initial success | PARTIAL Web LEARN; future canonical event registry |
| UC-02 | Commuter studies without Internet | Pick previously available lesson → audio + Finnish transcript → answer | Missing Web offline pack shows optional download; no forced 3GB | TARGET for robust PWA/Android |
| UC-03 | Learner practices reading and writing | Read Finnish notice → infer → compose 60–120 word message → review | Free writing stays `ungraded` before calibrated review | PARTIAL mock |
| UC-04 | Learner speaks through Android microphone | Grant permission → capture attempt → replay → optional feedback | Denied/revoked permission gives text fallback and no false saved status | TARGET Android |
| UC-05 | Exam user gets interrupted | Checkpoint persisted → browser/process restart → resume pinned profile | Failed save/quota/lost ACK blocks next; verify command/event ID | PARTIAL Chromium IndexedDB |
| UC-06 | User completes mock YKI rehearsal | Select skill/blueprint → independent answers → finish → reveal objective keys | No coaching during EXAM, writing/speaking ungraded; no official YKI grade | PARTIAL Web mock |
| UC-07 | User opens YouTube supporting video | Discover ID/title/creator → tap source link | Unavailable/captions absent → show source status, no offline copy | LINK-ONLY curated |
| UC-08 | User opens licensed video | Check rights/manifest → play → captions/transcript → answer | Missing media, unsupported codec, storage limits, subtitles fallback | PARTIAL Web assets / TARGET Android Media3 |
| UC-09 | User updates a lesson or app | Preserve pinned content hash, migrate learner data with backup | Schema/content mismatch: fail closed/export, not overwrite attempts | TARGET G1/G2/G3 |
| UC-10 | Ukrainian-speaking adult navigates accessible 2D Finnish town | NPC story → meaningful language attempt → repair + transfer | Skip animations, keyboard/screen reader alternative, exam free of game hints | TARGET Phaser gameplay |

**Acceptance:** connect each row to automated fixture/test IDs when implemented, with actual browser/device evidence. Do not confuse a design journey with an existing functional user flow. For UX research ethics and user study process see [UX plan](../ux/ux-research-backlog-v1.md).
