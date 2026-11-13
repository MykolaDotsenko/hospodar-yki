import { useEffect, useRef, useState } from "react";
import { speakingPhase, voiceEvidenceOf, type ExamItem, type ExamSession, type SpeakingPhase, type SpeakingReceipt, type SpeakingWindows } from "@hospodar/domain";
import type { ExamEvent } from "../exam/examMachine.ts";
import type { VoiceStore } from "../storage/voiceStore.ts";
import { Icon } from "../ui/icons.tsx";

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

/** A short signal before the response window (exam-like cue). Silent if the browser has no Web Audio. */
function signal() {
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = 880; gain.gain.value = 0.08; osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.25); osc.onended = () => void ctx.close();
  } catch { /* the countdown text is the primary cue */ }
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function ExamVoice({ item, session, revision, voiceStore, send, disabled, onRecording, windows }: {
  item: ExamItem; session: ExamSession; revision: number; voiceStore: VoiceStore; send: Send; disabled: boolean; onRecording: (r: boolean) => void;
  /** TZ-EXAM-11: preparation and response windows (profile-verified or labelled practice). */
  windows?: SpeakingWindows;
}) {
  const receipt = session.voiceReceipts?.[item.id];
  const evidence = voiceEvidenceOf(session, item.id);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "warn" | "error" } | null>(null);
  const [ephemeralUrl, setEphemeralUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; startedAt: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const [timedStart, setTimedStart] = useState<number | null>(null);     // timed task start (ms), see below
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
      setTimedStart(null); setMessage({ tone: "warn", text: "Цей браузер не підтримує запис. Можна відповісти текстовим планом нижче." }); return;
    }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setTimedStart(null); setMessage({ tone: "warn", text: "Немає дозволу на мікрофон. Альтернатива — текстовий план нижче." }); return; }
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
    rec.current = null; setRec(false); setTimedStart(null);                 // any end of recording also ends a timed task
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

  // Timed task (TZ-EXAM-11): preparation → signal → recording starts by itself → response window ends it.
  // The microphone still starts only because the learner started the timed task.
  const [, tick] = useState(0);
  useEffect(() => {
    if (timedStart === null) return;
    const t = setInterval(() => tick(x => x + 1), 250);
    return () => clearInterval(t);
  }, [timedStart]);
  const timed = windows && timedStart !== null ? speakingPhase(windows, timedStart, Date.now()) : null;
  const lastPhase = useRef<SpeakingPhase | null>(null);
  useEffect(() => {
    if (!timed) { lastPhase.current = null; return; }
    if (timed.phase !== lastPhase.current) {
      if (timed.phase === "respond") { signal(); void start(); }
      if (timed.phase === "over") { stop(); setTimedStart(null); }
      lastPhase.current = timed.phase;
    }
  });
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
      <p className="muted" data-system-notice>Можна відповісти вголос. Мікрофон вмикається лише після твоєї дії: кнопки запису або старту завдання з таймером (тоді — сам, коли мине час на підготовку). Голос <strong>ніколи не надсилається</strong> на сервер і не оцінюється автоматично.</p>
      <label className="radio" data-system-notice>
        <input type="checkbox" checked={session.voiceConsent} disabled={disabled || recording || (session.voiceConsent && hasStored)}
          onChange={e => send({ type: "CONSENT", consent: e.target.checked, now: Date.now() })} />
        <span>Зберігати мої голосові записи в цьому браузері, доки я їх не видалю або не почну нову репетицію.</span>
      </label>
      {session.voiceConsent && hasStored && <p className="muted" data-system-notice>Щоб відкликати згоду, спершу видали збережені записи.</p>}
      {windows && !recording && timedStart === null && (
        <p className="muted" lang="fi">{windows.source === "practice"
          ? `Ajastettu harjoitus: valmistautuminen ${windows.prepSeconds} s, vastaus ${windows.responseSeconds} s. Harjoitusajat — virallisia vuoden 2027 aikoja ei ole vahvistettu.`
          : `Ajat profiilista: valmistautuminen ${windows.prepSeconds} s, vastaus ${windows.responseSeconds} s.`}</p>
      )}
      {timed?.phase === "prep" && (
        <p className="voice-status" role="status" lang="fi" data-testid="speaking-timer">Valmistautumisaika {mmss(timed.secondsLeft)}. Nauhoitus alkaa automaattisesti merkkiäänen jälkeen.</p>
      )}
      {timed?.phase === "respond" && recording && (
        <p className="voice-status warn" role="status" lang="fi" data-testid="speaking-timer">Vastausaika {mmss(timed.secondsLeft)}.</p>
      )}
      <div className="actions">
        {windows && !recording && timedStart === null && (
          <button type="button" className="btn secondary" disabled={disabled} onClick={() => { setMessage(null); lastPhase.current = null; setTimedStart(Date.now()); }}>Aloita ajastettu tehtävä</button>
        )}
        {timed?.phase === "prep" && <button type="button" className="btn secondary" onClick={() => setTimedStart(null)}>Peruuta ajastus</button>}
        <button type="button" className="btn secondary" disabled={(disabled && !recording) || timed?.phase === "prep"} onClick={() => void (recording ? stop() : start())}>
          {recording ? <><Icon name="stop" /> Lopeta nauhoitus</> : evidence ? "Nauhoita uudelleen" : <><Icon name="mic" /> Nauhoita vastaus</>}</button>
        {evidence === "stored" && !recording && !confirmDelete && <button type="button" className="btn secondary" disabled={disabled} onClick={() => setConfirmDelete(true)}>Poista nauhoite</button>}
        {confirmDelete && <>
          <button type="button" className="btn danger" disabled={disabled} onClick={() => void remove()}>Kyllä, poista nauhoite</button>
          <button type="button" className="btn secondary" onClick={() => setConfirmDelete(false)}>Peruuta</button>
        </>}
      </div>
      {recording && <p className="voice-status warn" role="status" lang="fi">Nauhoitus käynnissä. Lopeta se ennen kuin siirryt toiseen tehtävään.</p>}
      {message && <p className={message.tone === "error" ? "feedback error" : `voice-status${message.tone === "warn" ? " warn" : ""}`} role={message.tone === "error" ? "alert" : "status"} data-system-notice>{message.text}</p>}
      {playUrl && !recording && <figure className="player"><figcaption lang="fi">{storedUrl ? "Tallennettu nauhoitteesi" : "Nauhoitteesi (vain tällä sivulla)"}</figcaption>
        <audio controls src={playUrl} aria-label="Kuuntele vastauksesi" /></figure>}
    </div>
  );
}
