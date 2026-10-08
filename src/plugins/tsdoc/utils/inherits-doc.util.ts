import type { DocBlock } from '../types/index.js'

/**
 * Whether a comment takes its documentation from a declaration elsewhere, through a block `@inheritDoc`: the
 * parameters and the value are documented there.
 *
 * @param docBlock - The comment.
 * @returns Whether it inherits its documentation.
 */
export const inheritsDoc = (docBlock: DocBlock): boolean =>
  docBlock.tags.some(docBlockTag => docBlockTag.tag.toLowerCase() === 'inheritdoc')
