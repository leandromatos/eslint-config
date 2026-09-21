import type { PluginRule } from '../../shared/types/index.js'
import type { WholeArgument } from './rules/index.js'

/**
 * What the `architecture` rules judge against. The shape of the project: where a file lives, what it is called, and
 * what a layer exposes.
 */
export interface ArchitectureOptions {
  /** Layer suffix to the folder that holds it, the same map `importBoundaries` takes. */
  /** Folders whose files carry no suffix, because the folder already says what they are, such as `components`. */
  suffixFreeFolders: string[]
  /** Suffixes whose types are declared beside what they type rather than in the types folder. */
  coLocatedTypeSuffixes: string[]
  /** The path alias that reaches the source root, as the code writes it. */
  alias: string
  suffixToFolder: Record<string, string>
  /** Suffixes with no folder of their own, such as `module`. */
  folderlessSuffixes: string[]
  /** The hooks that synchronize with something outside React, which only a hook file calls. */
  effectHooks: string[]
  /** Directories that hold modules rather than layers, such as `features`: the layer starts one segment later. */
  moduleContainers: string[]
  /** Containers whose modules are reached whole rather than by layer, so each carries a barrel of its own. */
  barrelledContainers: string[]
  /** Folders that mirror the layer tree instead of being a layer, such as `types`. */
  mirrorFolders: string[]
  /** Directories directly under `src/` that are contexts of their own, not modules. */
  rootContexts: string[]
  /** Folders whose files a runtime executes directly, so nothing imports them by name. */
  executedFolders: string[]
  /** Folder to the suffixes an exported type declared under its mirror may end in. */
  typeSuffixes: Record<string, string[]>
  /** The file suffixes whose classes list their methods alphabetically, public then private. */
  orderedSuffixes: string[]
  /** In files of one suffix, the objects passed on whole. */
  wholeArguments: WholeArgument[]
  /** The mirror folder that holds tests. */
  testFolder: string
  /** The kinds of test, as folders directly under the test folder. */
  testKinds: string[]
  /** The kinds whose specs mirror one source file; the others assert a property of the whole. */
  mirroringTestKinds: string[]
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type ArchitectureRule<TMessageId extends string> = PluginRule<TMessageId, ArchitectureOptions>
