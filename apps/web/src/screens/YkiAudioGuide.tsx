import type { ExamSkill, YkiAudioBand } from "@hospodar/domain";
import { audioGuide } from "../content/ykiAudioGuide.ts";

const BANDS: { id: YkiAudioBand; title_uk: string }[] = [
  { id: "warmup", title_uk: "Розминка (рівні A2)" },
  { id: "b1", title_uk: "Практика рівня B1" },
  { id: "stretch", title_uk: "Складніше (B1+–B2)" },
];

/**
 * Audio guide for YKI listening preparation (CURATED-09), on the rehearsal set-up screen only, when listening is chosen.
 * Link-only publisher pages; each says what it is not (not an exam simulation, not official YKI). The listening routine
 * is the catalog's own usage policy: listen first without the text, then gist and details, listen again, then the text.
 */
export function YkiAudioGuide({ skills }: { skills: ExamSkill[] | null }) {
  if (audioGuide.length === 0 || (skills && !skills.includes("listening"))) return null;
  return (
    <details className="exam-look" data-testid="yki-audio-guide">
      <summary>Аудіо для підготовки до аудіювання (зовнішні посилання, не симуляція YKI)</summary>
      <p className="muted">Записи відкриваються на сайті видавця; застосунок нічого не копіює й не оцінює. Це не завдання YKI і не цифровий іспит 2027 — лише додаткове слухання реальної фінської.</p>
      <ol className="plan-frame">
        <li>Спершу послухай без тексту.</li>
        <li>Скажи собі головне, потім 2–3 деталі.</li>
        <li>Послухай ще раз.</li>
        <li>Лише тоді відкрий текст на сторінці видавця, якщо він є, і порівняй.</li>
        <li>Наступного разу візьми новий запис, а не той самий.</li>
      </ol>
      {BANDS.map(b => {
        const rows = audioGuide.filter(l => l.band === b.id);
        return rows.length > 0 && (
          <section key={b.id} aria-labelledby={`audio-${b.id}`}>
            <h3 id={`audio-${b.id}`}>{b.title_uk}</h3>
            <ul className="learn-more-list">
              {rows.map(l => (
                <li key={l.id}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer"><span lang="fi">{l.title_fi}</span> ↗</a>
                  <p className="muted">{[l.provider, l.level, l.host].filter(Boolean).join(" · ")}</p>
                  <p>{l.note_uk}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </details>
  );
}
