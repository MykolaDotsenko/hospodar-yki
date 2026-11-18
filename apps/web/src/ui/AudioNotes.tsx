import { useState } from "react";
import { AUDIO_NOTE_FIELDS_UK, AUDIO_NOTE_MAX_CHARS } from "@hospodar/domain";

/**
 * strategic-audio-notes: the learner's own notes while listening (when / where / what), like the exam's note paper — own
 * processing, not support, so answers stay independent and scored. Session only: never stored or scored. Shared by the
 * LEARN listening lesson and the delayed listening check.
 */
export type AudioNotesValue = Record<"when" | "where" | "what", string>;
export const EMPTY_AUDIO_NOTES: AudioNotesValue = { when: "", where: "", what: "" };
export const hasAudioNotes = (n: AudioNotesValue) => Object.values(n).some(x => x.trim());

export function AudioNotesBox({ notes, onChange, idPrefix = "note" }: { notes: AudioNotesValue; onChange: (n: AudioNotesValue) => void; idPrefix?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="audio-notes" open={open} onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>Мої нотатки під час слухання (за бажанням)</summary>
      <p className="muted">Як на папері під час іспиту: занотуй коротко, будь-якою мовою. Це твої нотатки, а не підказка, — відповіді лишаються самостійними. Нотатки не зберігаються.</p>
      {AUDIO_NOTE_FIELDS_UK.map(f => (
        <div key={f.id}>
          <label className="field" htmlFor={`${idPrefix}-${f.id}`}>{f.label_uk}</label>
          <input id={`${idPrefix}-${f.id}`} className="plan-notes" autoComplete="off" maxLength={AUDIO_NOTE_MAX_CHARS} value={notes[f.id]}
            onChange={e => onChange({ ...notes, [f.id]: e.target.value })} />
        </div>
      ))}
    </details>
  );
}

/** The notes back next to the keys, for self-comparison (only after the answers are saved). */
export function AudioNotesBack({ notes }: { notes: AudioNotesValue }) {
  if (!hasAudioNotes(notes)) return null;
  return (
    <div className="plan-back" data-testid="audio-notes-back">
      <strong>Твої нотатки:</strong>
      <ul>{AUDIO_NOTE_FIELDS_UK.filter(f => notes[f.id].trim()).map(f => <li key={f.id}>{f.label_uk.split(" (")[0]} {notes[f.id].trim()}</li>)}</ul>
      <span className="muted">Порівняй: що з потрібного ти встиг(ла) занотувати?</span>
    </div>
  );
}
