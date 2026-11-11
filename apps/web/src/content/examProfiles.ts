/** EXAM profiles as data (TZ-EXAM-02…04), read from their single owner in learning/exercises/b1/exam-patterns. */
import { examProfileHash, validateExamProfileFile, type ExamProfile, type ExamProfileFile } from "@hospodar/domain";
import data from "../../../../learning/exercises/b1/exam-patterns/exam-profiles-v1.json";

export const examProfileFile = data as unknown as ExamProfileFile;
const errors = validateExamProfileFile(examProfileFile);
if (errors.length) throw new Error(`exam-profiles-v1.json is invalid: ${errors.join(", ")}`);
export const examProfiles: ExamProfile[] = examProfileFile.profiles;
export const profileById = (id: string | undefined) => examProfiles.find(p => p.id === id) ?? null;
export const pinOf = (p: ExamProfile) => ({ id: p.id, hash: examProfileHash(p) });
