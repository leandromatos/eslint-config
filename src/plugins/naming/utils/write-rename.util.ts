import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Writes the fixes that rename a variable at every place it is written: its declaration and its references, each
 * once. A reference that leaves as a shorthand property keeps the key, so `{ user }` becomes `{ user: createdUser }`.
 *
 * @param ruleFixer - What writes the fix.
 * @param identifiers - Where the name is written.
 * @param renamed - The name the rule proposes.
 * @param sourceCode - The source it is written in.
 * @returns The fixes, one per place the name is written.
 */
export const writeRename = (
  ruleFixer: TSESLint.RuleFixer,
  identifiers: (TSESTree.Identifier | TSESTree.JSXIdentifier)[],
  renamed: string,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix[] =>
  [...new Set(identifiers)].map(identifier => {
    const { parent } = identifier
    if (parent?.type === AST_NODE_TYPES.Property && parent.shorthand && parent.value === identifier)
      return ruleFixer.replaceText(parent, `${sourceCode.getText(parent.key)}: ${renamed}`)

    return ruleFixer.replaceTextRange([identifier.range[0], identifier.range[0] + identifier.name.length], renamed)
  })
