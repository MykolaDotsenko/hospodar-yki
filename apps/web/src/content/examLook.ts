/** «Як виглядає іспит» (CURATED-09): OPH pages, organizer examples and practice videos — link-only, on the set-up screen. */
import { examLookLinks, type ExamLookCatalog } from "@hospodar/domain";
import catalog from "../../../../sources/official/yki-mock-simulation-sources.json";

export const { links: examLook, refused: examLookRefused } = examLookLinks(catalog as unknown as ExamLookCatalog);
