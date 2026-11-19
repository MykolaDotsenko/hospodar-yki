import { useState } from "react";
import { raterPackage, raterPackageHtml, voiceEvidenceOf, type ExamItem } from "@hospodar/domain";
import { examBlueprints } from "../content/exam.ts";

type Session = Parameters<typeof voiceEvidenceOf>[0] & { answers: Record<string, string>; blueprintId: string };

/**
 * TZ-EXAM-16: after a finished rehearsal the learner may download their writing and typed speaking answers as a package
 * for a human S2 rater — prompts, answers, OPH criterion names with sources and an empty rating form. The app never rates.
 * Voice recordings stay on the device. Shown only when there is something to rate.
 */
export function RaterPackageButton({ items, session }: { items: ExamItem[]; session: Session }) {
  const [error, setError] = useState<string | null>(null);
  const voiceIds = new Set(items.filter(i => voiceEvidenceOf(session, i.id)).map(i => i.id));
  let ready = true;
  try { raterPackage(items, session.answers, voiceIds, "", "2000-01-01"); } catch { ready = false; }
  if (!ready) return null;
  function download() {
    try {
      const title = examBlueprints.find(b => b.id === session.blueprintId)?.title_uk ?? session.blueprintId;
      const html = raterPackageHtml(raterPackage(items, session.answers, voiceIds, title, new Date().toISOString().slice(0, 10)));
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = `hospodar-yki-rater-package-${new Date().toISOString().slice(0, 10)}.html`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError(null);
    } catch { setError("Не вдалося створити файл."); }
  }
  return (
    <div className="rater-package" data-testid="rater-package">
      <h2>Для викладача S2</h2>
      <p>Письмо й говоріння застосунок не оцінює. Можеш завантажити свої відповіді з завданнями й критеріями OPH і віддати викладачеві: оцінку ставить лише людина.
        Файл створюється на цьому пристрої й нікуди не надсилається; записи голосу в нього не входять.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={download}>Завантажити пакет для викладача</button></div>
      {error && <p className="feedback error" role="alert">{error}</p>}
    </div>
  );
}
