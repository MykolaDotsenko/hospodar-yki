import type { TransferBank } from "@hospodar/domain";
import bank from "../../../../learning/exercises/b1/grammar/delayed-transfer-v1.json";
import { learnerPool } from "./release.ts";

const raw = bank as unknown as TransferBank;
/** Release builds keep only S2-published delayed tasks. */
export const transferBank: TransferBank = { ...raw, items: learnerPool(raw.items) };
