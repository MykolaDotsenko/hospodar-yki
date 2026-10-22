# Catalog — one indexed view of existing Hospodar YKI materials

To register a reviewed binary change without guessing Git hashes, run `python3 scripts/update_media_inventory.py --write` and review the diff. This updates **technical identities only**; independently verify file-level source, license and redistribution permissions before release.

**Authoritative discovery data:** [registry.v1.json](registry.v1.json). **Binary baseline:** [media-inventory-v1.json](media-inventory-v1.json) (Git SHAs/sizes, not a copyright claim). **Future resource schema:** [schemas/resource.v1.schema.json](schemas/resource.v1.schema.json).

These files are **pointers**: keep originals in `content/`, `audio/`, `video/`, `brand/`, `research/`, `docs/`. No exercise, voice sample, title, answer key, license or YouTube stream is duplicated in this catalog. The manifest defines **where to look and who owns changes**, not a new asset-serving URL or validated media-rights list.

## Layers and conventions

- `collection_id`: immutable machine name, `category`: one of official topology categories, `canonical_paths`: existing files or directories owned by that collection, `references`: other relevant docs/sources (many-to-many, no ownership transfer).
- `status`: `implemented_source`, `curated_link_only`, `research_only`, `target_only`. This records **material existence**, not full content correctness or production deployment.
- Binary manifest records `path`, `git_blob_sha`, `size_bytes`, `kind` and `rights_state=check_existing_provenance`. Rights are determined from per-file provenance, NOT automatically from Git blob or filename.
- New asset content: start at [Content Architecture](../docs/CONTENT-ARCHITECTURE.md), validate ownership schema and ensure actual creator/license/SHA-256 for redistributable pack items.
- Do not introduce `catalog/`-owned copies of original source JSON; instead link to one canonical file under its owner.
- Content registry checks run in [repository taxonomy CI](../.github/workflows/validate-repository-taxonomy.yml); `node --test` + existing Python validators remain responsible for actual exercises/audio/video consistency.

**Useful commands:**

```sh
python3 scripts/validate_repository_taxonomy.py
python3 -m unittest discover -s scripts/tests -p 'test_validate_repository_taxonomy.py'
node --test app/tests/*.test.mjs
```

These checks **do not** measure learning effectiveness, verify live YouTube links, grant licenses, reproduce YKI 2027 or install Android packs.
