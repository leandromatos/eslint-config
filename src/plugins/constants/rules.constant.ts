import { argumentPassedWhole } from '../architecture/rules/argument-passed-whole.rule.js'
import { effectInHook } from '../architecture/rules/effect-in-hook.rule.js'
import { importBoundaries } from '../architecture/rules/import-boundaries.rule.js'
import { knownDirectory } from '../architecture/rules/known-directory.rule.js'
import { knownSuffix } from '../architecture/rules/known-suffix.rule.js'
import { methodOrder } from '../architecture/rules/method-order.rule.js'
import { mirroredSource } from '../architecture/rules/mirrored-source.rule.js'
import { oneExportPerUtil } from '../architecture/rules/one-export-per-util.rule.js'
import { reExportOnlyAtEntrypoint } from '../architecture/rules/re-export-only-at-entrypoint.rule.js'
import { stepdownOrder } from '../architecture/rules/stepdown-order.rule.js'
import { typeSuffix } from '../architecture/rules/type-suffix.rule.js'
import { typesFolder } from '../architecture/rules/types-folder.rule.js'
import { expectedPrefix } from '../naming/rules/expected-prefix.rule.js'
import { forbiddenName } from '../naming/rules/forbidden-name.rule.js'
import { methodResource } from '../naming/rules/method-resource.rule.js'
import { resultByVerb } from '../naming/rules/result-by-verb.rule.js'
import { valueCase } from '../naming/rules/value-case.rule.js'
import { listGroupRules } from '../shared/utils/list-group-rules.util.js'
import { describesSource } from '../testing/rules/describes-source.rule.js'
import { e2eOverHttp } from '../testing/rules/e2e-over-http.rule.js'
import { specBlocks } from '../testing/rules/spec-blocks.rule.js'
import { typedFixture } from '../testing/rules/typed-fixture.rule.js'
import { stringPattern } from '../text/rules/string-pattern.rule.js'
import { commentForm } from '../tsdoc/rules/comment-form.rule.js'
import { descriptionSentence } from '../tsdoc/rules/description-sentence.rule.js'
import { documentedFunction } from '../tsdoc/rules/documented-function.rule.js'
import { documentedType } from '../tsdoc/rules/documented-type.rule.js'
import { linkSymbols } from '../tsdoc/rules/link-symbols.rule.js'
import { paramTag } from '../tsdoc/rules/param-tag.rule.js'
import { returnsTag } from '../tsdoc/rules/returns-tag.rule.js'
import { throwsTag } from '../tsdoc/rules/throws-tag.rule.js'
import { typelessTag } from '../tsdoc/rules/typeless-tag.rule.js'
import { unreadTag } from '../tsdoc/rules/unread-tag.rule.js'
import type { OptionsGroup } from '../types/constants/rules.constant.type.js'
import { composedConstant } from '../typescript/rules/composed-constant.rule.js'
import { constAssertionPair } from '../typescript/rules/const-assertion-pair.rule.js'
import { repeatedLiteral } from '../typescript/rules/repeated-literal.rule.js'

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
    'effect-in-hook': effectInHook,
    'import-boundaries': importBoundaries,
    'known-directory': knownDirectory,
    'known-suffix': knownSuffix,
    'method-order': methodOrder,
    'mirrored-source': mirroredSource,
    'one-export-per-util': oneExportPerUtil,
    're-export-only-at-entrypoint': reExportOnlyAtEntrypoint,
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
