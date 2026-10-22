# Hospodar YKI — content architecture and physical folder rules

**Effective:** 22.10.2026. This describes **real physical folders**, not a virtual registry. See [the folder tree](FOLDER-STRUCTURE.md).

## Where each resource belongs

| Resource | Physical home | Content and examples |
| --- | --- | --- |
| Images, marks, textures | [assets/images/](../assets/images/README.md) | Project SVGs in `assets/images/brand/`; educational art belongs in an owned future images subfolder |
| Local audio, transcripts, captions | [assets/audio/](../assets/audio/README.md) | Human narration, original recordings, synthetic training, B1 listening audio and WebVTT |
| Licensed local videos | [assets/video/](../assets/video/README.md) | `open/*.webm`, source data, file availability and related README |
| External audio sources and listening research | [sources/audio](../sources/audio/README.md) | Link-only/rights-candidate audio references; never binary copies without rights |
| Study plans and listening routines | [learning/plans](../learning/plans/README.md) | 4-week listening and lesson plans; media referenced by stable paths |
| YouTube links and timestamps | [sources/youtube/](../sources/youtube/README.md) | Link-only JSON, YouTube research and creator/chapter references |
| Publisher links | [sources/publishers/](../sources/publishers/README.md) | Series and episode URLs; not redistributed media |
| Official demonstrations | [sources/official/](../sources/official/README.md) | YKI/SOLKI references, source verification, no assumed redistribution rights |
| Dictionaries and chunks | [knowledge/dictionaries/](../knowledge/dictionaries/README.md) | B1 lexicon, corpus frequency words and rektio |
| Books and external sources | [knowledge/](../knowledge/README.md) | Licensed third-party PDFs in `books/`, course/source research in `sources/` |
| Learning exercises | [learning/exercises/](../learning/exercises/README.md) | B1 lessons, real-life tasks, dialogues, cloze, diagnostics, 4 skills, video exercises |
| Pedagogical research | [research/pedagogy/](../research/pedagogy/README.md) | Methods, spaced recall, learning-science reviews, book blueprints |
| Visual design research | [research/design/](../research/design/README.md) | Color/attention evidence and design evaluation |
| UX research | [research/ux/](../research/ux/README.md) | Multimodal learning, accessibility, user research protocol |
| Gameplay research | [research/gameplay/](../research/gameplay/README.md) | NPC learning loops, Phaser 2D design proposals |
| User cases | [research/user-cases/](../research/user-cases/README.md) | Scenarios and product flows with acceptance and failure cases |
| YKI source research | [research/yki/](../research/yki/01-official-yki-2027.md) | Exam fidelity and evidence, not official 2027 implementation |
| Architecture research | [research/architecture/](../research/architecture/architecture-decision-v1.json) | Technology decisions and platform investigations |

## Rules for adding or changing files

1. **One physical home per file.** Place it directly in its subject folder. Do not create a second machine-generated registry or a mirror of its contents elsewhere.
2. **Stable IDs:** logical item/media IDs survive file moves. Update all JSON paths, app URLs, Python build/import scripts, GitHub Actions and Markdown links whenever renaming.
3. **Rights and provenance:** source URL, original creator, license and redistribution permission must accompany licensed media. A public YouTube watch URL is **not** a license to download or bundle. Never publish protected textbooks or external exam audio without permission.
4. **Accessibility:** video captions, audio transcripts, image alternatives for informative content; decorative SVGs explicitly labeled; review support for both Finnish and Ukrainian where needed.
5. **Production build is a separate boundary:** `assets/` in the repository is not a claim that Android Play Asset Delivery, a React Vite build or offline video packaging already works.
6. **Research ≠ implemented product:** distinguish evidence, hypotheses, design targets, and actual working code. Human Finnish/S2 review remains required for graded pedagogical materials.
7. **Safety-critical changes:** update owner README and exact consumers, run relevant Node/Python/Chromium tests and [folder validator](../scripts/validate_folder_layout.py), retain provenance of media and course items.
8. **No agent-generated indexes required to understand the layout.** The folder tree and short README in each domain are the navigation system.

## External best-practice references

[GitHub Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) · [Vite static assets](https://vite.dev/guide/assets.html) · [Android Play Asset Delivery](https://developer.android.com/guide/playcore/asset-delivery) · [W3C text alternatives](https://www.w3.org/WAI/tutorials/images/) · [REUSE software license specification](https://reuse.software/spec/) · [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies).
