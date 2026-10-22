# Audio and transcripts

**Existing binary source of truth:** [audio/](../../audio/) with [library](../../audio/library.json), [file availability](../../audio/available.json), [source inventory](../../audio/catalog.json), and [long B1 lessons](../../content/b1/audio-long/README.md).

Classify by source and usage: `human/original`, `human/derived`, `synthetic_training`, `speech_reference`, `learner_recording` (private; NEVER Git), subtitles/transcripts, and link-only external sources. The physical legacy paths `audio/open/`, `audio/human/`, `audio/long/` and existing manifests remain valid until migration. Audio files are **not** automatically official YKI demos.

New audio intake requires provenance/license/attribution, permitted transformations (no derivatives where restricted), speaker/locale, duration, codec, sample rate, transcript/VTT alignment, sha256, human review status and stable `mediaId`. The Web should stream licensed tracks; Android plans rights-cleared install-time Play packs. Never download YouTube audio for offline inclusion.
