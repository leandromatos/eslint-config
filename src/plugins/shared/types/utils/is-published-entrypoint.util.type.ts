/** The targets a package's `exports` resolve to, and the modification time of the manifest they were read at. */
export interface ManifestTargets {
  /** The modification time of `package.json` when it was read, in milliseconds. */
  mtimeMs: number
  /** Every path the `exports` of the manifest resolve to, through the conditions they nest. */
  targets: readonly ExportTarget[]
}

/** A path the `exports` of a manifest resolve to, and whether its `*` stands for any text. */
export interface ExportTarget {
  /** The path, as the manifest writes it. */
  target: string
  /** Whether the target sits under a key that holds a `*`, the one place Node reads a `*` as any text. */
  isPattern: boolean
}
