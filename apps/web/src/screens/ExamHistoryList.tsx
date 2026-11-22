/**
 * The finished-rehearsal history list, on its own so «Мій прогрес» can show it without loading the exam engine
 * (the exam screen is loaded only when opened).
 */
import { repeatedSkills, type ExamItem, type ExamSkill } from "@hospodar/domain";
import { examBlueprints } from "../content/exam.ts";
import type { ExamHistoryRecord } from "../storage/examRepository.ts";

export const SKILL_UK: Record<ExamItem["skill"], string> = { reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння" };

/** Attempt history (EXAM-09): objective counts per skill, ungraded counted separately; never a grade or pass prediction. */
export function ExamHistoryList({ history }: { history: ExamHistoryRecord[] | null }) {
  const repeats = history ? repeatedSkills(history) : new Map<string, ExamSkill[]>();
  return (
    <>
      {history === null ? <p className="muted">Завантаження…</p> : history.length === 0 ? <p className="muted">Ще немає завершених репетицій.</p> : (
        <ul className="skill-lines exam-history">
          {history.map(h => (
            <li key={h.sessionId}>
              <strong>{new Date(h.finishedAt).toLocaleDateString("uk-UA")}</strong> · {examBlueprints.find(b => b.id === h.blueprintId)?.title_uk ?? h.blueprintId}
              {h.skills ? ` · ${h.skills.map(k => SKILL_UK[k]).join(", ")}` : " · усі 4 навички"}
              {(repeats.get(h.sessionId) ?? []).length > 0 && <> · <em>повторення знайомого: {repeats.get(h.sessionId)!.map(k => SKILL_UK[k]).join(", ")}</em></>}<br />
              {(Object.keys(h.bySkill) as ExamSkill[]).filter(k => h.bySkill[k].objective || h.bySkill[k].ungraded).map(k =>
                `${SKILL_UK[k]}: ${h.bySkill[k].objective ? `${h.bySkill[k].correct}/${h.bySkill[k].objective} із ключем` : ""}${h.bySkill[k].ungraded ? `${h.bySkill[k].objective ? ", " : ""}${h.bySkill[k].ungraded} без оцінки` : ""}`).join(" · ") || "без відповідей"}
              <br /><small className="muted">Версія завдань: {h.contentVersion}. Не прогноз складання YKI.</small>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

