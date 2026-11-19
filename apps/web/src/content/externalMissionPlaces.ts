/**
 * Which life place of «Моє господарство» each external-source mission belongs to (docs/29 code queue 10: «місії в
 * місцях»). An editorial classification by the mission's situation, written here rather than in the sources/ catalogs
 * so the catalogs' review hashes stay unchanged. `null` = a general mission that belongs to no single place (it stays
 * in the missions list only). Every mission the app loads must be listed (externalMissionPlaces.test.ts).
 */
import type { PlaceId } from "@hospodar/domain";

export const EXTERNAL_MISSION_PLACE: Readonly<Record<string, PlaceId | null>> = Object.freeze({
  "oph-everyday-course-booking": "society",
  "oph-everyday-health-center": "health",
  "oph-bus-route-guide": "travel",
  "oph-bus-ask-driver": "travel",
  "oph-neighbor-first-meeting": "housing",
  "oph-neighbor-repair-water": "housing",
  "oph-messages-phone-plan": "services",
  "oph-messages-write-contact": "services",
  "oph-shopping-payments": "services",
  "oph-shopping-delivery": "services",
  "oph-health-sleep": "health",
  "oph-health-doctor": "health",
  "helppoa-listen-main": null,                         // any everyday recording: no single place
  "helppoa-simple-question": null,
  "vierko2-interaction-fix": null,
  "vierko2-write-email": "society",
  "health-need-verbs": "health",
  "health-transitivity": "health",
  "civic-service-question": "society",
  "civic-consumer-return": "services",
  "kielibuusti-public-transport-2024": "travel",
  "kielibuusti-dentist-dialogues-2023": "health",
  "kielibuusti-hotel-reception-2026": "travel",
  "kielibuusti-puhutsa-2026": null,                    // spoken Finnish in general
  "kielibuusti-fiilis-2025": null,
  "kielibuusti-care-dialogues-2026": "work",
  "kielibuusti-literature-podcast-2026": "culture",
});
