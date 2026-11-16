/**
 * Missions with an external source (CURATED-09): the saved mission catalogs in sources/. Original task drafts around a
 * publisher's recording or text (OPH, Kielibuusti, aoe.fi), link only. S2-pending: a release build keeps only published ones.
 */
import { toExternalMission, type ExternalMission, type ExternalSourceItem } from "@hospodar/domain";
import oph from "../../../../sources/audio/oph-adult-spoken-finnish-2026-10.json";
import verified from "../../../../sources/learning/a2-b1-verified-source-missions-2026-10.json";
import dialogues from "../../../../sources/audio/authentic-dialogues-2026-10.json";
import { learnerPool } from "./release.ts";

const rows = (x: unknown) => learnerPool((x as { items: ExternalSourceItem[] }).items);
export const externalMissionGroups: { id: string; title_uk: string; missions: ExternalMission[] }[] = [
  { id: "oph-paivaa", title_uk: "OPH: розмовна фінська для дорослих (Päivää!)", missions: rows(oph).map(toExternalMission).filter((m): m is ExternalMission => !!m) },
  { id: "verified", title_uk: "OPH Helppoa suomea, VIERKO та інші відкриті джерела", missions: rows(verified).map(toExternalMission).filter((m): m is ExternalMission => !!m) },
  { id: "dialogues", title_uk: "Діалоги видавця Kielibuusti", missions: rows(dialogues).map(toExternalMission).filter((m): m is ExternalMission => !!m) },
];
export const externalMissions = externalMissionGroups.flatMap(g => g.missions);
