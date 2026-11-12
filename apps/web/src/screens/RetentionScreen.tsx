import { useRef, useState, type FormEvent } from "react";
import { completedTransferReflection, delayedTransferQueue, recordDelayedTransfer,
  type DelayedTransferReflection, type LearnerState } from "@hospodar/domain";
import { transferBank } from "../content/transfer.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import { SkillChecks } from "./SkillChecks.tsx";
import { Eyebrow } from "../ui/MissionChrome.tsx";
import { Icon } from "../ui/icons.tsx";

/**
 * LE-10 / IV-REQ-03: independent 7/14/30-day retrieval, then optional
 * comparison of the learner's OWN productions — only after verified local save.
 * A comparison is not an answer key, language correction or YKI grade.
 */
export function RetentionScreen({ repository, snapshot, onSaved, onHome }: {
  repository: LearnerRepository; snapshot: { state: LearnerState; revision: number };
  onSaved: (s: { state: LearnerState; revision: number }) => void; onHome: () => void;
}) {
  const queue = delayedTransferQueue(snapshot.state, transferBank);
  const due = queue.map(q => q.due).find(Boolean) ?? null;
  const dueCount = queue.filter(q => q.due).length;
  const next = queue.filter(q => q.nextDay !== null)
    .map(q => ({ tag: q.grammarTag, days: q.nextDay! - q.ageDays }))
    .sort((a, b) => a.days - b.days)[0];

  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");
  const [reflection, setReflection] = useState<DelayedTransferReflection | null>(null);
  const submitting = useRef(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current || status === "saved") return;
    if (!due || !text.trim()) { setStatus({ error: "Спершу напиши відповідь." }); return; }
    const response = text.trim(), taskId = due.taskId, day = due.day;
    submitting.current = true;
    setStatus("saving");
    try {
      const nextState = recordDelayedTransfer(snapshot.state, transferBank, { taskId, day, response });
      const committed = await repository.commit(nextState, snapshot.revision);
      // A transaction promise is necessary, but fresh readback is required before
      // revealing a prior answer or claiming that this independent attempt is saved.
      const verified = await repository.read();
      if (verified.revision !== committed.revision ||
          JSON.stringify(verified.state) !== JSON.stringify(nextState))
        throw Object.assign(new Error("Stored progress differs from the committed attempt"), { code: "READBACK_MISMATCH" });
      const comparison = completedTransferReflection(verified.state, taskId, day);
      if (!comparison || comparison.delayedResponse !== response)
        throw Object.assign(new Error("Independent delayed response not found in readback"), { code: "READBACK_MISMATCH" });
      onSaved(verified);
      setReflection(comparison);
      setText("");
      setStatus("saved");
    } catch (err) {
      const code = String((err as { code?: string })?.code ?? "SAVE_FAILED");
      setStatus({ error: ["READBACK_MISMATCH", "READ_FAILED", "REVISION_CONFLICT"].includes(code)
        ? `Не вдалося підтвердити збереження (${code}). Звір прогрес після оновлення сторінки; не надсилай відповідь повторно без перевірки.`
        : `НЕ збережено (${code}). Твоя відповідь залишилася в полі. Спробуй ще раз.` });
    } finally { submitting.current = false; }
  }
  function continueReview() {
    setReflection(null);
    setText("");
    setStatus("idle");
  }
  return (
    <section className="panel" data-accent="grammar" aria-labelledby="ret-title">
      <Eyebrow accent="grammar">Навчання · відкладена перевірка</Eyebrow>
      <h1 id="ret-title">Через 7 / 14 / 30 днів</h1>
      <h2>Граматика в новій ситуації</h2>
      <p>Нова ситуація без підказки на ту саму тему, що й твоя місія. Відповідь зберігається, але <strong>автоматично не оцінюється</strong>.</p>
      <p className="muted">Навчальні завдання — чернетки, ще не схвалені викладачем фінської як другої мови (S2). Це не іспит YKI.</p>

      {status === "saved" && (
        <>
          <p className="feedback" role="status"><Icon name="ok" /> Відповідь збережено на цьому пристрої (без оцінки).</p>
          {reflection && (
            <section className="feedback" aria-label="Порівняння власних відповідей">
              <h2>Порівняй власні речення</h2>
              <p>Твоя відповідь у першій місії:</p>
              <blockquote lang="fi">{reflection.earlierResponse}</blockquote>
              <p>Твоя самостійна відповідь після {reflection.day} днів:</p>
              <blockquote lang="fi">{reflection.delayedResponse}</blockquote>
              <p>Чи відповідає новий текст новій ситуації? Чи вдалося точніше передати зміст? Це запитання для саморефлексії, <strong>не автоматична оцінка правильності</strong>. За потреби попроси S2-викладача перевірити обидва тексти.</p>
            </section>
          )}
          {dueCount > 0 && (
            <div className="actions">
              <button type="button" className="btn" onClick={continueReview}>
                Наступне повторення ({dueCount})
              </button>
            </div>
          )}
        </>
      )}

      {due && status !== "saved" ? (
        <form onSubmit={e => void submit(e)} noValidate>
          <p className="muted">День {due.day} · тема: {due.grammarTag}</p>
          <p className="prompt" lang="fi">{due.prompt_fi}</p>
          <label className="field" htmlFor="ret-input">Твоя відповідь фінською (без зразка)</label>
          <textarea id="ret-input" className="answer" lang="fi" rows={3} maxLength={1600}
            value={text} disabled={status === "saving"}
            onChange={e => setText(e.target.value)} />
          {typeof status === "object" && <p className="feedback error" role="alert">{status.error}</p>}
          <div className="actions">
            <button type="submit" className="btn" disabled={status === "saving" || !text.trim()}>
              {status === "saving" ? "Зберігаю…" : "Зберегти відповідь"}
            </button>
          </div>
        </form>
      ) : status !== "saved" && (
        <p role="status">{next ? `Наступна перевірка: через ${next.days} дн. (${next.tag}).` : "Відкладені перевірки з'являться через 7 днів після першої місії на цю тему."}</p>
      )}

      <SkillChecks repository={repository} snapshot={snapshot} onSaved={onSaved} />

      <div className="actions">
        <button type="button" className="btn secondary" disabled={status === "saving"} onClick={onHome}>На головну</button>
      </div>
    </section>
  );
}
