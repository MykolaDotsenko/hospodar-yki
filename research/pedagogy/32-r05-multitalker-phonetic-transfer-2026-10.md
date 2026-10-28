# 32 — R05: багатоголосе аудіювання, фонетична довгота та незалежне говоріння

**Перевірено:** 28.10.2026. **Owner:** research/pedagogy; source/licensing owner: sources/audio; audio binaries owner: assets/audio. **Status:** SOURCE_REVIEW_COMPLETED / LESSON_AND_STUDY_SPEC_DRAFT / MULTITALKER_PACK_NOT_RECORDED / PARTICIPANT_TRIAL_NOT_RUN. **Population:** дорослі україномовні A1.3–B2.1, фінська як L2; LEARN і EXAM YKI keskitaso є різними продуктами.

**Existing owners — не дублювати:** [research plan R05](../29-twelve-product-research-studies-execution-2026-10.md#r05--автентичне-аудіювання-й-фонетична-тривалість), [наявна аудіобібліотека: 85 physical files, лише частина human](../../assets/audio/README.md), [YKI listening source collection](../../sources/audio/YKI-LISTENING-RESEARCH-2026-10.md), [Wave6 Commons candidates (7; not imported)](../../sources/audio/WAVE6-LICENSED-AUDIO-CANDIDATES-2026-10.md), [виділення форм у L2 R03](30-r03-finnish-morphology-ukrainian-learner-evidence-2026-10.md), [науково-UX синтез №18](../design/18-multisensory-learning-interface-evidence-2026-10.md), [R01 evaluation protocol](../ux/learning-impact-evaluation-protocol.md), [EXAM 2027 first-party fidelity](../../docs/14-digital-yki-fidelity-spec.md). **Немає нового реєстру методик або нових вигаданих балів.**

## 1. Питання, рівень доказовості, висновок

**PICO:** adult Ukrainian-L1 Finnish A2–B1; original licensed native/natural multi-talker listening + explicit perceptual discrimination + meaning-first active response + later delayed new-voice/new-situation transfer **vs** content/time-matched strong original single-talker + meaningful semantic feedback/active listening. **Primary:** day-14 independent **unseen-voice** gist/detail comprehension; secondary day-30 comprehension and blind human-rated intelligible oral response. Separate trained-item accuracy vs unseen lexical transfer; separate **perception vs production**. Do not claim causal Hospodar improvement until this study runs.

**Product choice:** **ADOPT/P0**: build a small, S2-reviewed human-narrated natural voice starter collection that includes male/female *without stereotyping*, multiple clear speaking styles, everyday formal and informal variants, noisy-room accessibility; in LEARN combine one initial unassisted meaning task → listen once/replay if in teaching step → focused chunk/contrast → learner own oral response → new scenario → delayed unseen voice. **EXAM**: no hint, transcript or replay assumptions; unknown 2027 audio rules remain UNKNOWN until OPH verified. Source URLs alone do not grant redistribution rights.

## 2. Докази — research → Hospodar рішення (not product outcomes)

| ID, evidence applicability | Design / measured effect / limitations | Practical Hospodar decision |
|---|---|---|
| **R05-E01 [Uchihara, Karas & Thomson, 2025](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6)**, META L2_GENERAL | 79 studies HVPT speech **perception**, treatment-control g=.67 (k=32); pre–post g=.92; retention & some novel stimuli generalization. Participants, languages, phone sets vary. **Not** Finn-specific; g not %; trained talker difference not universal. | P0 ADAPT: several independently voiced contrasts (e.g. tuli/tuuli/tulli) plus new-vocalizer held-out check; do not label successful perception as pronouncing correctly. |
| **R05-E02 [Uchihara et al., 2024](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/does-perceptual-high-variability-phonetic-training-improve-l2-speech-production-a-metaanalysis-of-perceptionproduction-connection/E38D8F5CE65DC708137B0E95F97C6BC7)**, META L2_GENERAL | 31 studies inspect **production** transfer, separate from perception. Generalization from recognition to speaking is not automatic; training/test contrasts heterogeneous. | P0 ADOPT: independent actual human listening assessment of *speaking intelligibility* rather than ASR transcript/quiz score; crossref R04. |
| **R05-E03 [talker variability network review 2025](https://pubmed.ncbi.nlm.nih.gov/39937693/)**, META L2_GENERAL | Bayesian network comparison of levels of speaker variability; no evidence every possible voice mix is beneficial at every proficiency or segment. | P1 EXPERIMENT: avoid an invented "exact optimal speaker count". Predefine 1 vs 3 vs 6 voices as **experimental levels** (numbers are Hospodar design choices, not published optimum); control total duration and level. |
| **R05-E04 [Kurokawa, Hein & Uchihara, 2025](https://doi.org/10.1111/lang.12697)**, META L2_GENERAL | 49 studies / 89 effects: captioned vs no captions incidental vocabulary g=.56, 95% CI [.38,.73]; substantial heterogeneity. **Vocabulary ≠ independent unaided listening**. | P0 ADOPT optional Finnish captions **after** initial gist/meaning response in LEARN; explicit second-pass support. Hide on held-out tests and live EXAM. |
| **R05-E05 [Kurokawa & Uchihara, 2026](https://doi.org/10.1002/tesq.70081)**, CONTROLLED ENGLISH-L2 | 149 Japanese EFL learners, captions and repeated viewing, post- and delayed 20-word measures; cross-language task. | P1 ADAPT: user-controlled replay and caption toggle, not a guaranteed 3-replay optimal rule; hold-out no-caption transfer. |
| **R05-E06 [Sutton & Webb, 2026](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effects-of-audiovisual-input-on-second-language-learning-a-metaanalysis/9B61BAEF14F110F01148E398D171634A)**, META L2_GENERAL | 56 experiments, n=1954, 75 effects. Reported within-group pre-post g=.89, described as "small" by authors; **within-group** effect not comparative effectiveness or Finnish uplift. Educational videos generally fared better than entertainment formats; risk of exposure/test practice and heterogeneity. | P0 ADAPT: give videos a defined meaningful language question; do not allocate storage for passive TV-clips merely to fill 4GB. |
| **R05-E07 [Bali et al., 2026](https://doi.org/10.1186/s41235-025-00699-2)**, 2 lab experiments N=61, INDIRECT | More relevant images enhanced audiovisual recall but not audio-only recall; lower English proficiency/attention worsened recall in high visual load. Not delayed Finnish skill transfer. | P0 ADAPT: *one* still photo/map of the real communicative context when relevant; no 3 rotating decorative images in a listening item. |
| **R05-E08 [L2 technology & cognitive load 2026](https://doi.org/10.1016/j.system.2026.104068)**, META L2_GENERAL | 35 higher-ed L2 studies; achievement g=.69, load g=-.20, interventions differ. Composite technology, **not proof that any animation/game improves Finnish**. | P0 ADAPT to quiet listening player; explicit learner control; no visual performance theater. |
| **R05-E09 [Finnish phonetics instruction, Kielikello/Kotus + Kielipankki](https://www.kielipankki.fi/arkisto/resource-info/spoken-corpora/)**, LANGUAGE-SPECIFIC SOURCES | Long vowels/geminates change lexical meaning; Finnish colloquial contrasts must be reviewed by S2 phonetics. Corpus access ≠ redistribution. | P0 original native speaker minimal-pair recordings for tul(i)/tuuli/tulli, muta/mutta/muuta, tuli/tuuli; **only human-reviewed true contrasts** and contexts (do not assume all invented pseudo-words valid). |
| **R05-E10 [Samples of Spoken Finnish, Helsinki/Kielipankki](https://datakatalogi.helsinki.fi/items/edc4afba-6104-4c03-92fb-db4b2795b505/full)**, DIRECT_FINNISH_CORPUS | 50-dialect documentary samples, metadata says Open, CC BY 1.0; **linguistic authenticity ≠ beginner clarity**; historical regional speech. Repo already contains selected SKN recordings. | P1 use as advanced/dialect contrast only; rights check per file and exact project credit; DON'T re-add duplicates or treat as B1 everyday turns. |

**No false certainty:** both HVPT papers may overlap contributing studies; cannot add g=.67 to other meta estimates. All effect sizes describe *study populations*, not app improvements. Controlled outcomes must measure human understanding of **unseen** Finnish, not listening-time, click rates or ASR transcription accuracy.

## 3. Practice designs (first attempt → support → transfer): original Finnish scripts, awaiting S2/voice recording

### R05-L1 — phonemic length (A2→B1, 3 human talkers planned)

- **Contrast:** *tuli* (вогонь / прийшов залежно від контексту) — *tuuli* (вітер) — *tulli* (митниця). **Meaning/task:** «Mitä kuulit? Mitä tapahtui?» (Що почув? Що сталося?) із семантичною картинкою лише після першої спроби.
- **First independent listen:** normal speed/one speaker → identify meaning without showing written answers if doing listening-only discrimination.
- **Corrective phase:** replay isolated pair from different human speaker; waveform/mark vowels **optional and only after answer**; ensure speech intelligibility, no misleading drawn waveform.
- **Product test:** new speaker, new meaningful sentence, 14-day unseen discrimination. Separate production check scored by *human* intelligibility. No pronunciation grade from ASR.

### R05-L2 — huoltoyhtiö voicemail (A2.2→B1.2, original two speakers)

- **Natural Finnish prompt original:** «Hei! Täällä on huoltoyhtiöstä Sari. Huoltomies pääsee käymään torstaina kahden jälkeen. Sopisiko se teille? Soittaisitteko takaisin ennen keskiviikkoa.»
- **Question before transcript:** who calls, when visit, when reply due, and what next action is expected? User answers **own words**: «Voin ottaa huoltomiehen vastaan torstaina klo 14 jälkeen.»
- **Support phase after attempt:** slow playback, full text and one chunk *kahden jälkeen / ennen keskiviikkoa*; compare with *torstaina kahdelta*; learner self-repair.
- **Unseen transfer:** short recorded delivery-company call by a **different voice** with changed date and deadline at 14/30 days. Independent comprehension not artificial accent mimicry.

### R05-L3 — puhekieli ↔ kirjakieli (B1.1→B2.1)

- **Original two-turn design:** «Mä oon jo matkalla, mut bussi on myöhässä.» → «Selvä, odotan sinua pysäkillä.»
- **Meaning first:** learner chooses sensible real reply; **only later** reveal *mä → minä*, *oon → olen*, *mut → mutta* and social context. Avoid marking correct puhekieli as wrong formal grammar; teacher/S2 verify register.
- **Unseen transfer:** different speakers/region + novel everyday bus/work/social situation; check whether learner communicates, not just repeats phrase.

### R05-L4 — 1-minute mini-dialogue (B1.1→B2.1)

- Script skeleton: problem → clarification → time/price/location correction → confirmation. e.g. «Voisitteko tarkistaa, milloin bussi lähtee?» / «Se lähtee puoli neljältä, ei neljältä.»
- After first gist/details, guided reply, role-switch and genuinely different speaker. One optional *task-relevant* still or route map, no pointless NPC animation during acoustic content.
- **All scripts are original design drafts, not recorded, not licensed third-party recordings and NOT yet S2-approved or playable.** Include right-to-record/release of human voices and annotated prompt variants before implementation.

## 4. Audio content production/rights QA (required)

For every real, distributable asset: **unique ID, first-party URL, publisher/author, per-file license and commercial/derivative rights, sound speaker consent, transcript source/rights, sample rate/codec/loudness/quality, speaking style, number of speakers, language/register, topic, CEFR *editorial estimate*, word/phoneme contrast, duration, SHA-256, byte length, release pack, answer prompts/held-out split, S2 sign-off**. Per-file review for protected voices/personal data. Published resource ≠ blanket permission. Avoid unreviewed machine transcript for scored listening.

**Current baseline:** [assets/audio/README](../../assets/audio/README.md) documents **85 audio binaries: 78 OGG + 7 MP3**, consisting of 14 original recordings, 12 segments derived from two originals, 15 LibriVox human excerpts, one full human fairy tale, 37 Harri TTS, six synthetic B1 long tracks; **segments are not new voices**. No claim of 85 natural speakers! Before any new imports inspect current manifest to avoid re-counting.

**New or newly revisited sources with status and blocking rights** in [R05 source intake](../../sources/audio/R05-MULTITALKER-MATERIAL-INTAKE-2026-10.md). No raw Yle/Inspera/OPH protected material downloaded. Actual source link and rights labels are not media files.

## 5. 3–4 GB offline installation budget (product design, not file-size measurement)

**Preserve earlier accepted ADR-023/024/027 install-time requirement**: full licensed offline curriculum should be delivered at Google Play install using AAB + separate **install-time Play Asset Delivery packs**; cannot claim same experience for PWA or a single huge APK. User has expanded allowable **full install size to ~3–4 GB** (previous planning 2–3). Google Play official constraints as checked 28.10.2026: **base ≤500 MB**, **each asset pack ≤1.5 GB**, **base plus all install-time modules/packs ≤4 GB compressed**; recommended substantially smaller base; measured Google Play compressed size, not raw disk footprint. [Official limits](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en).

**Proposed provisional cap = 3,600 MB compressed, 400 MB buffer to 4,000 MB constraint:**

| Component | Planned cap (compressed MB) | Delivery |
|---|---:|---|
| Base app / UI / offline state / metadata | 160 | base, before first run |
| Starter audio: core A1–B1 voice/phonetics | 1,100 | pack audio-core install-time |
| Advanced audio: multi-speaker B1–B2 and transcripts | 640 | pack audio-advanced install-time |
| Contextual short video/subtitles | 930 | pack video-scenes install-time |
| 2D narrative world/NPC art, optional visual media | 490 | pack game-world install-time |
| Original EXAM-practice media + redundancy/reserve | 280 | pack exam-practice install-time |
| **Total budget** | **3,600 MB** | all included at install |
| **Headroom** | **400 MB** | not mandatory to fill |

**Important:** this is a PLANNING ALLOCATION, not current repo bytes or existing licensed content. No single pack over 1.5GB. Real AAB + PAD with reproducible bundletool/Play Console download measurement and installed disk usage must be tested; compression may be poor for already-compressed video/audio. Reserved margin also covers device variants, metadata and upgrades. A lite/optional-download flavor may be evaluated separately, **not silently replace** the full-offline product requirement.

**Priority:** content quality / novel talker / original interactive tasks / rights > occupancy of storage. Never ingest large datasets just to fill 4GB. Scaled verified original multi-talker library must be planned with recordings, licensing, transcripts and independent evaluation, not arbitrary 4GB sample dump. Web/PWA uses individually chosen content caching quotas and graceful low-storage fallback; does not pretend 3.6GB guaranteed in IndexedDB.

## 6. Pre-registered test proposals and failure modes

| Study | Intervention vs strong comparator | Independent outcomes (blinded) | Main risks |
|---|---|---|---|
| R05-H01 (P0, NOT RUN) | 3 independent voices vs one voice, equivalent script/time and meaningful feedback | day 14 unseen voice gist/details; day 30 novel situation | Voices/accent difficulty mismatched; repeat not controlled |
| R05-H02 (P0, NOT RUN) | Minimal-pair acoustic training + meaningful production vs time-matched meaning practice | day 14 unseen perceptual contrast **and separate human-rated speaking** | Artificial pair memorization; ASR as proxy |
| R05-H03 (P1, NOT RUN) | Caption after first answer vs immediate caption, content/time matched | day 14 no-caption new talker vocabulary/comprehension | Transcript leak; differences in reading ability |
| R05-H04 (P1, NOT RUN) | One relevant still image vs no image/3 decorative images | day 14 gist + delayed new context; cognitive-load self-report | Surface task simplification confound |

**Controls:** blinded S2 human scoring, balanced A2/B1 proficiency, noisy/quiet recording conditions as pre-registered, native-speaker voice rights, no private uploads in Git, accessibility no-audio fallback for non-scored teaching, protocol review, time in actual seconds, attrition, CIs, no fake n or Hospodar g. A perception result does not confirm speaking. Collect no accent ethnicity inference.

## 7. Acceptance gates R5-01…R5-16 (all PROPOSED / NOT PASSED)

1. 100% of bundled audio has rights/attribution/consent/license, SHA-256 and reproducible origin.
2. Real human vs TTS vs derived segment clearly identified, no counting segments as talkers.
3. Minimum one verified A2/B1 everyday multi-talker task with independent gist/detail and self-repair (S2 reviewed).
4. Target Finnish phoneme/length contrast human-verified; no ambiguous pseudoword or wrong semantics.
5. At least one novel voice/item held out of teaching and used only in independent review.
6. Separate perception / human oral production and intelligibility results.
7. Captions/transcript do not leak before first attempt or in held-out listening.
8. EXAM 2027 timing/audio repeats only verified by official first-party source (R02).
9. Audio fail/no permissions/interrupt/headphone loss cannot misgrade language.
10. Sound effects/music silent during meaningful speech, optional/muted in settings; EXAM no game sounds.
11. Playback normal speed accessible, optional slower teaching mode not labeled official exam.
12. Native voices have dated signed releases; recordings with personal data blocked.
13. Acoustic QA checks including clipping, intelligibility across speakers/devices, file decoding.
14. Day-14 and day-30 unseen comprehension plus distinct speaking, matched-time active control preregistered and independently assessed.
15. Install-time packs preserve offline playback after restart/airplane and verify per-pack SHA/routing; benchmark on actual Android, not paper ADR.
16. 4GB Play compressed cap with slack; per-pack 1.5GB cap; not an unsupported single-file APK claim.

**Implementation priority:** Stage A teacher-curated, rights-cleared two-voice everyday task + novelty test (P0). Stage B 3+ talker Finnish length inventory and explicit perception/production split (P0). Stage C consented human/UX study (P0). Stage D expand to 3.6GB **only as valuable validated content becomes available** (P1). No new app behavior shipped by this research PR.

## 8. Future handoff

- **Source selection and rights:** [sources/audio/R05 intake](../../sources/audio/R05-MULTITALKER-MATERIAL-INTAKE-2026-10.md); do not place protected material in Git.
- **Calm listening visualization/sound and modality sequencing:** [design follow-up №19](../design/19-r05-sound-visual-design-transfer-2026-10.md).
- **Storage/packaging:** [ADR-023](../../docs/23-android-offline-game-and-3gb-media-architecture.md) + [ADR-027](../../docs/27-stack-architecture-compatibility-and-implementation-gates.md); no core-stack rewrite.
- **R01/R04** human-outcome calibration and no fake YKI level; study effects must be independently observed on product users.
