import {
  argumentPassedWhole,
  barrelPerDirectory,
  effectInHook,
  importBoundaries,
  knownDirectory,
  knownSuffix,
  methodOrder,
  mirroredSource,
  oneExportPerUtil,
  stepdownOrder,
  typesFolder,
  typeSuffix,
} from '../architecture/rules/index.js'
import { expectedPrefix, forbiddenName, methodResource, resultByVerb, valueCase } from '../naming/rules/index.js'
import { listGroupRules } from '../shared/utils/index.js'
import { describesSource, e2eOverHttp, specBlocks, typedFixture } from '../testing/rules/index.js'
import { stringPattern } from '../text/rules/index.js'
import {
  commentForm,
  descriptionSentence,
  documentedFunction,
  documentedType,
  linkSymbols,
  paramTag,
  returnsTag,
  throwsTag,
  typelessTag,
  unreadTag,
} from '../tsdoc/rules/index.js'
import type { OptionsGroup } from '../types/index.js'
import { composedConstant, constAssertionPair, repeatedLiteral } from '../typescript/rules/index.js'

/** The group the rules about the language itself read, which both lists of them name. */
const TYPESCRIPT_GROUP: OptionsGroup = 'typescript'

/**
 * Every rule this plugin carries, each with the name a configuration writes and the group of the options it reads.
 *
 * One plugin holds them all, so the subject a rule belongs to is what this list records rather than what the rule
 * name says. A rule reads one group and nothing else, which is what lets a project state a vocabulary per subject.
 */
export const RULES = [
  ...listGroupRules('architecture' satisfies OptionsGroup, {
    'argument-passed-whole': argumentPassedWhole,
    'barrel-per-directory': barrelPerDirectory,
    'effect-in-hook': effectInHook,
    'import-boundaries': importBoundaries,
    'known-directory': knownDirectory,
    'known-suffix': knownSuffix,
    'method-order': methodOrder,
    'mirrored-source': mirroredSource,
    'one-export-per-util': oneExportPerUtil,
    'stepdown-order': stepdownOrder,
    'type-suffix': typeSuffix,
    'types-folder': typesFolder,
  }),
  ...listGroupRules('naming' satisfies OptionsGroup, {
    'expected-prefix': expectedPrefix,
    'forbidden-name': forbiddenName,
    'method-resource': methodResource,
    'result-by-verb': resultByVerb,
    'value-case': valueCase,
  }),
  ...listGroupRules('testing' satisfies OptionsGroup, {
    'describes-source': describesSource,
    'e2e-over-http': e2eOverHttp,
    'spec-blocks': specBlocks,
    'typed-fixture': typedFixture,
  }),
  ...listGroupRules('text' satisfies OptionsGroup, {
    'string-pattern': stringPattern,
  }),
  ...listGroupRules('tsdoc' satisfies OptionsGroup, {
    'comment-form': commentForm,
    'description-sentence': descriptionSentence,
    'documented-function': documentedFunction,
    'documented-type': documentedType,
    'link-symbols': linkSymbols,
    'param-tag': paramTag,
    'returns-tag': returnsTag,
    'throws-tag': throwsTag,
    'typeless-tag': typelessTag,
    'unread-tag': unreadTag,
  }),
  ...listGroupRules(TYPESCRIPT_GROUP, {
    'const-assertion-pair': constAssertionPair,
  }),
]

/**
 * The rules that read a file of constants, which a configuration turns on for those files alone with `files`. They
 * read no group: `composed-constant` takes nothing, and `repeated-literal` takes the options of
 * `sonarjs/no-duplicate-string`.
 */
export const CONSTANT_RULES = listGroupRules(TYPESCRIPT_GROUP, {
  'composed-constant': composedConstant,
  'repeated-literal': repeatedLiteral,
})
