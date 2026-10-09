import type { TsdocOptions } from '../types/index.js'

/**
 * What a rule runs with when a configuration hands it nothing: the column Prettier wraps at by default, no tool that
 * reads the release tags, and no title the fix of a throw rewords.
 */
export const EMPTY_OPTIONS: TsdocOptions = {
  commentWidth: 80,
  readsReleaseTags: false,
  throwsConditions: [],
  throwsTitleProperties: [],
}

/** The tags TSDoc names a parameter, a returned value and a throw with. */
export const TSDOC_TAG = {
  param: 'param',
  returns: 'returns',
  throws: 'throws',
}

/** The other names JSDoc gives the tags of a parameter and of a returned value. */
const JSDOC_TAG_ALIASES = ['arg', 'argument', 'return']

/** The tags that write a parameter or a value back, which is where JSDoc puts a type in braces. */
export const TYPED_TAGS = new Set([TSDOC_TAG.param, TSDOC_TAG.returns, ...JSDOC_TAG_ALIASES])

/** The tags whose description reads as a sentence, beside the main description. */
export const SENTENCE_TAGS = new Set(Object.values(TSDOC_TAG))

/** What `documented-function` and `documented-type` report, the same words for a function and for a type. */
export const DOCUMENTED_MESSAGES = {
  undocumented: '"{{name}}" carries no documentation comment.',
  restatesName:
    'The summary of "{{name}}" rewrites its name. Say what the name cannot: a constraint, a reason, a consequence.',
}
