# Architecture research — рішення й технічні обмеження

Файли в цій папці містять **машинозчитувані архітектурні дослідження**, які відповідають нормативним ADR:

- [architecture-decision-v1.json](architecture-decision-v1.json) — оптимальний Web-стек і модульна архітектура;
- [android-game-distribution-v1.json](android-game-distribution-v1.json) — Android, 2D, asset delivery та офлайн;
- [reliability-architecture-adr-v1.json](reliability-architecture-adr-v1.json) — надійність, транзакції та відновлення стану.

**Нормативні рішення:** [ADR-022](../../docs/22-optimal-stack-and-architecture-adr-2026-10.md), [ADR-023](../../docs/23-android-offline-game-and-3gb-media-architecture.md), [ADR-024](../../docs/24-reliability-hardened-architecture-web-android.md) та [ADR-027](../../docs/27-stack-architecture-compatibility-and-implementation-gates.md). Пізніший ADR-024 замінює ранню ідею Android IndexedDB: Web — IndexedDB/Dexie, Android — Room/SQLite.

Це **проєктні рішення**, а не доказ готового APK/AAB, 3GB PAD або працездатності Phaser. Статус коду й тестів — у [roadmap](../../docs/25-implementation-vertical-slice-roadmap.md).
