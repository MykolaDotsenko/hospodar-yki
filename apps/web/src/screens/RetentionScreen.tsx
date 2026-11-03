import { useState, type FormEvent } from "react";
import { delayedTransferQueue, recordDelayedTransfer, type LearnerState } from "@hospodar/domain";
import { transferBank } from "../content/transfer.ts";
import type { LearnerRepository } from "../storage/learnerRepository.ts";

/** IV-REQ-03 / LE-10: a NEW situation on day 7/14/30 after the first mission, no hints, ungraded. */
export function RetentionScreen({ repository, snapshot, onSaved, onHome }: {
  repository: LearnerRepository; snapshot: { state: LearnerState; revision: number };
  onSaved: (s: { state: LearnerState; revision: number }) => void; onHome: () => void;
}) {
  const queue = delayedTransferQueue(snapshot.state, transferBank);
  const due = queue.map(q => q.due).find(Boolean) ?? null;
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");
  const next = queue.filter(q => q.nextDay !== null).map(q => ({ tag: q.grammarTag, days: q.nextDay! - q.ageDays })).sort((a, b) => a.days - b.days)[0];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!due || !text.trim()) { setStatus({ error: "Спершу напиши відповідь." }); return; }
    setStatus("saving");
    try {
      const nextState = recordDelayedTransfer(snapshot.state, transferBank, { taskId: due.taskId, day: due.day, response: text });
      onSaved(await repository.commit(nextState, snapshot.revision));
      setStatus("saved"); setText("");
    } catch (err) {
      setStatus({ error: `НЕ збережено (${String((err as { code?: string })?.code ?? "SAVE_FAILED")}). Спробуй ще раз.` });
    }
  }
  return (
    <section className="panel" aria-labelledby="ret-title">
      <p className="eyebrow">Навчання · відкладена перевірка</p>
      <h1 id="ret-title">Через 7 / 14 / 30 днів</h1>
      <p>Нова ситуація без підказки на ту саму тему, що й твоя місія. Відповідь зберігається, але <strong>автоматично не оцінюється</strong>.</p>
      {status === "saved" && <p className="feedback" role="status">✅ Відповідь збережено на цьому пристрої (без оцінки).</p>}
      {due && status !== "saved" ? (
        <form onSubmit={submit} noValidate>
          <p className="muted">День {due.day} · тема: {due.grammarTag}</p>
          <p className="prompt" lang="fi">{due.prompt_fi}</p>
          <label className="field" htmlFor="ret-input">Твоя відповідь фінською (без зразка)</label>
          <textarea id="ret-input" className="answer" lang="fi" rows={3} maxLength={1600} value={text} onChange={e => setText(e.target.value)} />
          {typeof status === "object" && <p className="feedback error" role="alert">{status.error}</p>}
          <div className="actions"><button type="submit" className="btn">{status === "saving" ? "Зберігаю…" : "Зберегти відповідь"}</button></div>
        </form>
      ) : status !== "saved" && (
        <p role="status">{next ? `Наступна перевірка: через ${next.days} дн. (${next.tag}).` : "Відкладені перевірки з'являться через 7 днів після першої місії на цю тему."}</p>
      )}
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
