/** The messages `import-boundaries` reports. */
export type ImportBoundariesMessageId =
  | 'crossLayerNeedsBarrel'
  | 'layerNeedsBarrel'
  | 'relativeImport'
  | 'sameLayerNeedsDirect'
  | 'testFromProduction'
  | 'testingFromProduction'

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
  /** Whether the file doing the importing sits in the test tree, the mock folder included. */
  isTestTree: boolean
  /** Whether the file doing the importing is test code: in the test tree, a spec, a story, or in a testing folder. */
  isTestCode: boolean
  /** The folder holding tests. */
  testFolder: string
  /** The folder holding what tests are built from. */
  testingFolder: string
  /** The folder holding the stand-in of a module, which belongs to the test tree. */
  mockFolder: string
}
