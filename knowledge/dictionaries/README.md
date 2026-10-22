# Finnish dictionaries, lexicon and chunks — A2.2 to B1+

Current canonical files:
- [Contextual Finnish chunks](../../content/b1/lexicon/contextual-chunks-v1.json) — phrase-level retrieval, real contexts.
- [Word frequency TSV](../../content/b1/lexicon/frequency/yle-news-top10000-v1.1.1.tsv) — corpus vocabulary, see [frequency metadata](../../content/b1/lexicon/frequency/README.md).
- [Verb rections](../../content/b1/grammar/rektio-v1.json) — governing cases/prepositions as reviewed by content editor.
- [Grammar with context](../../content/b1/grammar/README.md) — drills linked to lexical patterns, **not another canonical dictionary**.
- [Original teaching chunks in themes](../../content/b1/index.json).

Record lemma, POS, forms/government, chunk, meaning Ukrainian, Finnish contextual example, source/rights, proficiency estimate and unique ID; do not tag every unfamiliar-looking word as proven unknown to an individual learner. Personal spaced-review status and first attempts live in a **private learner data store**, not in Git.

Do not fork the same lexicon into independent JSON copies in `knowledge/`; this is the discoverability layer. The future normalized `packages/content` domain should consume these via stable IDs and versioned adapters after tested migration.
