/**
 * The «Господарство» place mark: a house whose door is closed until the learner has tried something
 * there, then stands open with the brand's golden step over the threshold (identity v0.3:
 * Поріг → Маршрут → Дія). Static SVG, no animation; decorative — the text beside it carries the status.
 */
export function PlaceGlyph({ open, size = 44 }: { open: boolean; size?: number }) {
  return (
    <svg className="place-glyph" data-door={open ? "open" : "closed"} width={size} height={size} viewBox="0 0 44 44" fill="none"
      stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M6 20L22 7l16 13" />
      <path d="M10 17v20h24V17" />
      <path d="M6 37h32" />
      {open ? (
        <>
          <rect className="place-doorway" x="18" y="24" width="8" height="13" rx="0.5" />
          <path className="place-leaf" d="M18 24l-4 2v11.6l4-0.6z" />
          <path className="place-step" d="M27 37l5-5" />
        </>
      ) : (
        <>
          <rect className="place-door" x="18" y="24" width="8" height="13" rx="0.5" />
          <circle cx="24" cy="31" r="0.9" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
