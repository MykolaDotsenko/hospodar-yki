/** Writing clinic items, read from their single physical owner (learning/exercises/b1/high-yield). */
import { validateClinicItem, type ClinicItem } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/high-yield/writing-repair-clinic.json";

const items = (data as unknown as { items: ClinicItem[] }).items;
if (!items.every(validateClinicItem)) throw new Error("writing-repair-clinic.json has an invalid item");
export const clinicItems = items;
