# Round 3 — Finnish video curation: verified publisher links and high-value practice (21.10.2026)

**Status:** Source-link curation completed; playback/embedding/S2 human review pending. **New:** 8 specific YouTube video URLs taken from publishers' own outgoing "Watch on YouTube" links (now **38 YouTube IDs** total), **7 separately categorized publisher video series/page URLs** (not falsely labeled YouTube). Full source-of-truth: [video/youtube-catalog.json](youtube-catalog.json) and [video/publisher-series-catalog.json](publisher-series-catalog.json).

**Quality policy:** A2.2→B1+ goal means that *slower A1–A2 scripted practice is only scaffolding*, not the same as spontaneous B1 speech or official YKI. We prioritize **actual B1 Yle learning materials**, **Kielibuusti professionally produced situational videos** and **short Puhekieli**; even practical beginner films must be paired with `uncued` B1 production. Scores 0–100 are expert product-fit priorities, *not measured improvements*, and vary with source difficulty.

## 1. New specific YouTube URLs (publisher-source link confirmed, no video playback verification)

| ID | Direct watch URL | Material and context | Level verified from publisher | Product fit |
|---|---|---|---|---:|
| `yt-kielibuusti-aleksei-tyo` | [Aleksei — suomenkielinen työympäristö](https://www.youtube.com/watch?v=UBrNvJekzzk) | Kielibuusti interview snippet: using Finnish rather than English in work; [full publisher article](https://www.kielibuusti.fi/fi/opi-suomea/oppijoiden-tarinat/oppijoiden-haastatteluja/aleksei-rohkea-hyppy-suomenkieliseen-tyoymparistoon-auttaa-kielen-oppimisessa) | **B1+ estimate, not certified** | **94** |
| `yt-dailyfinnish-moving-home` | [Moving Into First Finnish Home](https://www.youtube.com/watch?v=QVKNkT4W3Vo) | 10 scripted slow dialogues: getting keys, neighbor, elevator, defects, inventory, manager. [Publisher chapter list](https://dailyfinnish.fi/learn-finnish/videos/moving-into-first-finnish-home/) | A1–A2 | **91** |
| `yt-dailyfinnish-hospital-visit` | [One Night in a Finnish Hospital](https://www.youtube.com/watch?v=_-ZZsOQz1to) | 10 scenes: reception, triage, doctor, ankle, scan, discharge. [Publisher chapter list](https://dailyfinnish.fi/learn-finnish/videos/one-night-in-a-finnish-hospital/) | A1–A2 | **91** |
| `yt-dailyfinnish-job-interview` | [My First Job Interview in Finnish](https://www.youtube.com/watch?v=JopJ5t8uI9I) | 10 scenes: interview, employment experience, faster questions, callback. [Publisher chapters](https://dailyfinnish.fi/learn-finnish/videos/my-first-job-interview-in-finnish/) | A1–A2 | **90** |
| `yt-dailyfinnish-real-life-day` | [Survive a Day in Finnish](https://www.youtube.com/watch?v=y8RshBFnOac) | Phone call, ticket inspection, shift-swap, groceries, home. [Publisher chapters](https://dailyfinnish.fi/learn-finnish/videos/survive-a-day-in-finnish/) | A1–A2 | **90** |
| `yt-dailyfinnish-first-office-day` | [First Day at a Finnish Office](https://www.youtube.com/watch?v=Ho-i2G1WfEk) | Team meeting, break, feedback, work email. [Publisher chapters](https://dailyfinnish.fi/learn-finnish/videos/first-day-at-a-finnish-office/) | A1–A2 | **89** |
| `yt-dailyfinnish-apartment-hunting` | [Apartment Hunting in Finnish](https://www.youtube.com/watch?v=WH_bhOUZBMk) | Rental viewings, contracts and deposits, landlord phone call. [Publisher chapters](https://dailyfinnish.fi/learn-finnish/videos/apartment-hunting-in-finnish/) | A1–A2 | **89** |
| `yt-dailyfinnish-nurse-day` | [My Day as a Nurse in Hospital](https://www.youtube.com/watch?v=Etp8SN3EaIg) | 10 hospital staff/patient interactions. [Publisher chapters](https://dailyfinnish.fi/learn-finnish/videos/learn-finnish-for-real-life-2/) | A1–A2 | **84** |

**Verification statement:** Each video ID above was obtained by following a publisher page's direct "Watch on YouTube" hyperlink. The tool could not reliably play YouTube because of throttling; `embeddable=null`, `playback_verified=false`, `subtitles_fi_verified=false`, `teacher_review=pending` are deliberately preserved. Publisher titles and chapter *starts* were available, so linked segment metadata is valuable. Spoken audio/quality and claims like "natural" in the publisher copy have **not been independently validated**. No publisher-claim of copyright license implies a download right.

**Scaffold limitation:** DailyFinnish entries explicitly state **A1–A2** even where titles say "real Finnish". Therefore do not recommend the group as B1 examination simulations; use for initial roleplays, convert to original 80–100 word writing or 60–90s spontaneous speaking, then new real-speed B1 audio.

## 2. Stronger video collections on original publisher sites — no invented YouTube IDs

All are saved with honest `provider=publisher_page`, `has_youtube_id=false` in [external source index](publisher-series-catalog.json).

| Fit | Official resource | Why it deserves priority |
|---:|---|---|
| **100** | [Yle — YKItreenit B1](https://yle.fi/a/74-20082612) | Nine modules from three teachers: short B1 video/audio and comprehension tasks; *best verified CEFR alignment* in this round |
| **99** | [Kielibuusti/MAKU — Työelämän tilanteita](https://www.kielibuusti.fi/fi/opi-suomea/vinkkeja-kielenoppimiseen/opi-suomea-toissa/tyoelaman-tilanteita-videot) | Six workplace video scenes: coffee room, swap shifts, lateness, illness, inclusion, managing language gaps. Publisher states **CC BY-NC-SA** on series |
| **98** | [Kielibuusti — Turussa](https://www.kielibuusti.fi/fi/opi-suomea/kielibuustissa-kehitettyja-oppimateriaaleja/keskusteluja-suomeksi/keskusteluja-suomeksi-turussa) | Two authentic regional spoken scenes: ordering pastries and chatting about the weekend |
| **98** | [Kielibuusti — Kuopiossa](https://www.kielibuusti.fi/fi/opi-suomea/kielibuustissa-kehitettyja-oppimateriaaleja/keskusteluja-suomeksi/keskusteluja-suomeksi-kuopiossa) | Two colloquial pharmacy interactions: locating thermometers, asking about medication type |
| **97** | [Kielibuusti — Helsingissä](https://www.kielibuusti.fi/fi/opi-suomea/kielibuustissa-kehitettyja-suomen-oppimateriaaleja/keskusteluja-suomeksi/keskusteluja-suomeksi-helsingissa) | Thirteen short scenes on meetings, cafés, travel, classes, hobbies, dates and living |
| **94** | [Kielibuusti — Tampereella](https://www.kielibuusti.fi/fi/opi-suomea/kielibuustissa-kehitettyja-oppimateriaaleja/keskusteluja-suomeksi/keskusteluja-suomeksi-tampereella) | Two regional café and planning situations |
| **94** | [Kielibuusti — Oulussa](https://www.kielibuusti.fi/fi/opi-suomea/kielibuustissa-kehitettyja-oppimateriaaleja/keskusteluja-suomeksi/keskusteluja-suomeksi-oulussa) | Two local speech examples covering café orders, celebrations and past-tense narration |

**New opportunity:** 36 described episodes across seven source pages are *not* equivalent to 36 tested, embeddable video URLs. Where original publishers host video on-page and watch IDs are not visible, the correct catalog entry is a publisher page link. Do not invent ID or imply copying rights.

## 3. Evidence-based exercise conversion (not generic "watch this")

### Mission: `Asuntotarkastus / Vaurio huoneessa` — housing defect

- `discover`: show goal **"Sinun on ilmoitettava asunnon vauriosta"** and 1-2 required function chunks: `huomasin`, `voisitteko tarkistaa`. Content from [Moving Into First Finnish Home](https://www.youtube.com/watch?v=QVKNkT4W3Vo) scene **16:17 condition inspection** or **20:30 scratch**.
- `first_uncued`: ask `Mitä asukas huomasi? Mitä hänen pitää tehdä?`, free Finnish input.
- `self_repair`: once submitted, indicate **meaning error separately from grammar**, allow own rewrite; no answer leakage beforehand.
- `transfer`: *different original situation* — `vesihana vuotaa` — generate a polite **80-word Finnish email** without model answer. Independent score is human-reviewed pending S2 rubric, not fabricated YKI 3/4.
- Retest: 7/14-day unseen water-leak complaint without source clip.

### Mission: `Lääkärin vastaanotolla` — appointment

- `discover`: [hospital encounter video](https://www.youtube.com/watch?v=_-ZZsOQz1to), select from 03:35 triage / 10:36 doctor's examination; publisher slow dialogue = initial support only.
- `first_uncued`: summarize `Mihin potilasta sattuu? Mitä tehdään seuraavaksi?` in Finnish; no captions until response.
- `roleplay`: user explains symptoms, timing and requests clarification; never offer medical advice under the pretense of teacher feedback.
- `prove`: different authentic B1 recording with an unfamiliar voice, no subtitles, 7-day recall of Finnish request strategies.

### Mission: `Työvuoron vaihto` — unscripted speaking

- Publisher [MAKU work-situations](https://www.kielibuusti.fi/fi/opi-suomea/vinkkeja-kielenoppimiseen/opi-suomea-toissa/tyoelaman-tilanteita-videot). Speaker must *ask, justify, respond to refusal and propose alternative*; record original 45–60 second speech after prompt (consent).
- If `video` is not embeddable, link to official page; no downloading to our Git. Explain why `Onko mahdollista vaihtaa työvuoroa?` differs from `Vaihdatko vuoron?`.

### Mission: `Puhekielinen viikonloppu` — dialect and transfer

- Publisher [Turku region mini-conversation](https://www.kielibuusti.fi/fi/opi-suomea/kielibuustissa-kehitettyja-oppimateriaaleja/keskusteluja-suomeksi/keskusteluja-suomeksi-turussa): first listen to `Miten sul meni viikonloppu?`. Ask to explain meaning and answer in Finnish without seeing transcript.
- Post-answer explain `sul = sinulla`, `miten meni?`, not a pretest colored hint. New conversation about last week's family event.

## 4. Video acceptance and next implementer tickets

- **V3-AC-01**: all new 8 direct YouTube URLs have exact 11-character IDs from publisher links; no overlap with earlier 30 IDs.
- **V3-AC-02**: exact `chapters` count and starts for 7 scripted long lessons reflect publisher outlines; Aleksei duration unknown, don't guess time ranges.
- **V3-AC-03**: if video source states A1–A2, don't label as B1 or count as independent B1 test even if topic is exam-like.
- **V3-AC-04**: all 7 publisher series saved with **URL** and explicit `direct_video_ids_known=false` even when video is embedded.
- **V3-AC-05**: `score_100` means editorial learning relevance, not CEFR test level, retention uplift or legal embeddability.
- **V3-AC-06**: avoid raw audio/video from external YouTube or Yle; obey existing compliant player YTP-01..14 and publisher rights (CC BY-NC-SA attribution/share-alike obligations for MAKU).
- **V3-AC-07**: tasks based on original transcripts or subtitles are `teacher_review_pending`, no made-up answer keys or model grading.
- **V3-AC-08**: provide external fallback if embed blocked, track link rot separately from audio source fidelity.
- **V3-AC-09**: choose next new videos to close **B1 real-speed** gap, **not add more easy A1–A2 long lesson playlists**; high priority short spontaneous dialogues health/Kela/housing/employer/neighbor.
- **V3-AC-10**: records must be usable in an incremental publisher-page → verified video → teacher-approved 4-skill content pipeline.

**Developer follow-up:** Review 3 Kielibuusti regional/work series and a few Yle B1 listening exercises with S2 teacher, verify 1–3 minute segments, audio quality, consent/rights, then build **one** 20-minute interactive mission rather than many decorative video cards. Make sure 2027 digital YKI simulator remains isolated from any YouTube model answer.
