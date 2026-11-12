/**
 * «Господар» — the brand persona (owner decisions 12.11.2026, DEC-06 revised). ROLE: a master and mentor (сенсей,
 * владник) of his own life in Finland and of YKI. LOOK: a kind village uncle from a cartoon — big round head, a
 * straw hat (бриль), a big moustache, smiling eyes, a round belly in an embroidered shirt (вишиванка) with a
 * крайка belt and a кептар in brand colours, boots, and a ring of keys. An original design, not a copy of any
 * existing cartoon character; warm, never a mocking stereotype.
 *
 * TEMPORARY SILHOUETTE: drawn in code until a human illustrator delivers the final character in the one
 * illustration style (DESIGN-07). Static, silent, decorative (aria-hidden): his words are real text.
 * Shown only outside tasks; never in EXAM, never while answering or in feedback.
 */
export function Hospodar({ says, size = 112 }: { says: string; size?: number }) {
  return (
    <figure className="hospodar" data-placeholder="true">
      <svg className="hospodar-figure" width={size} height={Math.round(size * 1.2)} viewBox="0 0 100 120" fill="none" stroke="currentColor"
        strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {/* boots, trousers, round belly in a вишиванка, кептар, крайка under the belly */}
        <path className="hz-boots" d="M37 105h10v11H35zM53 105h10l2 11H53z" />
        <path className="hz-trousers" d="M35 94h30l-1 12H36z" />
        <path className="hz-shirt" d="M29 73c0-9 9-14 21-14s21 5 21 14v13c0 8-9 13-21 13s-21-5-21-13z" />
        <path className="hz-vest" d="M29 73c0-6 5-11 13-13v39c-8-1-13-6-13-13z" />
        <path className="hz-vest" d="M71 73c0-6-5-11-13-13v39c8-1 13-6 13-13z" />
        <path className="hz-embroidery" d="M50 63l2.5 3.5-2.5 3.5-2.5-3.5zM50 73l2.5 3.5-2.5 3.5-2.5-3.5z" />
        <path className="hz-collar" d="M44 60.5l2 3M56 60.5l-2 3" />
        <path className="hz-belt" d="M33 89c11 3.5 23 3.5 34 0" />
        {/* one hand on the belly, the other holds the ring of keys */}
        <path d="M30 76c-4 7-3 13 5 15" />
        <path d="M70 76c5 5 8 8 12 8" />
        <g className="hz-key"><circle cx="85" cy="84" r="4" /><path d="M83 88v7M87 88v6M83 93h2M87 92h2" /></g>
        {/* big round head: ears, smiling eyes, round nose, big moustache, a small smile */}
        <path className="hz-face" d="M33.5 39a16.5 16.5 0 1 0 33 0a16.5 16.5 0 1 0-33 0z" />
        <path d="M33.8 37.5c-2.5-.5-3.5 2.5-1.5 4.5M66.2 37.5c2.5-.5 3.5 2.5 1.5 4.5" />
        <path d="M42 36.5q2.5-2.8 5 0M53 36.5q2.5-2.8 5 0" />
        <path className="hz-face" d="M47.6 41.5a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0z" />
        <path className="hz-moustache" d="M50 44.5c-4-2.5-10.5-1.5-13.5 4 3-1.3 6.5-1.2 9.3.5 1.8 1 3.2.6 4.2-.6 1 1.2 2.4 1.6 4.2.6 2.8-1.7 6.3-1.8 9.3-.5-3-5.5-9.5-6.5-13.5-4z" />
        <path d="M47 51.5q3 2 6 0" />
        {/* бриль: straw hat with a forest band */}
        <path className="hz-hat" d="M37 25c0-8 6-12.5 13-12.5S63 17 63 25z" />
        <path className="hz-hat" d="M21 26.5c12-6.5 46-6.5 58 0c-12 5.5-46 5.5-58 0z" />
        <path className="hz-band" d="M37.4 22h25.2" />
      </svg>
      <figcaption className="hospodar-says"><span className="visually-hidden">Господар каже: </span>{says}</figcaption>
    </figure>
  );
}
