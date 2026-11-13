import { useEffect, useRef, useState } from "react";
import { byteRms, devicesNeeded, micResult, type DeviceResults, type ExamSkill } from "@hospodar/domain";
import { Icon } from "../ui/icons.tsx";

/**
 * Device check before the rehearsal (TZ-EXAM-17 headphone/mic part).
 *  - headphones: a short test tone, then the learner says whether they heard it (the app cannot hear the room);
 *  - microphone: 3 seconds of loudness metering only — nothing is recorded, stored or sent; the mic is switched off after;
 *  - it advises and never blocks the start: without a microphone the typed plan remains the answer path.
 */
type Ctor = typeof AudioContext;
const audioContext = (): Ctor | undefined =>
  (window as unknown as { AudioContext?: Ctor }).AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
const MIC_TEST_MS = 3000;

export function ExamDeviceCheck({ skills, results, onResults }: {
  skills: ExamSkill[] | null; results: DeviceResults; onResults: (r: DeviceResults) => void;
}) {
  const needed = devicesNeeded(skills);
  const [toneState, setToneState] = useState<"idle" | "playing" | "asked">("idle");
  const [micState, setMicState] = useState<"idle" | "listening">("idle");
  const [level, setLevel] = useState(0);
  const [micNote, setMicNote] = useState<string | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  if (needed.length === 0) return null;
  const set = (patch: Partial<DeviceResults>) => onResults({ ...results, ...patch });

  async function playTone() {
    const Ctx = audioContext();
    if (!Ctx) { setToneState("asked"); return; }
    try {
      const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
      await ctx.resume().catch(() => undefined);
      osc.frequency.value = 523; gain.gain.value = 0.12; osc.connect(gain).connect(ctx.destination);
      setToneState("playing");
      let done = false;
      const end = () => { if (done) return; done = true; void ctx.close().catch(() => undefined); setToneState("asked"); };
      osc.onended = end;
      window.setTimeout(end, 2500);                       // a suspended audio device never fires onended: ask anyway
      osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch { setToneState("asked"); }
  }

  async function testMic() {
    setMicNote(null); setLevel(0);
    const Ctx = audioContext();
    if (!navigator.mediaDevices?.getUserMedia || !Ctx) {
      set({ microphone: "problem" }); setMicNote("Цей браузер не дає перевірити мікрофон. У говорінні можна відповісти текстовим планом."); return;
    }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { set({ microphone: "problem" }); setMicNote("Немає дозволу на мікрофон. Дозволь його в налаштуваннях браузера або відповідай у говорінні текстовим планом."); return; }
    let ctx: AudioContext | null = null, timer = 0, peak = 0;
    const stopAll = () => { window.clearInterval(timer); stream.getTracks().forEach(t => t.stop()); void ctx?.close().catch(() => undefined); cleanup.current = null; };
    cleanup.current = stopAll;
    try {
      ctx = new Ctx();
      await ctx.resume().catch(() => undefined);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const started = Date.now();
      setMicState("listening");
      timer = window.setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        const r = byteRms(buf); peak = Math.max(peak, r); setLevel(Math.min(1, r * 4));
        if (Date.now() - started >= MIC_TEST_MS) {
          stopAll(); setMicState("idle");
          const result = micResult(peak); set({ microphone: result });
          setMicNote(result === "ok" ? null : "Мікрофон не вловив голосу. Перевір, чи вибрано правильний мікрофон і чи він не вимкнений, і спробуй ще раз.");
        }
      }, 100);
    } catch {
      stopAll(); setMicState("idle"); set({ microphone: "problem" });
      setMicNote("Не вдалося виміряти гучність мікрофона в цьому браузері. Спробуй ще раз або відповідай у говорінні текстовим планом.");
    }
  }

  return (
    <fieldset className="choices-set device-check" aria-describedby="device-privacy">
      <legend>Перевірка пристрою · <span lang="fi">Laitetarkistus</span></legend>
      <p className="muted" id="device-privacy">Порадимо перевірити перед стартом. Мікрофон лише 3 секунди вимірює гучність і вимикається: нічого не записується, не зберігається й не надсилається.</p>
      {needed.includes("headphones") && (
        <div className="device-row" data-device="headphones" data-result={results.headphones}>
          <p><strong>Навушники або динаміки</strong> — для аудіювання.</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={toneState === "playing"} onClick={() => void playTone()}><Icon name="listening" /> Програти тестовий звук</button>
            {toneState === "asked" && <>
              <button type="button" className="btn secondary" onClick={() => set({ headphones: "ok" })}>Чую звук</button>
              <button type="button" className="btn secondary" onClick={() => set({ headphones: "problem" })}>Не чую</button>
            </>}
          </div>
          {toneState === "playing" && <p className="voice-status" role="status">Звучить тестовий звук…</p>}
          {results.headphones === "ok" && <p className="voice-status" role="status">Навушники: звук чути.</p>}
          {results.headphones === "problem" && <p className="feedback warn" role="status">Звук не чути: перевір гучність і чи підключено навушники, потім програй звук ще раз.</p>}
        </div>
      )}
      {needed.includes("microphone") && (
        <div className="device-row" data-device="microphone" data-result={results.microphone}>
          <p><strong>Мікрофон</strong> — для говоріння.</p>
          <div className="actions">
            <button type="button" className="btn secondary" disabled={micState === "listening"} onClick={() => void testMic()}><Icon name="mic" /> Перевірити мікрофон</button>
          </div>
          {micState === "listening" && <>
            <p className="voice-status" role="status">Скажи щось уголос, наприклад: <span lang="fi">«Hei, minun nimeni on …»</span></p>
            <label className="muted">Гучність <meter min={0} max={1} value={level} /></label>
          </>}
          {results.microphone === "ok" && micState === "idle" && <p className="voice-status" role="status">Мікрофон: голос чути.</p>}
          {micNote && <p className="feedback warn" role="status">{micNote}</p>}
        </div>
      )}
    </fieldset>
  );
}
