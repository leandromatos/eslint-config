import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES, TSESLint } from '@typescript-eslint/utils'

import { childNodesOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { TsdocRule, TsdocThrowsMessageId } from '../types/index.js'

const THROWS_TAG_REG_EXP = /@throws\s+(?:\{(?:@link\s+)?(\w+)\}|(\w+))/g
const INTERNAL_TITLE_REG_EXP = /^Error while (.+)\.$/

/** A `@throws` tag and the rest of its line, which opens with the type and goes on with the condition. */
const THROWS_LINE_REG_EXP = /@throws(?=\s|$)([^\n]*)/g

/** A type the way a tag names it: `unknown`, or an identifier, qualified or not, that opens with a capital. */
const TYPE_NAME_REG_EXP = /^(?:unknown(?![\w$])|[A-Z][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/

/** The type of a value a function throws on without knowing it, such as what a callback it calls throws. */
const UNKNOWN = 'unknown'

/** How the name of an error type ends, which tells a type from the first word of a sentence. */
const ERROR_NAME_REG_EXP = /(?:Error|Exception)$/

/** What stands in for an expression of a template literal, so a title written with one still reads as a pattern. */
const PLACEHOLDER = '{value}'

/**
 * A documented function names every exception it constructs, one `@throws` per type, as TSDoc
 * spells it: the type bare, then the condition. The signature says nothing about what a function
 * throws, so the tag is the only place a caller learns it without reading the body; a type in
 * braces is JSDoc, and a `{@link}` is a link, both of which the TSDoc parser reads as text.
 *
 * Every tag opens with that type. A tag that opens with a sentence names nothing a caller can
 * catch, and the hyphen a `@param` writes before its text has no place after the type. A word is
 * read as a type when its name ends the way an error's does, or when the file or the runtime
 * declares it.
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
      untypedThrows:
        '"@throws{{text}}" names no type. Open the tag with the type the function throws, then the condition.',
      hyphenatedThrows:
        '"@throws {{type}} -" carries the hyphen of a @param. TSDoc writes the condition right after the type.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const moduleNames = moduleNamesOf(sourceCode)
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
      for (const throwsLine of comment.value.matchAll(THROWS_LINE_REG_EXP)) judgeLine(throwsLine, comment)
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
    const judgeLine = (throwsLine: RegExpExecArray, comment: TSESTree.Comment): void => {
      /* v8 ignore next -- the pattern always captures the rest of the line, empty or not */
      const text = throwsLine[1] ?? ''
      const opening = text.trimStart()
      if (opening.startsWith('{')) return
      const type = TYPE_NAME_REG_EXP.exec(opening)?.[0]
      if (!type || !isTypeName(type, moduleNames)) {
        context.report({ node: comment, messageId: 'untypedThrows', data: { text: text.trimEnd() } })

        return
      }
      const rest = opening.slice(type.length).trimStart()
      if (rest !== '-' && !rest.startsWith('- ')) return
      const start = comment.range[0] + 2 + throwsLine.index
      const tag = throwsLine[0]
      const unhyphenated = tag.replace(new RegExp(`(${type})\\s+-\\s*`), '$1 ').trimEnd()
      context.report({
        node: comment,
        messageId: 'hyphenatedThrows',
        data: { type },
        fix: ruleFixer => ruleFixer.replaceTextRange([start, start + tag.length], unhyphenated),
      })
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
    /* What the try throws stops at its catch, unless the catch throws the error on, which is when it leaves. */
    if (current.type === AST_NODE_TYPES.TryStatement && current.handler) {
      if (rethrows(current.handler)) visit(current.block)
      visit(current.handler)
      if (current.finalizer) visit(current.finalizer)

      return
    }
    if (
      current.type === AST_NODE_TYPES.ThrowStatement &&
      current.argument.type === AST_NODE_TYPES.NewExpression &&
      current.argument.callee.type === AST_NODE_TYPES.Identifier
    )
      found.push({ node: current.argument, type: current.argument.callee.name, title: titleOf(current.argument) })
    for (const child of childNodesOf(current)) visit(child)
  }
  visit(node)

  return found
}

/**
 * Whether a catch throws the error it caught on, which lets what the try throws leave the function.
 *
 * @param catchClause - The catch of the try.
 * @returns Whether its body throws the caught error, as it was caught.
 */
const rethrows = (catchClause: TSESTree.CatchClause): boolean => {
  const { param } = catchClause
  if (param?.type !== AST_NODE_TYPES.Identifier) return false
  let isRethrown = false
  const visit = (current: TSESTree.Node): void => {
    if (isFunction(current)) return
    if (
      current.type === AST_NODE_TYPES.ThrowStatement &&
      current.argument.type === AST_NODE_TYPES.Identifier &&
      current.argument.name === param.name
    )
      isRethrown = true
    for (const child of childNodesOf(current)) visit(child)
  }
  visit(catchClause.body)

  return isRethrown
}

/**
 * Whether a node is a function, which is where a `throw` stops belonging to the function around it.
 *
 * @param node - The node.
 * @returns Whether it declares a function.
 */
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
  const lines = blockLinesOf(comment).split('\n')
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
 * The value of a comment written as a block, one line per paragraph, so a comment that fits on one line opens up to
 * take a tag below its summary.
 *
 * @param comment - The documentation comment.
 * @returns The value, with its closing line.
 */
const blockLinesOf = (comment: TSESTree.Comment): string => {
  if (comment.value.includes('\n')) return comment.value
  const indent = ' '.repeat(comment.loc.start.column)

  return `*\n${indent} * ${comment.value.replace(/^\*/, '').trim()}\n${indent} `
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

/**
 * The names the file declares or imports at its top, which a tag may name as the type thrown.
 *
 * @param sourceCode - The source the comments are written in.
 * @returns The names.
 */
const moduleNamesOf = (sourceCode: TSESLint.SourceCode): Set<string> => {
  const names = new Set<string>()
  /* v8 ignore next -- a file the parser read carries the scopes it analyzed */
  for (const scope of sourceCode.scopeManager?.scopes ?? [])
    if (scope.type === TSESLint.Scope.ScopeType.module) for (const name of scope.set.keys()) names.add(name)

  return names
}

/**
 * Whether the first word of a tag names a type: `unknown`, for a value thrown on without a type to name, one whose
 * name ends the way an error's does, or one the file or the runtime declares, such as `Error`.
 *
 * @param type - The word, qualified or not.
 * @param moduleNames - The names the file declares or imports at its top.
 * @returns Whether the word names a type.
 */
const isTypeName = (type: string, moduleNames: Set<string>): boolean => {
  const [head = ''] = type.split('.')
  if (type === UNKNOWN || ERROR_NAME_REG_EXP.test(type)) return true

  return moduleNames.has(head) || Object.hasOwn(globalThis, head)
}
