import { useEffect, useRef, useState } from "react";
import { voiceEvidenceOf, type ExamItem, type ExamSession, type SpeakingReceipt } from "@hospodar/domain";
import type { ExamEvent } from "../exam/examMachine.ts";
import type { VoiceStore } from "../storage/voiceStore.ts";

/**
 * E06 speaking answer in the practice EXAM (port of the legacy app/exam.mjs flow):
 *  - the microphone starts only on the learner's click; nothing is uploaded, ever;
 *  - consent (off by default) decides whether the recording is kept on this device; without it the recording is
 *    EPHEMERAL (playable on this page only, gone after reload) and the screen says so;
 *  - a stored recording is shown as stored only after the voice store verified bytes + SHA-256 and the receipt was
 *    committed; on every display its bytes are re-verified, a mismatch drops it (VOICE_UNVERIFIED);
 *  - while recording, navigation and finishing wait (the parent disables them); no grade or feedback is shown —
 *    status lines use `.voice-status`, never the LEARN `.feedback` style (EXAM firewall).
 */
type Send = (e: ExamEvent) => void;
const pickMime = () => (["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find(m =>
  typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(m)));

/** Plays a stored clip after re-verifying its bytes; an unverifiable clip is reported and dropped. */
export function useVerifiedClip(receipt: SpeakingReceipt | undefined, voiceStore: VoiceStore, onUnverified: () => void) {
  const [url, setUrl] = useState<string | null>(null);
  const cb = useRef(onUnverified); cb.current = onUnverified;
  useEffect(() => {
    if (!receipt) { setUrl(null); return; }
    let live = true, made: string | null = null;
    void voiceStore.verifyClip(receipt).then(v => {
      if (!live) return;
      if (!v.verified || !v.data) { cb.current(); return; }
      made = URL.createObjectURL(new Blob([v.data], { type: v.mimeType ?? receipt.mimeType }));
      setUrl(made);
    });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [receipt, voiceStore]);
  return url;
}

export function ExamVoice({ item, session, revision, voiceStore, send, disabled, onRecording }: {
  item: ExamItem; session: ExamSession; revision: number; voiceStore: VoiceStore; send: Send; disabled: boolean; onRecording: (r: boolean) => void;
}) {
  const receipt = session.voiceReceipts?.[item.id];
  const evidence = voiceEvidenceOf(session, item.id);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "warn" | "error" } | null>(null);
  const [ephemeralUrl, setEphemeralUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; startedAt: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const storedUrl = useVerifiedClip(receipt, voiceStore, () => {
    send({ type: "VOICE_UNVERIFIED", itemId: item.id });
    setMessage({ tone: "error", text: "Збережений запис не знайдено або він пошкоджений (можливо, дані браузера очищено). Усна відповідь більше не позначена як виконана." });
  });
  const setRec = (r: boolean) => { setRecording(r); onRecording(r); };
  useEffect(() => () => {                                                     // leaving the item: stop the mic, forget the page-only clip
    const r = rec.current; if (r) { r.recorder.onstop = null; if (r.recorder.state !== "inactive") r.recorder.stop(); r.stream.getTracks().forEach(t => t.stop()); }
    onRecording(false);
  }, [item.id]);
  useEffect(() => () => { if (ephemeralUrl) URL.revokeObjectURL(ephemeralUrl); }, [ephemeralUrl]);

  async function start() {
    setMessage(null); setConfirmDelete(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage({ tone: "warn", text: "Цей браузер не підтримує запис. Можна відповісти текстовим планом нижче." }); return;
    }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setMessage({ tone: "warn", text: "Немає дозволу на мікрофон. Альтернатива — текстовий план нижче." }); return; }
    const mime = pickMime();
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => void finish(recorder, stream, chunks);
    rec.current = { recorder, stream, startedAt: performance.now() };
    recorder.start();
    setRec(true);
  }
  async function finish(recorder: MediaRecorder, stream: MediaStream, chunks: Blob[]) {
    stream.getTracks().forEach(t => t.stop());
    const durationMs = performance.now() - (rec.current?.startedAt ?? performance.now());
    rec.current = null; setRec(false);
    const blob = chunks.length ? new Blob(chunks, { type: recorder.mimeType || chunks[0]!.type || "audio/webm" }) : null;
    if (!blob || blob.size === 0) { setMessage({ tone: "error", text: "Не вдалося створити запис (0 байт). Усна відповідь не зарахована." }); return; }
    const now = Date.now();
    if (session.voiceConsent) {
      try {
        const r = await voiceStore.saveClip({ sessionId: session.sessionId, taskId: item.id, data: blob, mimeType: blob.type, durationMs, revision: revision + 1 });
        send({ type: "VOICE_STORED", itemId: item.id, receipt: r, now });
        setEphemeralUrl(null);
        setMessage({ tone: "ok", text: `Запис збережено лише на цьому пристрої й перевірено (${Math.max(1, Math.round(r.bytes / 1024))} КБ, ${Math.max(1, Math.round(r.durationMs / 1000))} с). Автоматично не оцінюється.` });
        return;
      } catch (e) {
        setMessage({ tone: "error", text: `Запис НЕ збережено на пристрої (${String((e as { code?: string })?.code ?? "SAVE_FAILED")}). Прослухати можна лише до переходу чи перезавантаження; спробуй ще раз або звільни місце.` });
      }
    } else setMessage({ tone: "warn", text: "Запис НЕ збережено: згоди на збереження немає. Його можна прослухати лише на цій сторінці; після переходу чи перезавантаження він зникне." });
    setEphemeralUrl(URL.createObjectURL(blob));
    send({ type: "VOICE_EPHEMERAL", itemId: item.id, now });
  }
  function stop() { const r = rec.current; if (r && r.recorder.state !== "inactive") r.recorder.stop(); }
  async function remove() {
    if (!receipt) return;
    try {
      await voiceStore.deleteClip(receipt);
      send({ type: "VOICE_REMOVED", itemId: item.id, now: Date.now() });
      setConfirmDelete(false);
      setMessage({ tone: "ok", text: "Запис видалено з цього пристрою." });
    } catch (e) { setMessage({ tone: "error", text: `Запис НЕ видалено (${String((e as { code?: string })?.code ?? "SAVE_FAILED")}).` }); }
  }

  const hasStored = Object.keys(session.voiceReceipts ?? {}).length > 0;
  const playUrl = storedUrl ?? ephemeralUrl;
  return (
    <div className="exam-voice">
      <p className="muted">Можна відповісти вголос. Мікрофон вмикається лише після натискання. Голос <strong>ніколи не надсилається</strong> на сервер і не оцінюється автоматично.</p>
      <label className="radio">
        <input type="checkbox" checked={session.voiceConsent} disabled={disabled || recording || (session.voiceConsent && hasStored)}
          onChange={e => send({ type: "CONSENT", consent: e.target.checked, now: Date.now() })} />
        <span>Зберігати мої голосові записи в цьому браузері, доки я їх не видалю або не почну нову репетицію.</span>
      </label>
      {session.voiceConsent && hasStored && <p className="muted">Щоб відкликати згоду, спершу видали збережені записи.</p>}
      <div className="actions">
        <button type="button" className="btn secondary" disabled={disabled && !recording} onClick={() => void (recording ? stop() : start())}>
          {recording ? "⏹ Зупинити запис" : evidence ? "Записати ще раз" : "🎙 Записати голос"}</button>
        {evidence === "stored" && !recording && !confirmDelete && <button type="button" className="btn secondary" disabled={disabled} onClick={() => setConfirmDelete(true)}>Видалити запис</button>}
        {confirmDelete && <>
          <button type="button" className="btn danger" disabled={disabled} onClick={() => void remove()}>Так, видалити запис</button>
          <button type="button" className="btn secondary" onClick={() => setConfirmDelete(false)}>Скасувати</button>
        </>}
      </div>
      {recording && <p className="voice-status warn" role="status">Іде запис. Зупини його, перш ніж переходити до іншого завдання.</p>}
      {message && <p className={message.tone === "error" ? "feedback error" : `voice-status${message.tone === "warn" ? " warn" : ""}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}
      {playUrl && !recording && <figure className="player"><figcaption>{storedUrl ? "Твій збережений запис" : "Твій запис (лише на цій сторінці)"}</figcaption>
        <audio controls src={playUrl} aria-label="Прослухати свою усну відповідь" /></figure>}
    </div>
  );
}
