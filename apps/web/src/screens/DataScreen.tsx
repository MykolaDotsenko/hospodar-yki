import { useEffect, useRef, useState } from "react";
import { buildDataExport, DELETE_PHRASE_UK, isDeleteConfirmed, serialiseDataExport, verifyDataExport, type DataExportCounts, type LearnerState, inspectWebLearnBackup, type WebLearnRestoreCheck, MAX_WEB_BACKUP_CHARS } from "@hospodar/domain";
import type { LearnerRepository } from "../storage/learnerRepository.ts";
import type { ExamRepository } from "../storage/examRepository.ts";
import type { VoiceStore } from "../storage/voiceStore.ts";
import { examContentVersion } from "../content/exam.ts";

/**
 * "Мої дані" (LEARN-16, WEB-07): see what is stored on this device, download all of it as one verified JSON file,
 * and erase LEARN or EXAM data separately. Each erase is a deliberate act (typed phrase), runs in one transaction
 * with a revision check (another tab's newer data is never silently destroyed) and is verified by readback.
 * The legacy app's localStorage and the original V1 file are never touched here.
 */
type Snap = { state: LearnerState; revision: number };
type Scope = "learn" | "exam";
type Loaded = { counts: DataExportCounts; examRevision: number; voiceClips: number; draftPresent: boolean; draftRevision: number; clinicDraftPresent: boolean; clinicDraftRevision: number; readingDraftPresent: boolean; readingDraftRevision: number; listeningDraftPresent: boolean; listeningDraftRevision: number; dialogueDraftPresent: boolean; dialogueDraftRevision: number; pictureDraftPresent: boolean; pictureDraftRevision: number; diagnosticDraftPresent: boolean; diagnosticDraftRevision: number };

async function sha256Hex(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const codeOf = (e: unknown) => String((e as { code?: string })?.code ?? "SAVE_FAILED");

export function DataScreen({ repository, examRepository, voiceStore, snapshot, onErased, onHome }: {
  repository: LearnerRepository; examRepository: ExamRepository; voiceStore: VoiceStore; snapshot: Snap; onErased: (s: Snap) => void; onHome: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | { error: string } | null>(null);
  const [exported, setExported] = useState<{ sha: string; bytes: number } | { error: string } | null>(null);
  const [scope, setScope] = useState<Scope | null>(null);
  const [typed, setTyped] = useState("");
  const [erase, setErase] = useState<"idle" | "working" | { done: Scope } | { error: string }>("idle");
  const [restoreCheck, setRestoreCheck] = useState<WebLearnRestoreCheck | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "working" | "done" | { error: string }>("idle");
  const restoreChoice = useRef(0);

  async function collect() {
    const [learn, imports, current, history, missionDraft, clinicDraft, readingDraft, listeningDraft, dialogueDraft, pictureDraft, diagnosticDraft] = await Promise.all([repository.read(), repository.listImports(), examRepository.read(), examRepository.history(), repository.readMissionDraft(), repository.readClinicDraft(), repository.readReadingDraft(), repository.readListeningDraft(), repository.readDialogueDraft(), repository.readPictureDraft(), repository.readDiagnosticDraft()]);
    return { learn, imports, current, history, missionDraft, clinicDraft, readingDraft, listeningDraft, dialogueDraft, pictureDraft, diagnosticDraft };
  }
  async function refresh() {
    try {
      const { learn, imports, current, history, missionDraft, clinicDraft, readingDraft, listeningDraft, dialogueDraft, pictureDraft, diagnosticDraft } = await collect();
      const d = buildDataExport({ learn: { ...learn, imports }, exam: { current, history }, exportedAt: new Date() });
      setLoaded({ counts: d.counts, examRevision: current?.revision ?? 0, voiceClips: await voiceStore.count().catch(() => 0), draftPresent: Boolean(missionDraft), draftRevision: missionDraft?.revision ?? 0, clinicDraftPresent: Boolean(clinicDraft), clinicDraftRevision: clinicDraft?.revision ?? 0, readingDraftPresent: Boolean(readingDraft), readingDraftRevision: readingDraft?.revision ?? 0, listeningDraftPresent: Boolean(listeningDraft), listeningDraftRevision: listeningDraft?.revision ?? 0, dialogueDraftPresent: Boolean(dialogueDraft), dialogueDraftRevision: dialogueDraft?.revision ?? 0, pictureDraftPresent: Boolean(pictureDraft), pictureDraftRevision: pictureDraft?.revision ?? 0, diagnosticDraftPresent: Boolean(diagnosticDraft), diagnosticDraftRevision: diagnosticDraft?.revision ?? 0 });
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
      if (scope === "learn") onErased(await repository.eraseAll(snapshot.revision, loaded.draftRevision, loaded.clinicDraftRevision, loaded.readingDraftRevision, loaded.listeningDraftRevision, loaded.dialogueDraftRevision, loaded.pictureDraftRevision, loaded.diagnosticDraftRevision));
      else { await voiceStore.eraseAll(); await examRepository.eraseAll(loaded.examRevision); }   // audio first: never orphan a recording
      setErase({ done: scope }); setScope(null); setTyped("");
      await refresh();
    } catch (e) { setErase({ error: codeOf(e) }); }
  }

  async function chooseBackup(file: File | undefined) {
    const choice = ++restoreChoice.current;
    setRestoreCheck(null); setRestoreConfirmed(false); setRestoreStatus("idle");
    if (!file) return;
    // Limit file size BEFORE reading it into memory; pure inspection independently limits characters.
    if (file.size > MAX_WEB_BACKUP_CHARS) {
      setRestoreCheck({ ok: false, reason: "TOO_LARGE" }); return;
    }
    try {
      const text = await file.text();
      if (choice === restoreChoice.current) setRestoreCheck(inspectWebLearnBackup(text));
    } catch {
      if (choice === restoreChoice.current) setRestoreStatus({ error: "READ_FAILED" });
    }
  }

  async function restoreLearn() {
    if (!restoreCheck?.ok || !restoreConfirmed || !loaded || "error" in loaded) return;
    setRestoreStatus("working");
    try {
      const next = await repository.restoreWebLearn(restoreCheck.state, restoreCheck.imports, snapshot.revision);
      onErased(next);                            // update the same root LEARN snapshot
      setRestoreConfirmed(false);
      setRestoreStatus("done");
      await refresh();
    } catch (e) { setRestoreStatus({ error: codeOf(e) }); }
  }

  const c = loaded && !("error" in loaded) ? loaded.counts : null;
  const draftPresent = loaded && !("error" in loaded) ? loaded.draftPresent : false;
  const learnCount = c ? c.attempts + c.diagnostics + c.retention + c.cards + c.imports + (draftPresent ? 1 : 0) + (loaded && !("error" in loaded) && loaded.clinicDraftPresent ? 1 : 0) + (loaded && !("error" in loaded) && loaded.readingDraftPresent ? 1 : 0) + (loaded && !("error" in loaded) && loaded.listeningDraftPresent ? 1 : 0) + (loaded && !("error" in loaded) && loaded.dialogueDraftPresent ? 1 : 0) + (loaded && !("error" in loaded) && loaded.pictureDraftPresent ? 1 : 0) + (loaded && !("error" in loaded) && loaded.diagnosticDraftPresent ? 1 : 0) : 0;
  const voiceClips = loaded && !("error" in loaded) ? loaded.voiceClips : 0;
  const examCount = c ? c.examCurrent + c.examHistory + voiceClips : 0;
  // Restore is deliberately LEARN-only. No cross-DB partial restore of exam or unavailable voice bytes.
  const restoreBlocked = !c || learnCount > 0 || snapshot.revision > 0;
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
          <li><strong>Навчання</strong>: місій {c!.attempts}, відповідей з діагностики й вправ {c!.diagnostics}, відкладених перевірок {c!.retention}, карток повторення {c!.cards}, незавершених місій {draftPresent ? 1 : 0}, незавершених майстерень письма {loaded.clinicDraftPresent ? 1 : 0}, незавершених вправ читання {loaded.readingDraftPresent ? 1 : 0}, незавершених вправ аудіювання {loaded.listeningDraftPresent ? 1 : 0}, незавершених діалогів {loaded.dialogueDraftPresent ? 1 : 0}, незавершених фото-місій {loaded.pictureDraftPresent ? 1 : 0}, незавершених діагностик {loaded.diagnosticDraftPresent ? 1 : 0}, записів про перенесення з попередньої версії {c!.imports}</li>
          <li><strong>Пробні іспити</strong> (окремо від навчання): незавершена репетиція {c!.examCurrent ? "є" : "немає"}, завершених репетицій {c!.examHistory}, голосових записів {voiceClips}</li>
        </ul>
      )}

      <h2>Завантажити копію</h2>
      <p>Один JSON-файл із завершеними відповідями й текстами, повтореннями та історією пробних іспитів (без незавершених чернеток). Без оцінок рівня й без прогнозу YKI. Перед завантаженням файл перечитується й перевіряється.</p>
      <p className="muted">Голосові записи (аудіо) у файл не входять, лише їхні квитанції (розмір, тривалість, контрольна сума). Також не експортуються незавершені чернетки місій LEARN, майстерні письма, вправ читання, аудіювання, діалогів, фото-місій та діагностик. Заверши їх перед перенесенням браузера або пристрою. Прослухати аудіо можна в результатах репетиції.</p>
      <div className="actions"><button type="button" className="btn" onClick={() => void download()}>Завантажити мої дані (JSON)</button></div>
      {exported && ("error" in exported
        ? <p className="feedback error" role="alert">Файл НЕ створено ({exported.error}). Дані не змінено — спробуй ще раз.</p>
        : <p className="feedback" role="status">Файл перевірено й завантажено ({exported.bytes} байт). Контрольна сума SHA-256: <code className="hash">{exported.sha}</code></p>)}
      <p className="muted">Файл може містити твої власні тексти. Зберігай його приватно.</p>

      <h2>Відновити прогрес навчання з копії</h2>
      <p>Оберіть JSON-файл, створений кнопкою «Завантажити мої дані» в новій Web-версії Hospodar. Відновлюємо <strong>лише навчання</strong> — завдання, перші відповіді, повторення, діагностику і старі квитанції імпорту. <strong>Пробні іспити та голосові записи з файлу не відновлюються</strong>, і дані EXAM, уже збережені тут, не змінюються.</p>
      <p className="muted">Це не перевірка авторства файлу: JSON не має цифрового підпису. Дані перевіряються локально, без завантаження на сервер. Об'єднання двох профілів недоступне.</p>
      <label className="field" htmlFor="web-restore-file">Резервна копія нової Web-версії (.json, не більш як 8 MB)</label>
      <input id="web-restore-file" type="file" accept=".json,application/json" disabled={restoreStatus === "working"}
        onChange={e => void chooseBackup(e.target.files?.[0])} />
      {restoreCheck && (restoreCheck.ok ? (
        <div className="feedback" role="status">
          <p>Копію прочитано без втрати записів: місій {restoreCheck.counts.attempts}, діагностик {restoreCheck.counts.diagnostics}, повторень {restoreCheck.counts.retention}, карток {restoreCheck.counts.cards}, квитанцій {restoreCheck.counts.imports}.</p>
          {restoreCheck.hasExamData && <p>У копії також є EXAM-дані — вони не будуть імпортовані.</p>}
        </div>
      ) : <p className="feedback error" role="alert">Копія непридатна для відновлення ({restoreCheck.reason}). Жодні дані не змінено.</p>)}
      {restoreCheck?.ok && restoreBlocked && <p className="feedback warn" role="status">Для відновлення потрібен порожній профіль LEARN. Спершу збережи резервну копію поточного прогресу; існуючі дані автоматично не замінюються.</p>}
      {restoreCheck?.ok && !restoreBlocked && restoreStatus !== "done" && (
        <>
          <label className="radio"><input type="checkbox" checked={restoreConfirmed} onChange={e => setRestoreConfirmed(e.target.checked)} />
            <span>Підтверджую відновлення тільки LEARN у порожній профіль; EXAM і аудіо не переносяться</span></label>
          <div className="actions"><button type="button" className="btn" disabled={!restoreConfirmed || restoreStatus === "working"} onClick={() => void restoreLearn()}>
            {restoreStatus === "working" ? "Відновлюю…" : "Відновити навчання"}</button></div>
        </>
      )}
      {restoreStatus === "done" && <p className="feedback" role="status">✅ Навчання відновлено та перечитано зі сховища. Перевір свій прогрес після перезавантаження.</p>}
      {typeof restoreStatus === "object" && <p className="feedback error" role="alert">
        {restoreStatus.error === "REVISION_CONFLICT" ? "Відновлення заблоковано: прогрес змінився в іншій вкладці. Онови сторінку."
          : restoreStatus.error === "DESTINATION_NOT_EMPTY" ? "Відновлення заблоковано: профіль уже містить дані. Нічого не перезаписано."
          : restoreStatus.error === "READBACK_MISMATCH" ? "Не вдалося підтвердити запис. Перевір поточний прогрес перед новою спробою."
          : `Відновлення не підтверджено (${restoreStatus.error}). Перевір дані перед новою спробою.`}</p>}

      <h2>Видалити</h2>
      <p>Навчання й пробні іспити видаляються окремо. Видалення LEARN охоплює всі незавершені місії, письмо, читання, аудіювання, діалоги, фото-місії й діагностики. Видалення остаточне: копії на пристрої не лишається. Спершу краще завершити чернетку та завантажити копію.</p>
      <fieldset className="choices-set">
        <legend>Що видалити</legend>
        <label className="radio"><input type="radio" name="erase" checked={scope === "learn"} disabled={!c || (learnCount === 0 && snapshot.revision === 0)}
          onChange={() => { setScope("learn"); setErase("idle"); }} /> Увесь прогрес навчання{c && learnCount === 0 ? " (порожньо)" : ""}</label>
        <label className="radio"><input type="radio" name="erase" checked={scope === "exam"} disabled={!c || examCount === 0}
          onChange={() => { setScope("exam"); setErase("idle"); }} /> Усі пробні іспити, їхню історію й голосові записи{c && examCount === 0 ? " (порожньо)" : ""}</label>
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
