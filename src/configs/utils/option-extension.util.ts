import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { NamingOptions } from '../../plugins/naming/types/index.js'
import type { TextOptions } from '../../plugins/text/types/index.js'
import type { TsdocOptions } from '../../plugins/tsdoc/types/index.js'
import type { TypescriptOptions } from '../../plugins/typescript/types/index.js'
import type { GroupExtension, ListExtension, MapExtension, Preset, TierVocabulary } from '../types/index.js'

/**
 * The vocabulary of a tier with a preset applied over it, each group the preset names extending the group of the tier.
 *
 * @param vocabulary - What the tier judges with.
 * @param preset - The vocabulary the project takes on purpose.
 * @returns The vocabulary the project's own options extend.
 */
export const applyPreset = (vocabulary: TierVocabulary, preset: Preset): TierVocabulary => {
  const architecture = extendArchitecture(vocabulary.architecture, preset.architecture)
  const naming = extendNaming(vocabulary.naming, preset.naming)
  const testing = { ...vocabulary.testing, ...preset.testing }
  const text = extendText(vocabulary.text, preset.text)
  const tsdoc = extendTsdoc(vocabulary.tsdoc, preset.tsdoc)
  const typescript = extendTypescript(vocabulary.typescript, preset.typescript)

  return { ...vocabulary, architecture, naming, testing, text, tsdoc, typescript }
}

/**
 * The shape of the project: the tier's own, with every list and map the project passes joined to it.
 *
 * @param defaults - The architecture vocabulary of the tier.
 * @param extension - What the project passes for the group.
 * @returns The options the architecture rules read.
 */
export const extendArchitecture = (
  defaults: ArchitectureOptions,
  extension: GroupExtension<ArchitectureOptions> = {},
): ArchitectureOptions => {
  const architectureOptions: ArchitectureOptions = {
    alias: extension.alias ?? defaults.alias,
    suffixFreeFolders: extendList(defaults.suffixFreeFolders, extension.suffixFreeFolders),
    coLocatedTypeSuffixes: extendList(defaults.coLocatedTypeSuffixes, extension.coLocatedTypeSuffixes),
    suffixToFolder: extendMap(defaults.suffixToFolder, extension.suffixToFolder),
    folderlessSuffixes: extendList(defaults.folderlessSuffixes, extension.folderlessSuffixes),
    effectHooks: extendList(defaults.effectHooks, extension.effectHooks),
    definitionTimeDirectives: extendList(defaults.definitionTimeDirectives, extension.definitionTimeDirectives),
    baseFolders: extendList(defaults.baseFolders, extension.baseFolders),
    moduleContainers: extendList(defaults.moduleContainers, extension.moduleContainers),
    barrelledContainers: extendList(defaults.barrelledContainers, extension.barrelledContainers),
    mirrorFolders: extendList(defaults.mirrorFolders, extension.mirrorFolders),
    rootContexts: extendList(defaults.rootContexts, extension.rootContexts),
    executedFolders: extendList(defaults.executedFolders, extension.executedFolders),
    typeSuffixes: extendMap(defaults.typeSuffixes, extension.typeSuffixes),
    orderedSuffixes: extendList(defaults.orderedSuffixes, extension.orderedSuffixes),
    wholeArguments: extendList(defaults.wholeArguments, extension.wholeArguments),
    testFolder: extension.testFolder ?? defaults.testFolder,
    testingFolder: extension.testingFolder ?? defaults.testingFolder,
    mockFolder: extension.mockFolder ?? defaults.mockFolder,
    developmentSuffixes: extendList(defaults.developmentSuffixes, extension.developmentSuffixes),
    testKinds: extendList(defaults.testKinds, extension.testKinds),
    mirroringTestKinds: extendList(defaults.mirroringTestKinds, extension.mirroringTestKinds),
  }

  return architectureOptions
}

/**
 * The words of the project: the tier's own, with every list and map the project passes joined to it. The test folder
 * is the one `architecture` names, so it is added where the groups meet.
 *
 * @param defaults - The naming vocabulary of the tier.
 * @param extension - What the project passes for the group.
 * @returns The naming vocabulary.
 */
export const extendNaming = (
  defaults: Omit<NamingOptions, 'testFolder'>,
  extension: GroupExtension<Omit<NamingOptions, 'testFolder'>> = {},
): Omit<NamingOptions, 'testFolder'> => {
  const namingOptions: Omit<NamingOptions, 'testFolder'> = {
    roleNames: extendList(defaults.roleNames, extension.roleNames),
    forbiddenNames: extendList(defaults.forbiddenNames, extension.forbiddenNames),
    forbiddenWords: extendList(defaults.forbiddenWords, extension.forbiddenWords),
    verbParticiples: extendMap(defaults.verbParticiples, extension.verbParticiples),
    valueCases: extendList(defaults.valueCases, extension.valueCases),
    assertionMatchers: extendList(defaults.assertionMatchers, extension.assertionMatchers),
    resourceSuffixes: extendList(defaults.resourceSuffixes, extension.resourceSuffixes),
    resourceFreeStems: extendList(defaults.resourceFreeStems, extension.resourceFreeStems),
    resourceFreeMethods: extendList(defaults.resourceFreeMethods, extension.resourceFreeMethods),
  }

  return namingOptions
}

/**
 * The strings the product ships: the tier's patterns, with the project's joined to them.
 *
 * @param defaults - The text vocabulary of the tier.
 * @param extension - What the project passes for the group.
 * @returns The options the text rules read.
 */
export const extendText = (defaults: TextOptions, extension: GroupExtension<TextOptions> = {}): TextOptions => {
  const stringPatterns = extendList(defaults.stringPatterns, extension.stringPatterns)

  return { stringPatterns }
}

/**
 * The comments of a file: the tier's own, with what the project passes joined to it or replacing it.
 *
 * @param defaults - The tsdoc vocabulary of the tier.
 * @param extension - What the project passes for the group.
 * @returns The options the tsdoc rules read.
 */
export const extendTsdoc = (defaults: TsdocOptions, extension: GroupExtension<TsdocOptions> = {}): TsdocOptions => {
  const tsdocOptions: TsdocOptions = {
    commentWidth: extension.commentWidth ?? defaults.commentWidth,
    readsReleaseTags: extension.readsReleaseTags ?? defaults.readsReleaseTags,
    throwsConditions: extendList(defaults.throwsConditions, extension.throwsConditions),
    throwsTitleProperties: extendList(defaults.throwsTitleProperties, extension.throwsTitleProperties),
  }

  return tsdocOptions
}

/**
 * The constructs of the language: the tier's own, with what the project passes replacing it.
 *
 * @param defaults - The typescript vocabulary of the tier.
 * @param extension - What the project passes for the group.
 * @returns The options the typescript rules read.
 */
export const extendTypescript = (
  defaults: TypescriptOptions,
  extension: GroupExtension<TypescriptOptions> = {},
): TypescriptOptions => {
  const typeSuffix = extension.typeSuffix ?? defaults.typeSuffix

  return { typeSuffix }
}

/**
 * A default list with what a project passes for it: the items an array adds, each once and after the default's own,
 * or the list a function answers when it receives a copy of the default.
 *
 * @param defaults - The list the tier carries.
 * @param extension - What the project passes, and nothing when it passes nothing.
 * @returns The list the rules read.
 */
export const extendList = <TItem>(defaults: TItem[], extension: ListExtension<TItem> | undefined): TItem[] => {
  if (!extension) return defaults
  if (typeof extension === 'function') return extension([...defaults])
  const extended = [...new Set([...defaults, ...extension])]

  return extended
}

/**
 * A default map with what a project passes for it: the entries an object adds, a key the default carries replaced,
 * or the map a function answers when it receives a copy of the default.
 *
 * @param defaults - The map the tier carries.
 * @param extension - What the project passes, and nothing when it passes nothing.
 * @returns The map the rules read.
 */
export const extendMap = <TValue>(
  defaults: Record<string, TValue>,
  extension: MapExtension<TValue> | undefined,
): Record<string, TValue> => {
  if (!extension) return defaults
  if (typeof extension === 'function') return extension({ ...defaults })
  const extended = { ...defaults, ...extension }

  return extended
}
