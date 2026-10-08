import type { DocBlock } from '../types/index.js'

/** The inline tag TSDoc copies a declaration's documentation with, with or without the reference it copies from. */
const INHERIT_DOC_REG_EXP = /\{@inheritDoc(?:\s[^}]*)?\}/i

/**
 * Whether a comment takes its documentation from a declaration elsewhere: the summary, the parameters and the value
 * are documented there.
 *
 * TSDoc defines `{@inheritDoc}` as an inline tag, which is the form read here. A block `@inheritDoc` is read too, so
 * the rules that ask for text leave it to `tsdoc/syntax`, which reports the missing braces.
 *
 * @param docBlock - The comment.
 * @returns Whether it inherits its documentation.
 */
export const inheritsDoc = (docBlock: DocBlock): boolean =>
  INHERIT_DOC_REG_EXP.test(docBlock.description) ||
  docBlock.tags.some(docBlockTag => docBlockTag.tag.toLowerCase() === 'inheritdoc')
