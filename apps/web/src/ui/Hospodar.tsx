/**
 * «Господар» — the brand persona (owner decision 12.11.2026, DEC-06 revised): a Ukrainian householder in a
 * straw hat (бриль) and an embroidered shirt (вишиванка) in brand colours, holding a key — he handles his
 * own affairs in Finland, and YKI, well.
 *
 * TEMPORARY SILHOUETTE: drawn in code in the monogram's line style until a human illustrator delivers the
 * final character in the one illustration style (DESIGN-07). Static, silent, decorative (aria-hidden):
 * his words are real text. Shown only outside tasks; never in EXAM, never while answering or in feedback.
 */
export function Hospodar({ says, size = 96 }: { says: string; size?: number }) {
  return (
    <figure className="hospodar" data-placeholder="true">
      <svg className="hospodar-figure" width={size} height={Math.round(size * 1.2)} viewBox="0 0 100 120" fill="none" stroke="currentColor"
        strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {/* вишиванка: shirt, embroidered placket and collar, крайка belt */}
        <path className="hz-trousers" d="M30 100h36l3 18H55l-7-11-7 11H27z" />
        <path className="hz-shirt" d="M28 70c4-8 11-11 20-11s16 3 20 11l5 34H23z" />
        <path className="hz-embroidery" d="M48 62l3 4-3 4-3-4zM48 73l3 4-3 4-3-4zM48 84l3 4-3 4-3-4z" />
        <path className="hz-collar" d="M39 62l2.5 3.5M43.5 60.5l2 3.5M57 62l-2.5 3.5M52.5 60.5l-2 3.5" />
        <path className="hz-belt" d="M25 93h46" />
        {/* arms: one on the hip, one raised with the key */}
        <path d="M30 72c-6 8-8 14-4 21" />
        <path d="M66 71c6 3 11 2 15-3" />
        <g className="hz-key"><circle cx="85" cy="61" r="4.5" /><path d="M82 64.5l-6.5 7.5M77.5 69.5l2.5 2.2" /></g>
        {/* face */}
        <path className="hz-face" d="M36 33c0 13 5 22 12 22s12-9 12-22z" />
        <circle cx="43" cy="39" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="53" cy="39" r="1.3" fill="currentColor" stroke="none" />
        <path className="hz-moustache" d="M40.5 46c3 2.4 5.5 2.4 7.5 0c2 2.4 4.5 2.4 7.5 0" />
        {/* бриль: straw hat with a forest band */}
        <path className="hz-hat" d="M33 31c0-11 6-18 15-18s15 7 15 18z" />
        <path className="hz-hat" d="M16 33c11-6 53-6 64 0c-11 5-53 5-64 0z" />
        <path className="hz-band" d="M33.5 28h29" />
      </svg>
      <figcaption className="hospodar-says"><span className="visually-hidden">Господар каже: </span>{says}</figcaption>
    </figure>
  );
}
