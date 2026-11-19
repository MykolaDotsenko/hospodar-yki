# Material search round — 19.11.2026

Rule: AGENTS.md §8 (CURATED-09/10) — a search round every 2–3 days, rights first. This round was done with a web search
only: direct fetches of www.oph.fi, ykitesti.solki.jyu.fi and jyx.jyu.fi are blocked from the build environment
(proxy 403), so **no page below was opened and no licence was read on its own page**. Every entry is a candidate
for a person to check. **Nothing was downloaded; no file was added to `assets/`.** Licences below are as reported in
search snippets and must be confirmed on the source page before any use beyond a link.

Queries (19.11.2026): Kielibuusti new listening material 2026; YKI 2027 digital practice material (OPH, keskitaso);
Finnish spoken audio under open licences (Commons, corpora); S2 adult listening research 2026; Yle Selkouutiset.

## 1. Official YKI news to recheck (YKI-FID-10, EXV-20) — human recheck, not code

Titles found on oph.fi (pages not opened). If confirmed, they may change the evidence ledger
(`research/yki/yki-digital-fidelity-evidence-2026-10.json`) and the exam profile's `last_checked`:

| Title (as indexed) | URL | Why it matters |
| --- | --- | --- |
| Digital YKI tests will be piloted November 2026 | https://www.oph.fi/en/news/2026/digital-yki-tests-will-be-piloted-november-2026 | the pilot is the trigger for the post-pilot recheck (YKI-FID-10) |
| Subtest days for the YKI test will be piloted autumn 2026 | https://www.oph.fi/en/news/2026/subtest-days-yki-test-will-be-piloted-autumn-2026 | partial-day (subtest) sessions relate to EXAM-PILLAR-01 «official partial-day profiles not modelled» |
| Digital YKI certificates are ready | https://www.oph.fi/en/news/2026/digital-yki-certificates-are-ready | certificate delivery only; no simulator behaviour |
| Technical error affected some YKI test registrations | https://www.oph.fi/en/news/2026/technical-error-affected-some-yki-test-registrations | registration only; no simulator behaviour |

Action for a person: open each page, record date and content in the evidence ledger, then decide whether any exam
profile record or the subtest-day profile can be written (form docs/21 §10.3). The simulator changes nothing until then.

## 2. Audio candidates (multi-talker / authentic speech, R05) — RIGHTS_PENDING, link-only

| Candidate | Where | Licence (as reported) | Fit | Status |
| --- | --- | --- | --- | --- |
| Donate Speech (Lahjoita puhetta) data, casual Finnish speech with aligned transcripts | https://kielipankki.fi/?p=20126 | CC BY 4.0 reported for the published set; access route (Kielipankki) to be checked | many speakers, everyday puhekieli — a possible source for R05 multi-talker perception items | check access terms, consent scope and whether redistribution in an app is allowed |
| Samples of Spoken Finnish (SKN, Kotus), recordings with aligned transcripts | https://www.kielipankki.fi/corpora/skn/ | CC BY 1.0 reported | dialect recordings — exposure to variation, **not** YKI core | check licence page; dialect material must be labelled as such |
| Common Voice Finnish (scripted read speech) | https://datacollective.mozillafoundation.org/datasets/cmj8u3p3k0089nxxb4u6hcqd5 | CC0 reported | many voices, single sentences | already noted in R05: possible platform terms on redistribution — do not package without clearance |
| Wikibooks «Finnish/Dialogues» with native-speaker audio | (Wikibooks; mirror seen in results) | text CC BY-SA; **media terms vary per file** | short everyday dialogues | check each audio file's own licence on Commons before any use |

## 3. Link-only learner material (already in the app's link families or close to them)

| Candidate | URL | Note |
| --- | --- | --- |
| Yle Selkouutiset, daily easy-Finnish news (radio/TV, text under the video) | https://yle.fi/p/56-74-412/fi | Yle is already on the learning-link list (link-only). Daily episodes through at least summer 2026 in the index. A podcast feed was not confirmed. Candidate for a «Де вчитися далі» row if not already linked. |
| Yle «Harjoittele YKI-testiin» topic page | https://yle.fi/t/18-122318/fi | may duplicate the catalogued `yle-2024-b1`; check before adding |

## 4. Research (for research/, not for learners)

| Item | URL | Note |
| --- | --- | --- |
| Pitkänen 2025 (doctoral thesis): speech comprehension and intelligibility of L2-Finnish physicians, B1–B2 | https://trepo.tuni.fi/handle/10024/224921 | comprehension problems common at B1–B2 and can fail at any processing stage — supports listening-process feedback (evidence-guided listening), not a new method |
| Tervola & Pitkänen 2026 (linguistics.fi) | https://www.linguistics.fi/wp-content/uploads/sites/29/2026/04/Tervola-Pitkanen-1.pdf | L2-Finnish physicians B1–B2; read before citing |
| Kielitieteen päivät 2026 abstracts on perception | https://sites.uef.fi/kielitieteenpaivat2026/wp-content/uploads/sites/565/2026/02/havaitsemisesta_abstraktit.pdf | conference abstracts only |

If a research item is used, it goes through the research protocol (research/RESEARCH-PROGRAM.md) with its
counter-evidence and an explicit ADOPT/ADAPT/REJECT decision — this list is not that.

## Result

- Found: 13 candidates (4 official news pages, 4 audio sources, 2 link-only learner pages, 3 research items).
- Added to the app or `assets/`: 0 (no licence verified on its own page; no fetch possible).
- Next round: after the network hosts are added (www.oph.fi, ykitesti.solki.jyu.fi, jyx.jyu.fi) — then open the
  official news first (section 1), because it may unblock the subtest-day profile.
