# G2 Web LEARN Diagnostic — transactional checkpoints and privacy

**11 November 2026.** Base `main@47983e806458cdf8ebf5795eae810fd1c39436e6`. **Status:** code and tests submitted; CI pending. This is a scoped G2 slice, NOT a production or Android release gate.

## Learner problem and baseline

`DiagnosticScreen` previously kept the entire diagnostic session in React memory. Reading responses were committed only after all keys appeared; writing and speaking each committed once before moving on, but the in-progress session and the current editing field could disappear after a page reload. Because reading, writing and speaking have separate evidence commits, naïvely restoring a draft from the beginning can duplicate first answers and show reading keys too early. The underlying baseline is provisional, unreviewed S2 content and cannot certify a CEFR/YKI level. Listening remains not tested due to missing baseline audio.

## Implementation and invariant boundaries

- **IndexedDB Dexie v9** adds `diagnosticDraft` without mutating existing v1–v8 learner, Picture Mission, Dialogue, EXAM, or voice stores. A content fingerprint rejects changed editorial baseline.
- Strict `diagnosticReducer` replay validates all frozen reading choices and question order, the saved-reading/writing progression, exact independent writing and speaking-text attempts and self-check points. Impossible transitions are rejected **before** showing reading keys or moving into productive skills.
- Autosave and explicit **Save & Exit** protect current text/selected choice. Stage transitions await serialized compare-and-swap writes and fresh database readback. A stale second tab cannot overwrite another response.
- Reading and writing: **one transaction** commits the just-completed skill's diagnostic evidence and advances its draft to the next skill at the newly incremented learner revision. The last speaking skill: **one transaction** commits ungraded evidence and deletes the matching draft. No duplicate completed responses after reload, regardless of the skill boundary.
- **Audio privacy:** recorded audio is still ephemeral within the current tab and never written to IndexedDB. A voice-only, uncommitted speaking response is **not resumable** after a reload; the learner must re-record it. Text can be recovered. On submit, diagnostic evidence can record the fact a recording was made, not the audio file. This is disclosed in the UI.
- On intentional discard, already completed and saved reading/writing diagnostics are retained; **My Data** provides typed confirmation for full LEARN erasure. Import/restore fail closed while an unfinished Diagnostic exists. The portable LEARN JSON excludes incomplete drafts and discloses that limitation.

## Acceptance gates

1. `apps/web/src/storage/diagnosticDraft.test.ts` — pure replay and premature-key/voice gate.
2. `apps/web/src/storage/diagnosticDraft.repository.test.ts` — v8→v9 migration, multi-tab CAS, per-skill atomicity and privacy.
3. `apps/web/e2e/diagnostic-restore.spec.ts` — Chromium, Firefox, WebKit; unassisted picks, independently written responses, self-check and transfer across page reloads; stale tab and privacy.
4. Existing `apps/web/e2e/diagnostic.spec.ts`, privacy/export suites, `pnpm -r typecheck`, Vitest, production build, full Playwright and all architecture/contract checks. Verify actual GitHub outcomes before merging.

## Nonclaims / follow-up

Browser eviction and actual device/process crash before the 650ms autosave, quota/disk-full reliability, native Android Room and sound, professional Finnish S2 review, causal learning gain, and official 2027 digital YKI format fidelity remain unverified. Voice-only interruption deliberately cannot be restored. UX follow-up: evaluate diagnostics for measuring reading errors and writing/speaking coverage on real users without turning self-report into a language score.

## Rollback

The v9 schema is additive. Reverting the UI can leave a v9 draft until a compatible release resumes it or an explicit LEARN wipe removes it; do not drop earlier stores or delete independent evidence.
