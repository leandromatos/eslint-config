import { expo, nestjs, nextjs, recommended, strict } from './configs/index.js'

/**
 * The five tiers, the way the ecosystem names them.
 *
 * {@link recommended} is the rules the ecosystem already wrote, by file type, and every repository takes it.
 * {@link strict} is all of that plus the import boundaries, this package's own rules and the documentation rules.
 * {@link nestjs}, {@link nextjs} and {@link expo} are all of strict plus the tree each framework writes.
 *
 * Each one is a function, and each takes what the one below it takes: a project states where it differs and the tier
 * carries it down, so the same field is written the same way whichever tier a project is on.
 */
export const configs = {
  recommended,
  strict,
  nestjs,
  nextjs,
  expo,
}

export * from './configs/constants/index.js'
export * from './configs/errors/index.js'
export type {
  AgnosticSuffix,
  ArchitectureExtension,
  Config,
  DictionarySuffix,
  ExpoOptions,
  FieldExtension,
  GroupExtension,
  ListExtension,
  MapExtension,
  NestjsOptions,
  NextjsOptions,
  Preset,
  RecommendedOptions,
  StrictOptions,
  TestingExtension,
  TestRunner,
  TierVocabulary,
} from './configs/index.js'
export type { ArchitectureOptions, WholeArgument } from './plugins/architecture/types/index.js'
export type { PluginOptions } from './plugins/index.js'
export { plugin } from './plugins/index.js'
export type {
  ForbiddenName,
  ForbiddenWord,
  ForbiddenWordPosition,
  NamingOptions,
  ValueCase,
  ValueCasing,
} from './plugins/naming/types/index.js'
export type { HttpTest, TestingOptions } from './plugins/testing/types/index.js'
export type { StringPattern, TextOptions } from './plugins/text/types/index.js'
export type { ThrowsCondition, TsdocOptions } from './plugins/tsdoc/types/index.js'
export type { TypescriptOptions } from './plugins/typescript/types/index.js'
