import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'

import { asList } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { TsdocRule, TsdocThrowsMessageId } from '../types/index.js'

const THROWS_TAG_REG_EXP = /@throws\s+(?:\{(?:@link\s+)?(\w+)\}|(\w+))/g
const INTERNAL_TITLE_REG_EXP = /^Error while (.+)\.$/

/** What stands in for an expression of a template literal, so a title written with one still reads as a pattern. */
const PLACEHOLDER = '{value}'

/**
 * A documented function names every exception it constructs, one `@throws` per type, as TSDoc
 * spells it: the type bare, then the condition. The signature says nothing about what a function
 * throws, so the tag is the only place a caller learns it without reading the body; a type in
 * braces is JSDoc, and a `{@link}` is a link, both of which the TSDoc parser reads as text.
 */
export const throwsTag: TsdocRule<TsdocThrowsMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A documented function carries a @throws tag for every exception type it constructs.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/throws-tag.md',
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      missingThrows: 'This function constructs {{type}} and its documentation carries no @throws for it.',
      bracedThrows:
        '"@throws {{{type}}}" is JSDoc, and "@throws {@link {{type}}}" a link. TSDoc spells it "@throws {{type}}".',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const judge = (node: TSESTree.FunctionLike): void => {
      const documented = documentedOf(node)
      const comment = documented && sourceCode.getCommentsBefore(documented).at(-1)
      if (!comment || comment.type !== AST_TOKEN_TYPES.Block || !comment.value.startsWith('*')) return
      const regExpExecArrays = [...comment.value.matchAll(THROWS_TAG_REG_EXP)]
      for (const regExpExecArray of regExpExecArrays.filter(regExpExecArray => regExpExecArray[1])) {
        /* v8 ignore next -- the group is what the pattern matched on */
        const type = regExpExecArray[1] ?? ''
        context.report({
          node: documented,
          messageId: 'bracedThrows',
          data: { type },
          fix: ruleFixer =>
            ruleFixer.replaceText(
              comment,
              `/*${comment.value.replace(`{${type}}`, type).replace(`{@link ${type}}`, type)}*/`,
            ),
        })
      }
      const declaredTypes = new Set(
        /* v8 ignore next -- the pattern matches one of the two groups */
        regExpExecArrays.map(regExpExecArray => regExpExecArray[1] ?? regExpExecArray[2] ?? ''),
      )
      for (const thrown of thrownOf(node)) {
        if (declaredTypes.has(thrown.type)) continue
        declaredTypes.add(thrown.type)
        context.report({
          node: thrown.node,
          messageId: 'missingThrows',
          data: { type: thrown.type },
          fix: ruleFixer => appendTag(ruleFixer, comment, thrown),
        })
      }
    }
    const listener: TSESLint.RuleListener = { ':function': judge }

    return listener
  },
}

/**
 * The declaration a documentation comment sits above: the method, or the statement holding the arrow.
 *
 * @param node - The function the rule judges.
 * @returns The declaration the comment documents, and null where nothing documents it.
 */
const documentedOf = (node: TSESTree.FunctionLike): TSESTree.Node | null => {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) return node
  const { parent } = node
  if (parent.type === AST_NODE_TYPES.MethodDefinition) return parent
  if (parent.type === AST_NODE_TYPES.VariableDeclarator) {
    const statement = parent.parent
    if (statement.parent.type === AST_NODE_TYPES.ExportNamedDeclaration) return statement.parent

    return statement
  }

  return null
}

/**
 * What a function constructs and throws in its own body, with the title each carries when it is a literal.
 *
 * @param node - The function the rule judges.
 * @returns One entry per exception the body throws.
 */
const thrownOf = (
  node: TSESTree.FunctionLike,
): { node: TSESTree.NewExpression; type: string; title: string | null }[] => {
  const found: { node: TSESTree.NewExpression; type: string; title: string | null }[] = []
  const visit = (current: TSESTree.Node): void => {
    if (current !== node && isFunction(current)) return
    if (
      current.type === AST_NODE_TYPES.ThrowStatement &&
      current.argument.type === AST_NODE_TYPES.NewExpression &&
      current.argument.callee.type === AST_NODE_TYPES.Identifier
    )
      found.push({ node: current.argument, type: current.argument.callee.name, title: titleOf(current.argument) })
    for (const child of childrenOf(current)) visit(child)
  }
  visit(node)

  return found
}

const isFunction = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.FunctionExpression ||
  node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionDeclaration

/**
 * The `title` a problem is constructed with, or the message of a plain error, when written as a literal.
 *
 * @param newExpression - The construction the body throws.
 * @returns The title, and null where it is not a literal.
 */
const titleOf = (newExpression: TSESTree.NewExpression): string | null => {
  const [argument] = newExpression.arguments
  if (argument?.type === AST_NODE_TYPES.Literal) return stringOf(argument.value)
  if (argument?.type === AST_NODE_TYPES.TemplateLiteral) return templateTextOf(argument)
  if (argument?.type !== AST_NODE_TYPES.ObjectExpression) return null
  const title = argument.properties.find(
    property =>
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      property.key.name === 'title',
  )
  if (title?.type !== AST_NODE_TYPES.Property || title.value.type !== AST_NODE_TYPES.Literal) return null

  return stringOf(title.value.value)
}

/**
 * The value when it is a string, and null for anything else a literal can hold.
 *
 * @param value - What the literal holds.
 * @returns The string.
 */
const stringOf = (value: unknown): string | null => {
  if (typeof value === 'string') return value

  return null
}

/**
 * The text of a template literal, with every expression standing in as a placeholder the pattern can name.
 *
 * @param templateLiteral - The literal the title is written as.
 * @returns The text.
 */
const templateTextOf = (templateLiteral: TSESTree.TemplateLiteral): string =>
  templateLiteral.quasis
    /* v8 ignore start -- a template the parser read carries its cooked text */
    /* v8 ignore next -- a template the parser read carries its cooked text */
    .map((templateElement, index) => `${templateElement.value.cooked ?? ''}${placeholderAt(index, templateLiteral)}`)
    .join('')
/* v8 ignore stop */

/**
 * The placeholder that stands for the expression after this element, and nothing after the last one.
 *
 * @param index - Where the element sits in the literal.
 * @param templateLiteral - The literal the title is written as.
 * @returns The placeholder.
 */
const placeholderAt = (index: number, templateLiteral: TSESTree.TemplateLiteral): string => {
  if (index < templateLiteral.expressions.length) return PLACEHOLDER

  return ''
}

/**
 * The AST nodes a node holds, whatever their keys.
 *
 * @param node - The node the walk reads.
 * @returns The nodes it holds.
 */
const childrenOf = (node: TSESTree.Node): TSESTree.Node[] =>
  Object.entries(node)
    .filter(([key]) => key !== 'parent')
    .flatMap(([, value]): unknown[] => asList(value))
    .filter((value): value is TSESTree.Node => typeof value === 'object' && value !== null && 'type' in value)

/**
 * Adds the tag as the last line of the comment, after a blank line when the comment carried
 * no tag yet. An internal error titled `Error while X.` is
 * thrown `When X fails.`; any other title is the condition as the caller will read it; a
 * problem built without a literal title gets the tag alone, for a hand to finish.
 *
 * @param ruleFixer - What writes the fix.
 * @param comment - The comment the tag is added to.
 * @param thrown - The exception the body throws, and the title it carries.
 * @returns The fix.
 */
const appendTag = (
  ruleFixer: TSESLint.RuleFixer,
  comment: TSESTree.Comment,
  thrown: { type: string; title: string | null },
): TSESLint.RuleFix => {
  const lines = comment.value.split('\n')
  /* v8 ignore next -- a block comment always carries its closing line */
  const closing = lines.pop() ?? ''
  const indent = closing.replace(/\S.*$/, '')
  /* v8 ignore next -- a documented function carries at least a summary above the tag */
  const last = lines.at(-1) ?? ''
  if (!/^\s*\*\s*(@|$)/.test(last)) lines.push(`${indent}*`)
  const condition = conditionOf(thrown.title)
  const tag = `${indent}* @throws ${thrown.type}${suffixed(condition)}`

  return ruleFixer.replaceText(comment, `/*${[...lines, tag, closing].join('\n')}*/`)
}

/**
 * What the tag says the throw happens under: an internal error's own wording, or the title as the caller reads it.
 *
 * @param title - The title the problem carries, when it carries one.
 * @returns The condition.
 */
const conditionOf = (title: string | null): string => {
  const internal = title && INTERNAL_TITLE_REG_EXP.exec(title)
  if (internal) return `When ${internal[1]} fails.`

  return title ?? ''
}

/**
 * The condition as it follows the type, and nothing where a problem carries no literal title.
 *
 * @param condition - What the tag says the throw happens under.
 * @returns The text that closes the tag.
 */
const suffixed = (condition: string): string => {
  if (!condition) return ''

  return ` ${condition}`
}
