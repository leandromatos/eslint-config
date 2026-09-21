/** The messages `import-boundaries` reports. */
export type ImportBoundariesMessageId =
  'crossLayerNeedsBarrel' | 'layerNeedsBarrel' | 'relativeImport' | 'sameLayerNeedsDirect' | 'testFromProduction'

/** What the rule needs to judge one specifier. */
export interface Judgement {
  /** The specifier as the code writes it. */
  specifier: string
  /** The path alias that reaches the source root. */
  alias: string
  /** Every layer suffix the project declares. */
  suffixes: string[]
  /** The suffix of the file doing the importing. */
  suffix: string | null
  /** The directory of that file's own layer, and null when it belongs to none. */
  layer: string | null
  /** Whether the file doing the importing sits in the test tree. */
  isTestTree: boolean
  /** The folder holding tests. */
  testFolder: string
}
