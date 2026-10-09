import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, isFunctionNode, readChildNodes } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ThrownException, ThrowsCondition, ThrowsTagMessageId, TsdocRule } from '../types/index.js'
import { isDocComment } from '../utils/index.js'

/** A `@throws` tag and the type it opens with: in braces or as a link, as the first group, or bare, as the second. */
const THROWS_TAG_REG_EXP = /@throws\s+(?:\{(?:@link\s+)?(\w+)\}|(\w+))/g

/** A `@throws` tag and the rest of its line, which opens with the type and goes on with the condition. */
const THROWS_LINE_REG_EXP = /@throws(?=\s|$)([^\n]*)/g

/**
 * A type the way a tag names it: an identifier that opens with a capital, qualified or not, or one qualified by a
 * namespace, whatever the case of the namespace, as `errors.InvalidGrant`.
 */
const TYPE_NAME_REG_EXP =
  /^(?:unknown(?![\w$])|[A-Z][\w$]*(?:\.[A-Za-z_$][\w$]*)*|[a-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)/

/** The type of a value a function throws on without knowing it, such as what a callback it calls throws. */
const UNKNOWN = 'unknown'

/** How the name of an error type ends, which tells a type from the first word of a sentence. */
const ERROR_NAME_REG_EXP = /(?:Error|Exception)$/

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
export const throwsTag: TsdocRule<ThrowsTagMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A documented function carries a @throws tag for every exception type it constructs.',
      url: buildRuleDocsUrl('tsdoc', 'throws-tag'),
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
    const [{ throwsConditions, throwsTitleProperties }] = context.options
    const moduleNames = listModuleNames(sourceCode)
    const judge = (node: TSESTree.FunctionLike): void => {
      const documented = findDocumentedNode(node)
      const comment = documented && sourceCode.getCommentsBefore(documented).at(-1)
      if (!comment || !isDocComment(comment)) return
      const throwsTags = [...comment.value.matchAll(THROWS_TAG_REG_EXP)]
      for (const [, type] of throwsTags) {
        if (!type) continue
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
      const declaredTypes = new Set(throwsTags.flatMap(throwsTag => throwsTag.slice(1, 3).filter(Boolean)))
      for (const thrown of listThrownExceptions(node, throwsTitleProperties, sourceCode)) {
        if (declaredTypes.has(thrown.type)) continue
        declaredTypes.add(thrown.type)
        context.report({
          node: thrown.node,
          messageId: 'missingThrows',
          data: { type: thrown.type },
          fix: ruleFixer => appendThrowsTag(ruleFixer, comment, thrown, throwsConditions),
        })
      }
    }
    const judgeLine = (throwsLine: RegExpExecArray, comment: TSESTree.Comment): void => {
      const text = throwsLine.slice(1, 2).join('')
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
const findDocumentedNode = (node: TSESTree.FunctionLike): TSESTree.Node | null => {
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
 * Lists what a function constructs and throws in its own body, with the title each carries when it is a literal.
 *
 * @param node - The function the rule judges.
 * @param titleProperties - The properties of the first argument a title is read from.
 * @param sourceCode - The source, to spell an expression a template title carries.
 * @returns One entry per exception the body throws.
 */
const listThrownExceptions = (
  node: TSESTree.FunctionLike,
  titleProperties: string[],
  sourceCode: TSESLint.SourceCode,
): ThrownException[] => {
  const found: ThrownException[] = []
  const visit = (current: TSESTree.Node): void => {
    if (current !== node && isFunctionNode(current)) return
    // What the try throws stops at its catch, unless the catch throws the error on, which is when it leaves.
    if (current.type === AST_NODE_TYPES.TryStatement && current.handler) {
      if (isRethrowing(current.handler)) visit(current.block)
      visit(current.handler)
      if (current.finalizer) visit(current.finalizer)

      return
    }
    if (
      current.type === AST_NODE_TYPES.ThrowStatement &&
      current.argument.type === AST_NODE_TYPES.NewExpression &&
      current.argument.callee.type === AST_NODE_TYPES.Identifier
    )
      found.push({
        node: current.argument,
        type: current.argument.callee.name,
        title: readExceptionTitle(current.argument, titleProperties, sourceCode),
      })
    for (const child of readChildNodes(current)) visit(child)
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
const isRethrowing = (catchClause: TSESTree.CatchClause): boolean => {
  const { param } = catchClause
  if (param?.type !== AST_NODE_TYPES.Identifier) return false
  let isRethrown = false
  const visit = (current: TSESTree.Node): void => {
    if (isFunctionNode(current)) return
    if (
      current.type === AST_NODE_TYPES.ThrowStatement &&
      current.argument.type === AST_NODE_TYPES.Identifier &&
      current.argument.name === param.name
    )
      isRethrown = true
    for (const child of readChildNodes(current)) visit(child)
  }
  visit(catchClause.body)

  return isRethrown
}

/**
 * Reads the title an exception is constructed with, when written as a literal: the message of a plain error, or one
 * of the properties the options name on the object it is handed, such as the `title` of a problem.
 *
 * @param newExpression - The construction the body throws.
 * @param titleProperties - The properties of the first argument a title is read from.
 * @param sourceCode - The source, to spell an expression a template carries.
 * @returns The title, and null where it is not a literal.
 */
const readExceptionTitle = (
  newExpression: TSESTree.NewExpression,
  titleProperties: string[],
  sourceCode: TSESLint.SourceCode,
): string | null => {
  const [argument] = newExpression.arguments
  if (argument?.type === AST_NODE_TYPES.Literal) return readString(argument.value)
  if (argument?.type === AST_NODE_TYPES.TemplateLiteral) return readTemplateText(argument, sourceCode)
  if (argument?.type !== AST_NODE_TYPES.ObjectExpression) return null
  const title = argument.properties.find(
    property =>
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      titleProperties.includes(property.key.name),
  )
  if (title?.type !== AST_NODE_TYPES.Property || title.value.type !== AST_NODE_TYPES.Literal) return null

  return readString(title.value.value)
}

/**
 * The value when it is a string, and null for anything else a literal can hold.
 *
 * @param value - What the literal holds.
 * @returns The string.
 */
const readString = (value: unknown): string | null => {
  if (typeof value === 'string') return value

  return null
}

/**
 * Reads the text of a template literal, with every expression it carries spelled as a code span: a brace written into
 * a comment opens an inline tag TSDoc would refuse, and a span keeps the expression readable.
 *
 * @param templateLiteral - The literal the title is written as.
 * @param sourceCode - The source, to spell each expression as written.
 * @returns The text.
 */
const readTemplateText = (templateLiteral: TSESTree.TemplateLiteral, sourceCode: TSESLint.SourceCode): string => {
  const expressions = templateLiteral.expressions.map(expression => `\`${sourceCode.getText(expression)}\``)

  return templateLiteral.quasis
    .map((templateElement, index) => `${templateElement.value.raw}${expressions.slice(index, index + 1).join('')}`)
    .join('')
}

/**
 * Appends the tag as the last line of the comment, after a blank line when the comment carried no tag yet. A title
 * that matches one of the conditions the options give is worded by it; any other title is the condition as the caller
 * reads it; an exception built without a literal title gets the tag alone, for a hand to finish.
 *
 * @param ruleFixer - What writes the fix.
 * @param comment - The comment the tag is added to.
 * @param thrown - The exception the body throws, and the title it carries.
 * @param throwsConditions - How a title is worded into a condition.
 * @returns The fix.
 */
const appendThrowsTag = (
  ruleFixer: TSESLint.RuleFixer,
  comment: TSESTree.Comment,
  thrown: ThrownException,
  throwsConditions: ThrowsCondition[],
): TSESLint.RuleFix => {
  const lines = expandToBlockLines(comment).split('\n')
  const body = lines.slice(0, -1)
  const closing = lines.slice(-1).join('')
  const indent = closing.replace(/\S.*$/, '')
  const blank = selectBlankLine(body.slice(-1).join(''), indent)
  const condition = wordThrowsCondition(thrown.title, throwsConditions)
  const tag = `${indent}* @throws ${thrown.type}${prefixCondition(condition)}`

  return ruleFixer.replaceText(comment, `/*${[...body, ...blank, tag, closing].join('\n')}*/`)
}

/**
 * The value of a comment written as a block, one line per paragraph, so a comment that fits on one line opens up to
 * take a tag below its summary.
 *
 * @param comment - The documentation comment.
 * @returns The value, with its closing line.
 */
const expandToBlockLines = (comment: TSESTree.Comment): string => {
  if (comment.value.includes('\n')) return comment.value
  const indent = ' '.repeat(comment.loc.start.column)

  return `*\n${indent} * ${comment.value.replace(/^\*/, '').trim()}\n${indent} `
}

/**
 * Selects the blank line that separates the first tag from the summary: none when the comment already ends with a
 * tag or a blank line.
 *
 * @param last - The last line of the comment above its closing line.
 * @param indent - The indentation of the comment.
 * @returns The blank line, and none where the comment needs none.
 */
const selectBlankLine = (last: string, indent: string): string[] => {
  if (/^\s*\*\s*(@|$)/.test(last)) return []

  return [`${indent}*`]
}

/**
 * Words the condition the tag states: the wording of the first condition of the options the title matches, or the
 * title as the caller reads it.
 *
 * @param title - The title the exception carries, when it carries one.
 * @param throwsConditions - How a title is worded into a condition.
 * @returns The condition, and nothing for an exception that carries no title.
 */
const wordThrowsCondition = (title: string | null, throwsConditions: ThrowsCondition[]): string => {
  if (title === null) return ''
  const matching = throwsConditions.find(throwsCondition => new RegExp(throwsCondition.title).test(title))
  if (!matching) return title

  return title.replace(new RegExp(matching.title), matching.condition)
}

/**
 * The condition as it follows the type, and nothing where a problem carries no literal title.
 *
 * @param condition - What the tag says the throw happens under.
 * @returns The text that closes the tag.
 */
const prefixCondition = (condition: string): string => {
  if (!condition) return ''

  return ` ${condition}`
}

/**
 * The names a tag may name as the type thrown: what the file declares or imports at its top, and the globals the
 * configuration declares for the environment the project runs in, which is not the one the linter runs in.
 *
 * @param sourceCode - The source the comments are written in.
 * @returns The names.
 */
const listModuleNames = (sourceCode: TSESLint.SourceCode): Set<string> => {
  const globalScope = sourceCode.getScope(sourceCode.ast)
  const moduleScopes = globalScope.childScopes.filter(scope => scope.type === TSESLint.Scope.ScopeType.module)
  const names = new Set([globalScope, ...moduleScopes].flatMap(scope => [...scope.set.keys()]))

  return names
}

/**
 * Whether the first word of a tag names a type: `unknown`, for a value thrown on without a type to name, one whose
 * name ends the way an error's does, a capitalized member of a namespace, as `errors.InvalidGrant`, or one the file or
 * the configured environment declares, such as `Error`.
 *
 * @param type - The word, qualified or not.
 * @param moduleNames - The names the file declares or imports at its top.
 * @returns Whether the word names a type.
 */
const isTypeName = (type: string, moduleNames: Set<string>): boolean => {
  const [head = ''] = type.split('.')
  if (type === UNKNOWN || ERROR_NAME_REG_EXP.test(type)) return true
  // A name a namespace qualifies is a member of that namespace, and one that opens with a capital is a type of it.
  if (/\.[A-Z][\w$]*$/.test(type)) return true

  return moduleNames.has(head)
}
