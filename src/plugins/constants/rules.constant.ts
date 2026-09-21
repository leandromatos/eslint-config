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
import {
  expectedPrefix,
  forbiddenName,
  methodResource,
  resultByVerb,
  valueCase,
  variableByType,
} from '../naming/rules/index.js'
import { describesSource, e2eOverHttp, specBlocks, typedFixture } from '../testing/rules/index.js'
import { stringPattern } from '../text/rules/index.js'
import { commentForm, linkSymbols, publicSurface, throwsTag } from '../tsdoc/rules/index.js'
import type { OptionsGroup } from '../types/index.js'
import { constAssertionPair } from '../typescript/rules/index.js'

/**
 * Every rule this plugin carries, by the name a configuration writes, and the group of the options it reads.
 *
 * One plugin holds them all, so the subject a rule belongs to is what this map records rather than what the rule
 * name says. A rule reads one group and nothing else, which is what lets a project state a vocabulary per subject.
 */
export const RULES = {
  'argument-passed-whole': { rule: argumentPassedWhole, group: 'architecture' },
  'barrel-per-directory': { rule: barrelPerDirectory, group: 'architecture' },
  'effect-in-hook': { rule: effectInHook, group: 'architecture' },
  'import-boundaries': { rule: importBoundaries, group: 'architecture' },
  'known-directory': { rule: knownDirectory, group: 'architecture' },
  'known-suffix': { rule: knownSuffix, group: 'architecture' },
  'method-order': { rule: methodOrder, group: 'architecture' },
  'mirrored-source': { rule: mirroredSource, group: 'architecture' },
  'one-export-per-util': { rule: oneExportPerUtil, group: 'architecture' },
  'stepdown-order': { rule: stepdownOrder, group: 'architecture' },
  'type-suffix': { rule: typeSuffix, group: 'architecture' },
  'types-folder': { rule: typesFolder, group: 'architecture' },
  'expected-prefix': { rule: expectedPrefix, group: 'naming' },
  'forbidden-name': { rule: forbiddenName, group: 'naming' },
  'method-resource': { rule: methodResource, group: 'naming' },
  'result-by-verb': { rule: resultByVerb, group: 'naming' },
  'value-case': { rule: valueCase, group: 'naming' },
  'variable-by-type': { rule: variableByType, group: 'naming' },
  'comment-form': { rule: commentForm, group: 'tsdoc' },
  'link-symbols': { rule: linkSymbols, group: 'tsdoc' },
  'public-surface': { rule: publicSurface, group: 'tsdoc' },
  'throws-tag': { rule: throwsTag, group: 'tsdoc' },
  'describes-source': { rule: describesSource, group: 'testing' },
  'e2e-over-http': { rule: e2eOverHttp, group: 'testing' },
  'spec-blocks': { rule: specBlocks, group: 'testing' },
  'typed-fixture': { rule: typedFixture, group: 'testing' },
  'string-pattern': { rule: stringPattern, group: 'text' },
  'const-assertion-pair': { rule: constAssertionPair, group: 'typescript' },
} as const satisfies Record<string, { rule: unknown; group: OptionsGroup }>
