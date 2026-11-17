import { expo } from './configs/expo.config.js'
import { nestjs } from './configs/nestjs.config.js'
import { nextjs } from './configs/nextjs.config.js'
import { recommended } from './configs/recommended.config.js'
import { strict } from './configs/strict.config.js'

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

export * from './configs/constants/controlled-language.constant.js'
export * from './configs/constants/defaults.constant.js'
export * from './configs/constants/expo.constant.js'
export * from './configs/constants/nestjs.constant.js'
export * from './configs/constants/nextjs.constant.js'
export * from './configs/constants/recommended.constant.js'
export * from './configs/constants/sources.constant.js'
export * from './configs/constants/suffix-dictionary.constant.js'
export * from './configs/constants/text.constant.js'
export * from './configs/errors/folder-vocabulary.error.js'
export * from './configs/errors/missing-plugin-config.error.js'
export type { AgnosticSuffix, DictionarySuffix } from './configs/types/constants/suffix-dictionary.constant.type.js'
export type { ExpoOptions, TestRunner } from './configs/types/expo.config.type.js'
export type { NestjsOptions } from './configs/types/nestjs.config.type.js'
export type { NextjsOptions } from './configs/types/nextjs.config.type.js'
export type { Config, RecommendedOptions } from './configs/types/recommended.config.type.js'
export type {
  ArchitectureExtension,
  Preset,
  StrictOptions,
  TestingExtension,
  TierVocabulary,
} from './configs/types/strict.config.type.js'
export type {
  FieldExtension,
  GroupExtension,
  ListExtension,
  MapExtension,
} from './configs/types/utils/option-extension.util.type.js'
export type { ArchitectureOptions } from './plugins/architecture/types/architecture.type.js'
export type { WholeArgument } from './plugins/architecture/types/rules/argument-passed-whole.rule.type.js'
export { plugin } from './plugins/leandromatos.plugin.js'
export type { NamingOptions } from './plugins/naming/types/naming.type.js'
export type {
  ForbiddenName,
  ForbiddenWord,
  ForbiddenWordPosition,
} from './plugins/naming/types/rules/forbidden-name.rule.type.js'
export type { ValueCase, ValueCasing } from './plugins/naming/types/rules/value-case.rule.type.js'
export type { HttpTest } from './plugins/testing/types/rules/e2e-over-http.rule.type.js'
export type { TestingOptions } from './plugins/testing/types/testing.type.js'
export type { StringPattern } from './plugins/text/types/rules/string-pattern.rule.type.js'
export type { TextOptions } from './plugins/text/types/text.type.js'
export type { ThrowsCondition } from './plugins/tsdoc/types/rules/throws-tag.rule.type.js'
export type { TsdocOptions } from './plugins/tsdoc/types/tsdoc.type.js'
export type { PluginOptions } from './plugins/types/constants/rules.constant.type.js'
export type { TypescriptOptions } from './plugins/typescript/types/typescript.type.js'
