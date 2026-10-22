# Android native bridge prototype — not yet a buildable Android app

This folder contains **real Kotlin implementation sources**, but is **not an Android Gradle/Capacitor project**. There is no APK/AAB, Media3 device test, Room migration test or 2–3 GB media pack yet. The files are a vertical-slice integration starting point, not production evidence.

## Source files

- `ExamDatabase.kt` — Room entities, DAO and one `@Transaction` for idempotent event insertion + complete active-exam snapshot. Revison conflicts throw. A **single** native method performs the entire commit.
- `HospodarExamStorePlugin.kt` — Capacitor Kotlin plugin `HospodarExamStore`: `readAttempt`, `commitAttempt`, `deleteAttempt`.
- `HospodarMediaPlugin.kt` — **prototype only** `HospodarMedia` bridge: SHA-256 integrity check through `AssetManager`, seekable-uncompressed `openFd` gate, Media3 `asset:///...` audio/video source play/seek/stop. **No video PlayerView/surface integration yet**; cannot claim usable native video. Pack access remains **unverified on a Play-installed AAB**.

The corresponding executable, tested Web+JS protocol is `app/attempt-storage.mjs` (`app/attempt-storage.d.ts`) and `app/media-platform.mjs` (`app/media-platform.d.ts`). Its `commit` action is an **exam snapshot checkpoint**, distinct from future immutable per-question answer submission events.

## How to integrate once Capacitor/Android scaffold is generated

1. Generate `apps/web` with React/Vite and `apps/android` via Capacitor (pin and lock compatible versions). Preserve existing working `app/` until parity verified.
2. Place the files into `apps/android/android/app/src/main/java/fi/hospodar/yki/bridge/`. Register both plugins **before `super.onCreate()`** in the Capacitor `BridgeActivity` subclass.
3. In Gradle, add **androidx.room:room-runtime**, `room-ktx` and KSP `room-compiler`; add kotlinx-coroutines-android; `androidx.media3:media3-exoplayer` (and a `PlayerView` UI dependency for video). Configure Room schema export and migrations. No version is fixed until a real Android scaffold/compatibility audit and lockfile exist.
4. In frontend bridge registration, use `registerPlugin("HospodarExamStore")` and `registerPlugin("HospodarMedia")` with type definitions matching the JS contract.
5. Add Gradle install-time asset-pack modules `audio_fi`, `video_fi`, `game_world` with `com.android.asset-pack`, `deliveryType="install-time"`. Store *licensed/owned* binary assets under each pack's `src/main/assets/`, **outside Git** and referenced by SHA256 manifest.
6. Build a signed AAB; install through Play Internal Testing or `bundletool`. Verify real `AssetManager` paths, pre-play hashing performance, `openFd` compatibility, Media3 byte-range seek/rewind, microphone/lifecycle, device RAM, free disk requirements, Room schema migration. The native plugin is not considered complete until this passes.

## Priority tests (must pass before native feature is called ready)

- P0: two concurrent commits with one `expectedRevision`; only one succeeds, never partially persisted.
- P0: duplicate `eventId` with changed payload rejected; exact retry idempotent. Process kill while responding must not falsely complete/grade the item.
- P0: same command valid/invalid behavior across Web IndexedDB and Kotlin Room; JSON protocol is versioned.
- P0: Android 1GB+ synthetic test pack, `asset:///` playback and seek in airplane mode, no duplicate multi-GB cache; verify real AAB split-APK behavior.
- P0: unchanged user voice remains local unless explicit consent; no microphone recording flagged as saved if blob is only ephemeral.
- P1: Media3 native video needs `PlayerView`/surface lifecycle overlay compatible with the WebView before being called operational.
- P1: measure hashing delay and consider signed/hashed installation verifier, with secure invalidation on app update.
- P1: content rights gate rejects YouTube or external YKI samples without explicit redistribution authorization.

Official references: [Play install-time packs](https://developer.android.com/guide/playcore/asset-delivery/integrate-java), [Media3 asset protocol](https://developer.android.com/reference/androidx/media3/datasource/DefaultDataSource), [Capacitor plugin API](https://capacitorjs.com/docs/plugins/android), [Room](https://developer.android.com/training/data-storage/room).
