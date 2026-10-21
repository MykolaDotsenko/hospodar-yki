# Hospodar YKI — runnable browser MVP

**Status:** independently runnable local prototype, not deployed, not officially calibrated. Built on the project's existing Finnish JSON content and OGG/MP3 files.

## Start

From the repository **root**:

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080/app/** in a browser. Do not use `file://` because the browser blocks source JSON fetches. No installation, build, tokens or external API is needed.

**Tests** (Node >= 20): `node --test app/tests/*.test.mjs`; syntax `node --check app/app.mjs`.

## Working now

1. **Місія:** load `content/b1/grammar/contextual-cloze.json` → first attempt (answer hidden) → guided repair (if wrong) → reveal answer/explanation → own unseen transfer sentence → save. SRS records **first independent** recall, not success after a hint.
2. **4 навички:** one short baseline probe per skill. Reading uses genuine test text and objective choices; listening uses an **existing real OGG file** of synthetic speech, not the script-only diagnostic; writing and speaking save ungraded work. This is a smoke-test of assessment UX, **not an adequate CEFR diagnostic**.
3. **Аудіо:** six existing long synthetic lessons in the repository; MVP demonstrates one long original story, comprehension, and transcript reveal after the response. Extra real human voice is a historical LibriVox story, not the planned modern two-speaker dataset.
4. **Digitesti:** four-step, feedback-delayed digital rehearsal based on existing independent training content. **No claims** about the exact OPH digital test screens, number/timing of tasks, permitted audio replay or official scoring.
5. **Прогрес:** dated review cards, repeated errors, first-attempt results, four-skill counts; local JSON export and irreversible local clear. No learner login, server sync or collection.

## Privacy and accurate feedback

- Responses stay in **localStorage on the current browser profile** and are capped in the model; localStorage is neither encrypted nor shared across devices.
- Microphone requires browser permission; audio is held in a temporary Blob URL **in memory only**, not persisted or uploaded. Text fallback works if mic denied. A secure context (HTTPS/localhost) is typically necessary.
- Speech pronunciation, writing quality and overall B1/YKI outcome are **not auto-scored**. Speaking/writing appear as `ungraded`, even when the user recorded a voice note.
- Automatic cloze checking is deterministic; only source-declared alternatives are accepted, so genuine alternative answers require teacher review. The corpus is `teacher_review=pending` or an equivalent draft status.
- Existing audio TTS labels remain accurate. New natural multi-speaker recordings **have not been produced** by this MVP.

## Structure

```
app/
  index.html        # static semantic UI
  styles.css        # brand-aligned responsive styles
  app.mjs           # browser routing, rendering, media and persistence
  core.mjs          # pure model: checking, SRS, bounded progress and 4 skills
  tests/core.test.mjs
```

Specs: [product requirements](../docs/11-mvp-product-requirements.md) · [architecture](../docs/12-mvp-architecture.md).

## Known limitations and next milestones

- Current SRS is an interval **heuristic**, not learner-calibrated FSRS; independent 7/14-day unseen checks and cross-task adaptation are upcoming.
- The baseline diagnostic uses too few independently calibrated items; add sufficient item pools, human anchors and difficulty controls before claiming a level.
- Record and license modern contemporary **two+ voice** Finnish conversations with exact transcripts and manually checked WebVTT; involve an S2 editor.
- Improve browser E2E tests (keyboard/mobile/permissions), autosave of in-progress stages, offline caches, accessibility audit, and real GDPR/legal review before production.
- Verify exact digital-YKI user experience from OPH before shipping exam-like timers and instruction claims.

**Official 2027 dates source:** https://www.oph.fi/fi/koulutus-ja-tutkinnot/sopivan-yki-testin-valinta-ja-testipaivat — 10.04.2027 intermediate full Finnish digital test; registration 08–25.03.2027, subject to changes.
