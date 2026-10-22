# Security, privacy, licensing and AI-specific risks

**Status:** threat model and pre-release requirements; not a security audit or proof of GDPR compliance. For immediate coding rules see [AGENTS](../AGENTS.md); for cross-platform event guarantees see [CONTRACTS](CONTRACTS.md).

## Data classification / boundaries

| Data | Sensitivity | Boundary and default |
| --- | --- | --- |
| Lesson scripts, verified exercise keys, IDs | Mostly public/content IP | Bundle only materials with redistribution permission; exam keys cannot be leaked early |
| Answers, weak areas, study history | Personal learning data | Device-local first, export/delete controls; no default third-party sync |
| Voice recordings, raw transcription | Potentially sensitive biometric-like content; treat as highly sensitive | Explicit recording consent, clear retention, no default upload or analytics; local temporary clips are **not** promised crash-durable |
| Login/session tokens (future) | Secrets | Secure OS/session storage and short-lived tokens; never Git/log/local public assets |
| AI requests (future) | Personal content | Opt-in, data minimization, secure gateway, bounded retention, disclosure of provider/region |
| Licensed media | Copyright and supply-chain | Source/author/license/redistribution scope, checksum/hash, asset integrity before release |

## Threats and controls to implement

1. **Unauthorized content/answer reveal:** isolate EXAM state, delay solutions until submit, avoid putting secrets into client-side "hidden" UI; client-side practice items are never a secure proctored exam.
2. **Local storage loss or injection:** Web storage may be evicted/deleted, multi-tab writes conflict; input validation and atomic write-before-navigation; backup/export UI. Android Room integrity and migrations need actual device tests.
3. **Duplicate/replayed events:** command ID, original receipt, fingerprint, compare-and-swap, schema validation. Avoid trusting mutable client score when future sync is enabled.
4. **Bridge and media traversal:** allow-listed `packId`, relative path validation including encoded traversal, content-hash checks, safe asset pack access and no unvalidated absolute filesystem paths.
5. **Supply chain:** pin locked production dependencies once installed, review package permissions and GitHub Actions changes, least-privilege `GITHUB_TOKEN`, no arbitrary script execution from exercise content.
6. **AI prompt injection / content poisoning:** third-party learning texts and AI responses are untrusted **data**; never follow embedded instructions to reveal credentials, disable policies or run tools. Bound AI-generated feedback to editorial rubrics, quote/source identifiers, user consent and human-review paths.
7. **Auth/sync future:** optional EU-region hosting choice; least-privilege RLS, tenant-isolation tests, rate limits, server-side secrets, encrypted transport and deletion/export policies **before** rollout.
8. **Licensing/privacy:** do not download and ship YouTube/official YKI recordings without explicit distribution rights. Keep source-license ledger and video/subtitle attribution; separately record human language review.
9. **Accessible safety:** errors understandable, reduced-motion/keyboard/reader support, no hidden destructive data reset, no misleading "saved" or "official grade" claims.

## Practical PR review questions

- Which data enters Git, analytics, AI providers or external URLs? Are opt-in/opt-out and retention documented?
- Could a corrupted input or retry silently lose progress or reveal answer keys?
- Does this PR add media or dependencies with uncertain legal rights?
- Did the agent copy private learner data into tests, screenshots, issue text or CI logs?
- What did we actually test (browser, Android binary, Play-delivered pack, RLS, load)?

**Disclosure:** never post secrets, authentication material or private recordings to public issues. Follow GitHub security reporting rather than publishing exploitation details. No public vulnerability contact/bug-bounty process is asserted here; owners should configure private vulnerability reporting as appropriate.

## Release blockers

Until established: verified content-license inventory, privacy notices/consent and retention, backup/export, applicable GDPR assessment, threat review, Kotlin/Capacitor build and malicious-path tests, supply-chain review, and evaluated AI feedback. See [RELEASE.md](RELEASE.md).

## Repository supply-chain and licensing controls (documentation policy)

- External GitHub Actions are pinned to the verified commit SHA of the upstream action, not mutable major-version tags. Recheck the upstream tag and review changes when upgrading; see [CI quality gates](operations/CI-QUALITY-GATES.md).
- Keep workflow permissions least privileged, never run untrusted PR scripts with write tokens, and treat content and media metadata as untrusted inputs.
- No blanket license grant exists for the entire public repository. Follow [licensing boundaries](../LICENSING.md) and review each third-party audio/video/PDF before redistribution.
- A local-first architecture reduces some data transfers but is **not** a blanket GDPR compliance claim. Voice, optional AI and eventual Supabase require concrete privacy documentation and platform tests.
