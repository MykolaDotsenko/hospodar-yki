import { useEffect, useState } from "react";
import { formatMb, type OfflineManifest, type OfflinePack, type PackState } from "../pwa/manifest.ts";
import { downloadPack, isOfflineReady, loadManifest, packStatus, removePack, type DownloadResult } from "../pwa/offline.ts";

/**
 * «Офлайн-доступ» (WEB-05): honest status of what works without internet, real sizes, explicit per-pack download and
 * removal, and the browser's storage estimate. Learner data (IndexedDB) is separate and never touched here.
 */
type Row = { pack: OfflinePack; state: PackState; cached: number };
const STATE_UK: Record<PackState, string> = { downloaded: "збережено для офлайну", partial: "частково збережено", online_only: "лише з інтернетом" };
const REASON_UK: Record<Exclude<DownloadResult, { ok: true }>["reason"], string> = {
  NETWORK: "немає з'єднання", HTTP: "файл недоступний на сервері", SIZE_MISMATCH: "файл пошкоджено під час завантаження", HASH_MISMATCH: "файл не збігається з перевіреною версією", QUOTA_OR_DISK_FULL: "бракує місця на пристрої", CACHE_READBACK_FAILED: "не вдалося перевірити файл у локальному кеші",
};

export function OfflineScreen({ onHome }: { onHome: () => void }) {
  const [manifest, setManifest] = useState<OfflineManifest | null | "loading">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<{ id: string; done: number; total: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const supported = typeof caches !== "undefined" && "serviceWorker" in navigator;

  async function refresh(m: OfflineManifest) {
    try {
      const verified = await Promise.all(m.packs.map(async pack => ({ pack, ...(await packStatus(pack, caches)) })));
      setRows(verified);
      const e = await navigator.storage?.estimate?.().catch(() => undefined);
      setEstimate(e?.usage !== undefined && e.quota !== undefined ? { usage: e.usage, quota: e.quota } : null);
    } catch {
      setRows([]); // Never keep showing a stale "downloaded" status after a failed verification.
      setMessage({ text: "Не вдалося перевірити офлайн-файли в браузері. Не розраховуй на них без інтернету.", error: true });
    }
  }
  useEffect(() => { void loadManifest().then(m => { setManifest(m); if (m && supported) void refresh(m); }); }, []);

  async function download(pack: OfflinePack) {
    if (manifest === null || manifest === "loading") return;
    setMessage(null); setBusy({ id: pack.id, done: 0, total: pack.files.length });
    const r = await downloadPack(pack, caches, (done, total) => setBusy({ id: pack.id, done, total }));
    setBusy(null);
    setMessage(r.ok ? { text: `«${pack.title_uk}» збережено для офлайну (${r.files} файлів, перевірено розмір і контрольну суму).`, error: false }
      : { text: `НЕ збережено повністю: ${REASON_UK[r.reason]} (${r.failedUrl.split("/").pop()}). Уже збережені файли лишилися; спробуй ще раз.`, error: true });
    await refresh(manifest);
  }
  async function remove(pack: OfflinePack) {
    if (manifest === null || manifest === "loading") return;
    await removePack(pack, caches);
    setMessage({ text: `«${pack.title_uk}» видалено з офлайн-сховища. Твій прогрес не змінено.`, error: false });
    await refresh(manifest);
  }

  return (
    <section className="panel" aria-labelledby="off-title">
      <p className="eyebrow">Офлайн</p>
      <h1 id="off-title">Офлайн-доступ</h1>
      {!supported ? <p>Цей браузер не підтримує офлайн-режим. Застосунок працює лише з інтернетом; прогрес однаково зберігається на пристрої.</p>
        : manifest === "loading" ? <p className="muted">Перевіряю…</p>
        : manifest === null ? <p>Офлайн-режим доступний лише у зібраній версії застосунку (не в режимі розробки).</p>
        : (
          <>
            <p aria-live="polite"><strong>Сам застосунок:</strong> {isOfflineReady() ? "відкривається без інтернету." : "ще готується до роботи без інтернету — відкрий сторінку ще раз з інтернетом."} ({formatMb(manifest.shellBytes)})</p>
            <p>Аудіо й фото без інтернету працюють лише після того, як ти їх збережеш тут. Нічого не завантажується само.</p>
            <ul className="skill-lines" aria-label="Офлайн-пакети">
              {rows.map(r => (
                <li key={r.pack.id}>
                  <strong>{r.pack.title_uk}</strong> · {formatMb(r.pack.bytes)} · {r.pack.files.length} файлів<br />
                  Стан: <strong>{STATE_UK[r.state]}</strong>{r.state === "partial" ? ` (${r.cached} з ${r.pack.files.length})` : ""}
                  <div className="actions">
                    {r.state !== "downloaded" && <button type="button" className="btn secondary" disabled={busy !== null} onClick={() => void download(r.pack)}>
                      {busy?.id === r.pack.id ? `Зберігаю… ${busy.done} / ${busy.total}` : r.state === "partial" ? "Дозберегти" : "Зберегти для офлайну"}</button>}
                    {r.state !== "online_only" && <button type="button" className="btn secondary" disabled={busy !== null} onClick={() => void remove(r.pack)}>Видалити з офлайну</button>}
                  </div>
                </li>
              ))}
            </ul>
            {busy && <progress max={busy.total} value={busy.done} aria-label="Прогрес збереження">{busy.done} / {busy.total}</progress>}
            {message && <p className={message.error ? "feedback error" : "feedback"} role={message.error ? "alert" : "status"}>{message.text}</p>}
            {manifest.notOffline.videos > 0 && <p className="muted">Відео ({manifest.notOffline.videos}) офлайн не зберігаються: без перевірених субтитрів вони тут не відтворюються.</p>}
            {estimate && <p className="muted">Браузер виділив цьому сайту {formatMb(estimate.quota)}, використано {formatMb(estimate.usage)}. Браузер може очистити офлайн-файли, якщо на пристрої мало місця — тоді стан тут покаже це.</p>}
          </>
        )}
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}
