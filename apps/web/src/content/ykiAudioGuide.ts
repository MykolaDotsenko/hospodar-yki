/** Audio guide for YKI listening preparation (CURATED-09): external publisher pages, link-only, on the set-up screen. */
import { ykiAudioGuide, type YkiAudioCandidate } from "@hospodar/domain";
import catalog from "../../../../sources/audio/yki-targeted-sources-2026-10.json";

export const { links: audioGuide, refused: audioGuideRefused } = ykiAudioGuide((catalog as unknown as { external_candidates: YkiAudioCandidate[] }).external_candidates);
