/* eslint-disable leandromatos/text-american-spelling -- the dictionary names the British spellings the rule reports */
/**
 * The British spellings the rule knows, each with the American one a reader searches for.
 *
 * Each pattern names the British form only: `analys` is written with the endings `analyze` replaces, so the plural
 * `analyses` passes, and `cancell` with `ed` and `ing`, so `cancellation`, which both variants write, passes too. A
 * root no American word holds, such as `colour`, stands alone and is read inside `colourful` as well. A pattern is
 * read in any case and inside a camel-case name.
 */
export const BRITISH_SPELLINGS: { british: string; american: string }[] = [
  { british: 'analys(?:e|ed|ing)', american: 'analyz' },
  { british: 'authoris(?:e|ed|es|ing|ation|er)', american: 'authoriz' },
  { british: 'behaviour', american: 'behavior' },
  { british: 'cancell(?:ed|ing)', american: 'cancel' },
  { british: 'catalogu(?:e|ed|es|ing)', american: 'catalog' },
  { british: 'centre', american: 'center' },
  { british: 'colour', american: 'color' },
  { british: 'defence', american: 'defense' },
  { british: 'favour', american: 'favor' },
  { british: 'honour', american: 'honor' },
  { british: 'initialis(?:e|ed|es|ing|ation|er)', american: 'initializ' },
  { british: 'labour', american: 'labor' },
  { british: 'licence', american: 'license' },
  { british: 'litre', american: 'liter' },
  { british: 'metre', american: 'meter' },
  { british: 'modell(?:ed|ing|er)', american: 'model' },
  { british: 'organis(?:e|ed|es|ing|ation|er)', american: 'organiz' },
  { british: 'recognis(?:e|ed|es|ing|ation|er)', american: 'recogniz' },
  { british: 'serialis(?:e|ed|es|ing|ation|er)', american: 'serializ' },
  { british: 'travell(?:ed|ing|er)', american: 'travel' },
]
