import { useState } from "react";
import { KEYBOARD_MAX_CHARS, KEYBOARD_SAMPLE_FI, keyboardCheck, type ExamSkill, type KeyboardVerdict } from "@hospodar/domain";

/**
 * Keyboard check before the rehearsal (digital-task-literacy): can the learner type ä and ö, and is the Ukrainian layout
 * off? One sample sentence; the result says only what the keyboard did. Advises, never blocks, stores nothing.
 * Shown when the chosen skills include a typed answer (writing, or the typed plan in speaking).
 */
const SAY: Record<KeyboardVerdict, string> = {
  ok: "Клавіатура готова: ä і ö набираються, розкладка латинська.",
  cyrillic: "Схоже, увімкнена українська розкладка: деякі літери кириличні, хоч виглядають як латинські. Перемкни розкладку й спробуй ще раз.",
  umlauts: "ä або ö вийшли як a/o. Подивись нижче, як їх набирати на твоєму пристрої, і спробуй ще раз.",
  different: "Текст відрізняється від зразка (можливо, просто описка). Порівняй і спробуй ще раз — це перевірка клавіатури, не мови.",
};

export function ExamKeyboardCheck({ skills }: { skills: ExamSkill[] | null }) {
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<ReturnType<typeof keyboardCheck> | null>(null);
  const s = skills ?? ["reading", "listening", "writing", "speaking"];
  if (!s.includes("writing") && !s.includes("speaking")) return null;
  return (
    <fieldset className="choices-set keyboard-check" data-testid="keyboard-check">
      <legend>Клавіатура: ä і ö (за бажанням)</legend>
      <p>На цифровому іспиті відповіді друкуються. Набери речення нижче так, як бачиш, щоб перевірити клавіатуру. Нічого не зберігається й не оцінюється.</p>
      <p className="prompt" lang="fi">{KEYBOARD_SAMPLE_FI}</p>
      <label className="field" htmlFor="keyboard-typed">Набери це речення</label>
      <input id="keyboard-typed" lang="fi" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={KEYBOARD_MAX_CHARS}
        value={typed} onChange={e => { setTyped(e.target.value); setResult(null); }} />
      <div className="actions"><button type="button" className="btn secondary" onClick={() => setResult(keyboardCheck(typed))}>Перевірити клавіатуру</button></div>
      {result && (
        <p className={result.verdict === "ok" ? "voice-status" : "feedback warn"} role="status" data-testid="keyboard-result">
          {SAY[result.verdict]}{result.cyrillicChars.length > 0 && <> Кириличні: <span lang="uk">{result.cyrillicChars.join(" ")}</span>.</>}
        </p>
      )}
      <details>
        <summary>Як набрати ä і ö</summary>
        <ul>
          <li><strong>Windows:</strong> додай фінську (або «англійську (США) — міжнародну») розкладку в налаштуваннях мови; у фінській ä і ö мають власні клавіші праворуч від L.</li>
          <li><strong>macOS:</strong> Option + U, потім a або o; або додай фінську розкладку.</li>
          <li><strong>Android та iPhone:</strong> утримуй клавішу a або o — з'явиться ä або ö.</li>
          <li><strong>Linux:</strong> додай фінську розкладку або використовуй клавішу Compose.</li>
        </ul>
        <p className="muted">Як виглядає редактор на справжньому цифровому іспиті 2027 року (чи є там кнопки спеціальних літер), не перевірено.</p>
      </details>
    </fieldset>
  );
}
