# External knowledge and media sources — URL-only and provenance

External references are **not shipped media** and do not become licensed files merely by being listed. Local owned media and curricula are indexed in [catalog](../catalog/README.md); cross-cutting rules in [content architecture](../docs/CONTENT-ARCHITECTURE.md).

| Kind | Discover | Existing source of truth |
| --- | --- | --- |
| YouTube (watch URLs, timestamps) | [YouTube](youtube/README.md) | `video/youtube-catalog.json` |
| External creators/publishers | [Publishers](publishers/README.md) | `video/publisher-series-catalog.json`, `video/publisher-episode-catalog.json` |
| Official YKI/demo sources | [Official](official/README.md) | `video/yki-mock-simulation-sources.json`, `research/yki-*.json` |
| Books, courses, webpages, corpora | [Knowledge](../knowledge/README.md) | `docs/03…`, `docs/10-yki-resources-machine-index.json`, `research/yki-content-sources-2026-10.json` |

A new link/source entry records creator, original URL, source type, date checked, level/skill/tags, verification status, whether official, rights/embedding restrictions, planned exercise linkage and review status. Do not confuse existence of a URL with verified playback or instructor-reviewed pedagogy.

**Policy:** YouTube watch/embed only under applicable platform rules; publisher/official educational snippets remain link-only without separate explicit distribution license. Don't fetch YouTube videos/captions into `assets/`, `audio/`, `video/` or Play packs.
