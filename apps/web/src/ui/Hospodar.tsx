/**
 * «Господар» — the brand persona (owner decisions 12.11.2026, DEC-06 revised). ROLE: a master and mentor (сенсей,
 * владник) of his own life in Finland and of YKI. LOOK: a village householder drawn as a semi-realistic half-length
 * portrait (not a cartoon, not a caricature): human proportions, a weathered kind face with a grey moustache, a straw
 * hat (бриль), an embroidered linen shirt (вишиванка) with shoulder bands, a sleeveless кептар and a крайка belt in
 * brand colours, and a ring of keys in his hand — the keeper of every door. An original design.
 *
 * TEMPORARY ILLUSTRATION: drawn in code until a human illustrator delivers the final character in the one
 * illustration style (DESIGN-07). Colours come from the persona_* brand tokens and stay the same in the light and
 * dark themes. Static, silent, decorative (aria-hidden): his words are real text.
 * Shown only outside tasks; never in EXAM, never while answering or in feedback.
 */
export function Hospodar({ says, size = 128 }: { says: string; size?: number }) {
  return (
    <figure className="hospodar" data-placeholder="true">
      <svg className="hospodar-figure" width={size} height={Math.round(size * 1.25)} viewBox="0 0 120 150" fill="none"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {/* linen shirt: shoulders, both arms, torso */}
        <path className="hp-linen hp-line" d="M20 150C20 122 26 104 42 97l12-6h12l12 6c16 7 22 25 22 53z" />
        <path className="hp-fold" d="M27 124c2 8 2 16 1 24M33 112c-2 6-3 12-3 18M91 118c2 6 3 13 3 20" />
        {/* shoulder embroidery bands (уставки) */}
        <path className="hp-stitch-band" d="M27.5 110.5l11-6M92.5 110.5l-11-6" />
        <path className="hp-gold-thread" d="M26.5 114.5l12.5-6.8M93.5 114.5l-12.5-6.8" />
        {/* embroidered placket and крайка belt */}
        <path className="hp-stitch-band" d="M60 97v53" />
        <path className="hp-gold-thread" d="M56.2 96v54M63.8 96v54" />
        <path className="hp-belt" d="M40 136c13 4 27 4 40 0v8c-13 4-27 4-40 0z" />
        <path className="hp-belt-thread" d="M41 140c13 4 25 4 38 0" />
        {/* кептар: sleeveless vest, open in front, darker inner edge */}
        <path className="hp-vest hp-line" d="M40.5 99L52 92l-3.5 58H35c0-20 2-38 5.5-51z" />
        <path className="hp-vest hp-line" d="M79.5 99L68 92l3.5 58H85c0-20-2-38-5.5-51z" />
        <path className="hp-vest-shade" d="M52 92l-3.5 58h-3.2L49 94zM68 92l3.5 58h3.2L71 94z" />
        <path className="hp-gold-thread" d="M40.8 100.5c-3 13-4.6 30-4.8 49M79.2 100.5c3 13 4.6 30 4.8 49" />
        {/* neck in shadow, embroidered stand collar with a tie */}
        <path className="hp-skin-shade" d="M52.5 78h15l1.2 12c-4.5 3-12.9 3-17.4 0z" />
        <path className="hp-collar hp-line" d="M52.3 88.5c4.5 3.4 10.9 3.4 15.4 0l.8 4.6c-5 3.8-12 3.8-17 0z" />
        <path className="hp-gold-thread" d="M60 95.5c-1.5 3-2.3 5.5-2.6 8M60 95.5c1.5 3 2.3 5.5 2.6 8" />
        {/* bent forearm with an embroidered cuff; the hand holds the ring of keys at chest height */}
        <path className="hp-linen hp-line" d="M101 150c0-7-2-13-6-18l-8-13-7.5 4.8 7.5 12.200c2 4 3 9 3 14z" />
        <path className="hp-stitch-cuff" d="M81.4 125.300l7.4-4.6" />
        <path className="hp-gold-ring" d="M70.8 127.500a4.7 4.7 0 1 0 9.4 0a4.7 4.7 0 1 0-9.4 0z" />
        <path className="hp-gold-key" d="M73.3 131.600l-1.8 9.400M71.5 141l-2.5-.4M72 138.300l-2.3-.4M77.6 132l.9 9.800M78.5 141.800l2.5-.3M78.3 139.100l2.2-.2" />
        <path className="hp-skin hp-line" d="M75 115.200c2.5-2.3 7-2 9 .6 1.8 2.4 1.5 6-.8 8-2.5 2.2-6.5 1.8-8.5-.6-1.9-2.3-1.8-5.9.3-8z" />
        <path className="hp-crease" d="M76.7 117.500c1.5 1 2 2.5 1.6 4.200M79.8 116c1.3 1.2 1.7 2.8 1.3 4.6" />
        <g transform="translate(0 4)">
        {/* head: ears, face, hat shadow on the forehead, cheeks */}
        <path className="hp-skin-shade hp-line" d="M44.8 56c-2.6-.6-3.8 2.4-2.8 5.2.8 2.2 2.3 3.3 3.8 2.800M75.2 56c2.6-.6 3.8 2.4 2.8 5.2-.8 2.2-2.3 3.3-3.8 2.8" />
        <path className="hp-skin hp-line" d="M45 50c0-6 30-6 30 0v11c0 10.5-6.5 18.5-15 18.500S45 71.5 45 61z" />
        <path className="hp-skin-shade" d="M45.2 47h29.600v7c-7.5-2.3-22.1-2.3-29.6 0z" />
        <path className="hp-hair" d="M45.2 49.500c-.8 4.5-.4 8 .6 10.500l1.7-9zM74.8 49.500c.8 4.5.4 8-.6 10.500l-1.7-9z" />
        <path className="hp-cheek" d="M46.8 66.500a3.4 2.6 0 1 0 6.8 0a3.4 2.6 0 1 0-6.8 0zM66.4 66.500a3.4 2.6 0 1 0 6.8 0a3.4 2.6 0 1 0-6.8 0z" />
        {/* brows, eyes with lids and laugh lines, nose */}
        <path className="hp-brow" d="M48.6 56.200c2.3-1.7 5-1.8 7.2-.5M71.4 56.200c-2.3-1.7-5-1.8-7.2-.5" />
        <path className="hp-eye-white" d="M49.8 60.300c1.7-1.8 4-1.8 5.7 0-1.7 1.3-4 1.3-5.7 0zM64.5 60.300c1.7-1.8 4-1.8 5.7 0-1.7 1.3-4 1.3-5.7 0z" />
        <path className="hp-pupil" d="M51.5 60.100a1.150 1.150 0 1 0 2.3 0a1.150 1.150 0 1 0-2.3 0zM66.2 60.100a1.150 1.150 0 1 0 2.3 0a1.150 1.150 0 1 0-2.3 0z" />
        <path className="hp-crease" d="M49.3 59.600c1.9-1.7 4.8-1.7 6.7.2M64 59.800c1.9-1.9 4.8-1.9 6.7-.2M48 62.600c-.7.8-1.5 1.2-2.3 1.300M72 62.600c.7.8 1.5 1.2 2.3 1.300M50.5 63.300c1.5.8 3.3.8 4.8.1M64.7 63.400c1.5.7 3.3.7 4.8-.1" />
        <path className="hp-skin-shade" d="M60 57.500c1 4 3.2 7 3.2 9.3 0 1.7-1.4 2.5-3.2 2.500s-3.2-.8-3.2-2.500c0-2.3 2.2-5.3 3.2-9.300z" />
        <path className="hp-crease" d="M56.9 67.300c.5 1.3 1.7 2 3.1 2s2.6-.7 3.1-2M55.3 66.300c-.9 1.4-1.5 3-1.6 4.500M64.7 66.300c.9 1.4 1.5 3 1.6 4.5" />
        {/* long grey moustache, lower lip, chin */}
        <path className="hp-hair hp-line" d="M60 69.800c-3.8-1.6-9.3-.8-12 2.6-1.9 2.4-2.5 5.6-1.9 8.1 1.8-2.7 4.7-4.3 8-4.4 2.5-.1 4.7-1 5.9-2.6 1.2 1.6 3.4 2.5 5.9 2.6 3.3.1 6.2 1.7 8 4.4.6-2.5 0-5.7-1.9-8.1-2.7-3.4-8.2-4.2-12-2.600z" />
        <path className="hp-strand" d="M57.5 71.500c-3 .2-6 1.5-7.8 4M62.5 71.500c3 .2 6 1.5 7.8 4M60 70.200v3" />
        <path className="hp-crease" d="M56.8 76.300c2 1.3 4.4 1.3 6.4 0" />
        {/* бриль: straw hat — brim underside, brim, crown, band, weave */}
        <path className="hp-straw-shade hp-line" d="M21 45c0-4.3 17.5-7.8 39-7.800s39 3.5 39 7.8-17.5 7.8-39 7.800S21 49.3 21 45z" />
        <path className="hp-straw hp-line" d="M21 43c0-4.3 17.5-7.8 39-7.800s39 3.5 39 7.8-17.5 7.3-39 7.300S21 47.3 21 43z" />
        <path className="hp-straw hp-line" d="M42 42.500c0-17 7.5-27.5 18-27.500s18 10.5 18 27.500c-5.5 2.5-30.5 2.5-36 0z" />
        <path className="hp-band" d="M42.2 37.200c6 2.6 29.6 2.6 35.6 0l.2 5.300c-5.5 2.5-30.5 2.5-36 0z" />
        <path className="hp-weave" d="M46 27c8 2.4 20 2.4 28 0M50 20.500c6 1.6 14 1.6 20 0M44 32.500c9 2.8 23 2.8 32 0M27 45.500c7 2.4 20 3.5 33 3.500s26-1.1 33-3.500M33 40c8-1.8 17-2.6 27-2.600s19 .8 27 2.6" />
        </g>
      </svg>
      <figcaption className="hospodar-says"><span className="visually-hidden">Господар каже: </span>{says}</figcaption>
    </figure>
  );
}
