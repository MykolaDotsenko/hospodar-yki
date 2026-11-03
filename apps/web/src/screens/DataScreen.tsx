import { useEffect, useState } from "react";
import { buildDataExport, DELETE_PHRASE_UK, isDeleteConfirmed, serialiseDataExport, verifyDataExport, type DataExportCounts, type LearnerState } from "@hospodar/domain";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import type { ExamRepository } from "../storage/examRepository.ts";
import { examContentVersion } from "../content/exam.ts";

/**
 * "Мої дані" (LEARN-16, WEB-07): see what is stored on this device, download all of it as one verified JSON file,
 * and erase LEARN or EXAM data separately. Each erase is a deliberate act (typed phrase), runs in one transaction
 * with a revision check (another tab's newer data is never silently destroyed) and is verified by readback.
 * The legacy app's localStorage and the original V1 file are never touched here.
 */
type Snap = { state: LearnerState; revision: number };
type Scope = "learn" | "exam";
type Loaded = { counts: DataExportCounts; examRevision: number };

async function sha256Hex(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const codeOf = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function DataScreen({ repository, examRepository, snapshot, onErased, onHome }: {
  repository: LearnerRepository; examRepository: ExamRepository; snapshot: Snap; onErased: (s: Snap) => void; onHome: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | { error: string } | null>(null);
  const [exported, setExported] = useState<{ sha: string; bytes: number } | { error: string } | null>(null);
  const [scope, setScope] = useState<Scope | null>(null);
  const [typed, setTyped] = useState("");
  const [erase, setErase] = useState<"idle" | "working" | { done: Scope } | { error: string }>("idle");

  async function collect() {
    const [learn, imports, current, history] = await Promise.all([repository.read(), repository.listImports(), examRepository.read(), examRepository.history()]);
    return { learn, imports, current, history };
  }
  async function refresh() {
    try {
      const { learn, imports, current, history } = await collect();
      const d = buildDataExport({ learn: { ...learn, imports }, exam: { current, history }, exportedAt: new Date() });
      setLoaded({ counts: d.counts, examRevision: current?.revision ?? 0 });
    } catch (e) { setLoaded({ error: codeOf(e) }); }
  }
  useEffect(() => { void refresh(); }, [repository, examRepository, snapshot.revision]);

  async function download() {
    setExported(null);
    try {
      const { learn, imports, current, history } = await collect();
      const text = serialiseDataExport(buildDataExport({ learn: { ...learn, imports }, exam: { current, history }, exportedAt: new Date(), contentVersion: examContentVersion }));
      const check = verifyDataExport(text);
      if (!check.ok) { setExported({ error: check.reason }); return; }              // fail closed: no unverifiable file
      const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = `hospodar-yki-my-data-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExported({ sha: await sha256Hex(text), bytes: new TextEncoder().encode(text).byteLength });
    } catch (e) { setExported({ error: codeOf(e) }); }
  }

  async function runErase() {
    if (!scope || !isDeleteConfirmed(typed) || !loaded || "error" in loaded) return;
    setErase("working");
    try {
      if (scope === "learn") onErased(await repository.eraseAll(snapshot.revision));
      else await examRepository.eraseAll(loaded.examRevision);
      setErase({ done: scope }); setScope(null); setTyped("");
      await refresh();
    } catch (e) { setErase({ error: codeOf(e) }); }
  }

  const c = loaded && !("error" in loaded) ? loaded.counts : null;
  const learnCount = c ? c.attempts + c.diagnostics + c.retention + c.cards + c.imports : 0;
  const examCount = c ? c.examCurrent + c.examHistory : 0;
  return (
    <section className="panel" aria-labelledby="data-title">
      <p className="eyebrow">Приватність</p>
      <h1 id="data-title">Мої дані</h1>
      <p>Усе зберігається лише на цьому пристрої, у цьому браузері. Застосунок нічого не надсилає на сервер. Голос у навчанні не зберігається.</p>

      <h2>Що збережено</h2>
      {loaded === null ? <p className="muted">Читаю…</p> : "error" in loaded ? (
        <p className="feedback error" role="alert">Не вдалося прочитати дані ({loaded.error}). Нічого не змінено.</p>
      ) : (
        <ul className="skill-lines" aria-label="Збережені дані">
          <li><strong>Навчання</strong>: місій {c!.attempts}, відповідей з діагностики й вправ {c!.diagnostics}, відкладених перевірок {c!.retention}, карток повторення {c!.cards}, записів про перенесення з попередньої версії {c!.imports}</li>
          <li><strong>Пробні іспити</strong> (окремо від навчання): незавершена репетиція {c!.examCurrent ? "є" : "немає"}, завершених репетицій {c!.examHistory}</li>
        </ul>
      )}

      <h2>Завантажити копію</h2>
      <p>Один JSON-файл з усім, що вище: твої відповіді й тексти, повторення, історія пробних іспитів. Без оцінок рівня й без прогнозу YKI. Перед завантаженням файл перечитується й перевіряється.</p>
      <div className="actions"><button type="button" className="btn" onClick={() => void download()} disabled={!c}>Завантажити мої дані (JSON)</button></div>
      {exported && ("error" in exported
        ? <p className="feedback error" role="alert">Файл НЕ створено ({exported.error}). Дані не змінено — спробуй ще раз.</p>
        : <p className="feedback" role="status">Файл перевірено й завантажено ({exported.bytes} байт). Контрольна сума SHA-256: <code className="hash">{exported.sha}</code></p>)}
      <p className="muted">Файл може містити твої власні тексти. Зберігай його приватно.</p>

      <h2>Видалити</h2>
      <p>Навчання й пробні іспити видаляються окремо. Видалення остаточне: копії на пристрої не лишається. Спершу краще завантажити файл вище.</p>
      <fieldset className="choices-set">
        <legend>Що видалити</legend>
        <label className="radio"><input type="radio" name="erase" checked={scope === "learn"} disabled={!c || learnCount === 0}
          onChange={() => { setScope("learn"); setErase("idle"); }} /> Увесь прогрес навчання{c && learnCount === 0 ? " (порожньо)" : ""}</label>
        <label className="radio"><input type="radio" name="erase" checked={scope === "exam"} disabled={!c || examCount === 0}
          onChange={() => { setScope("exam"); setErase("idle"); }} /> Усі пробні іспити й їхню історію{c && examCount === 0 ? " (порожньо)" : ""}</label>
      </fieldset>
      {scope && (
        <>
          <label className="field" htmlFor="erase-confirm">Щоб підтвердити, введи слово {DELETE_PHRASE_UK}</label>
          <input id="erase-confirm" className="answer" autoComplete="off" value={typed} onChange={e => setTyped(e.target.value)} />
          <div className="actions">
            <button type="button" className="btn danger" disabled={!isDeleteConfirmed(typed) || erase === "working"} onClick={() => void runErase()}>
              {erase === "working" ? "Видаляю…" : scope === "learn" ? "Видалити прогрес навчання" : "Видалити пробні іспити"}</button>
            <button type="button" className="btn secondary" onClick={() => { setScope(null); setTyped(""); }}>Скасувати</button>
          </div>
        </>
      )}
      {typeof erase === "object" && ("error" in erase
        ? <p className="feedback error" role="alert">НЕ видалено ({erase.error === "REVISION_CONFLICT" ? "дані змінилися в іншій вкладці — онови сторінку й спробуй ще раз" : erase.error}). Дані лишилися як були.</p>
        : <p className="feedback" role="status">{erase.done === "learn" ? "Прогрес навчання видалено й перевірено: сховище порожнє." : "Пробні іспити видалено й перевірено: сховище порожнє."}</p>)}
      <p className="muted">Попередня версія застосунку (папка app/) зберігає свій прогрес окремо; тут він не змінюється й не видаляється.</p>
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
