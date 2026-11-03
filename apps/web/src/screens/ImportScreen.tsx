import { useState } from "react";
import { inspectLegacyProgress, LEGACY_REASON_UK, STORAGE_KEY, type LearnerState, type LegacyInspection } from "@hospodar/domain";
import type { ImportReceipt, LearnerRepository } from "../storage/learnerRepository.ts";

/**
 * G2-b: explicit, consented import of legacy LEARN V1 progress (R11 rules).
 * Reads a backup file or the old app's localStorage on THIS device (read-only), shows counts,
 * requires downloading the exact original bytes first, commits atomically with a receipt,
 * verifies by readback. The old app's data is never modified or deleted.
 */
type Source = { kind: "legacy_v1_file" | "legacy_v1_this_device"; raw: string; label: string };

async function sha256Hex(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function readOldDevice(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
const MAX_FILE = 8_000_000;

export function ImportScreen({ repository, current, onImported, onHome }: {
  repository: LearnerRepository;
  current: { state: LearnerState; revision: number };
  onImported: (s: { state: LearnerState; revision: number }) => void;
  onHome: () => void;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [check, setCheck] = useState<LegacyInspection | null>(null);
  const [backedUp, setBackedUp] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "working" } | { kind: "done"; receipt: ImportReceipt } | { kind: "error"; message: string }>({ kind: "idle" });
  const hasProgress = current.state.attempts.length > 0 || current.state.diagnostics.length > 0 || Object.keys(current.state.cards).length > 0;
  const oldOnDevice = readOldDevice();

  function choose(s: Source) { setSource(s); setCheck(inspectLegacyProgress(s.raw)); setBackedUp(false); setStatus({ kind: "idle" }); }
  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE) { setCheck({ status: "blocked", reason: "NOT_STRING_OR_TOO_LARGE", counts: null }); setSource(null); return; }
    choose({ kind: "legacy_v1_file", raw: await file.text(), label: file.name });
  }
  function downloadOriginal() {
    if (!source) return;
    const url = URL.createObjectURL(new Blob([source.raw], { type: "application/json;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `hospodar-yki-v1-original-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function runImport() {
    if (!source || check?.status !== "ready" || !check.state || !check.counts || !backedUp) return;
    setStatus({ kind: "working" });
    try {
      const sha = await sha256Hex(source.raw);
      const { snapshot, receipt } = await repository.importLegacy(check.state, {
        id: "import-" + sha.slice(0, 16), source: source.kind, originalSha256: sha,
        originalBytes: new TextEncoder().encode(source.raw).byteLength, counts: check.counts,
      });
      onImported(snapshot);
      setStatus({ kind: "done", receipt });
    } catch (e) {
      const code = String((e as { code?: string })?.code ?? "SAVE_FAILED");
      setStatus({ kind: "error", message: code === "DESTINATION_NOT_EMPTY"
        ? "У новому застосунку вже є прогрес. Об'єднання поки не підтримується — нічого не змінено."
        : `Перенесення НЕ виконано (${code}). Нічого не змінено; оригінал у старій версії неушкоджений.` });
    }
  }

  return (
    <section className="panel" aria-labelledby="import-title">
      <p className="eyebrow">Прогрес</p>
      <h1 id="import-title">Перенести прогрес з попередньої версії</h1>
      <p>Твої місії, картки повторення й діагностика переносяться без змін: перша спроба лишається першою спробою. Дані попередньої версії <strong>не змінюються й не видаляються</strong>. Нічого не надсилається в мережу.</p>

      {hasProgress && status.kind !== "done" && (
        <p className="feedback warn" role="status">У новому застосунку вже є прогрес. Перенесення можливе лише в порожній профіль — об'єднання поки не підтримується.</p>
      )}

      {status.kind !== "done" && !hasProgress && (
        <>
          <h2>1. Звідки перенести</h2>
          <div className="actions">
            {oldOnDevice !== null && (
              <button type="button" className="btn secondary" onClick={() => choose({ kind: "legacy_v1_this_device", raw: oldOnDevice, label: "попередня версія на цьому пристрої" })}>
                Знайдено на цьому пристрої — перевірити
              </button>
            )}
          </div>
          <label className="field" htmlFor="import-file">Або обери файл резервної копії (.json) з попередньої версії</label>
          <input id="import-file" type="file" accept="application/json,.json" onChange={e => void onFile(e.target.files?.[0])} />

          {check && (
            <>
              <h2>2. Перевірка без втрат</h2>
              {check.status === "ready" && check.counts ? (
                <div className="feedback" role="status">
                  <p>{LEGACY_REASON_UK.READY} Джерело: {source?.label}.</p>
                  <ul>
                    <li>Місій: <strong>{check.counts.attempts}</strong></li>
                    <li>Карток повторення: <strong>{check.counts.cards}</strong></li>
                    <li>Діагностик: <strong>{check.counts.diagnostics}</strong></li>
                    <li>Записів помилок: <strong>{check.counts.errors}</strong></li>
                    <li>Відкладених перевірок 7/14/30: <strong>{check.counts.retention}</strong></li>
                  </ul>
                </div>
              ) : (
                <p className="feedback error" role="alert">{LEGACY_REASON_UK[check.reason]}</p>
              )}
            </>
          )}

          {check?.status === "ready" && (
            <>
              <h2>3. Збережи оригінал</h2>
              <p>Спершу завантаж точну копію оригінальних даних — так у тебе завжди буде шлях назад.</p>
              <div className="actions"><button type="button" className="btn secondary" onClick={downloadOriginal}>Завантажити копію оригіналу</button></div>
              <label className="radio"><input type="checkbox" checked={backedUp} onChange={e => setBackedUp(e.target.checked)} /> <span>Я зберіг(-ла) копію оригіналу</span></label>
              <div className="actions">
                <button type="button" className="btn" disabled={!backedUp || status.kind === "working"} onClick={() => void runImport()}>
                  {status.kind === "working" ? "Переношу…" : "Перенести прогрес"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {status.kind === "error" && <p className="feedback error" role="alert">{status.message}</p>}
      {status.kind === "done" && (
        <div className="feedback" role="status">
          <p>✅ Перенесено й перевірено: {status.receipt.counts.attempts} місій, {status.receipt.counts.cards} карток повторення, {status.receipt.counts.diagnostics} діагностик.</p>
          <p className="muted">Квитанція: SHA-256 оригіналу {status.receipt.originalSha256.slice(0, 12)}…, {new Date(status.receipt.importedAt).toLocaleString("uk-UA")}.</p>
        </div>
      )}
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
