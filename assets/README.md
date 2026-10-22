# Assets: images, audio, video and game media

**Repository authoring taxonomy**, not a new deployed runtime asset directory. Existing working files remain where current code and manifests expect them: `brand/logo/`, `audio/`, and `video/open/`. No duplicates or unreviewed moves.

- [images](images/README.md): SVG/illustrations/photographs/sprites, accessible alt text and source/rights metadata.
- [audio](assets/audio/README.md): recorded Finnish audio, voice samples, transcripts and WebVTT captions.
- [video](assets/video/README.md): licensed originals, videos with subtitles, poster frames and offline packaging rules.
- [content architecture](../docs/CONTENT-ARCHITECTURE.md): source/delivery path distinction, per-asset metadata, versioning and licensing.

Web future: Vite-imported hashed assets in `apps/web/src/assets` and `public/` only when stable raw filenames are required; opt-in selective offline. Android future: Gradle Play install-time PAD pack payloads staged by build pipeline, not 2–3GB blobs copied into `assets/` in Git. Large sources belong in rights-controlled object storage or appropriate Git LFS (after capacity/hosting review), **not** casually committed to Git.
