# Contributing to Hospodar YKI

This file describes **software contributions**. For Finnish lesson/audio/video authoring and redistribution rights, see [learning/CONTRIBUTING.md](learning/CONTRIBUTING.md).

1. Start with [AGENTS.md](AGENTS.md), [docs/INDEX.md](docs/INDEX.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and the area-specific tests.
2. Keep PRs small, reversible and linked to an acceptance criterion. Respect [architecture](docs/ARCHITECTURE.md), [contracts](docs/CONTRACTS.md) and [security](docs/SECURITY.md).
3. Run applicable [tests](docs/TESTING.md); describe exact results, including NOT RUN. Kotlin source-only changes cannot be certified by JS CI.
4. When changing behavior, update the *owning* requirement/ADR or the implementation status and the relevant docs in the same PR.
5. Use [.github/pull_request_template.md](.github/pull_request_template.md). No credentials, private learner answers/voice or unauthorized third-party assets in commits.

AI-generated contributions must have the same human/accountable review and executable proof as hand-written code. See [AI workflow](docs/AI-WORKFLOW.md).

For new integrations and content, follow the [Web/Android migration guide](docs/guides/WEB-ANDROID-MIGRATION.md) or [learning material how-to](docs/guides/CONTENT-AUTHORING.md). See [licensing boundaries](LICENSING.md); do not assume a single open-source license covers third-party media.
