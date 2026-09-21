import type { ParserServicesWithTypeInformation, TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import type ts from 'typescript'

import { isMethod, isPublic, locate, memberNameOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DocumentedPublicSurfaceMessageId, TsdocRule } from '../types/index.js'

/** Words a summary may spend without saying anything the name did not. */
const FILLER = new Set([
  'a',
  'an',
  'the',
  'of',
  'to',
  'for',
  'and',
  'or',
  'by',
  'with',
  'in',
  'on',
  'from',
  'one',
  'all',
])

/**
 * Every public method and every exported function carries a documentation comment, and the
 * comment says what the name cannot. Whether a name "already answers" is a judgment two authors
 * make differently, so the presence is not left to it; what is left to the author is the text,
 * and a text that only rewrites the name into a sentence is reported, because it costs a read
 * and goes stale on the next rename. A method an interface or a base class declares is documented
 * there, so it is not asked for again. A name a framework calls rather than a caller imports is left out through
 * `frameworkSymbols`: the framework's own documentation says what it is, and the same sentence written once per
 * page says nothing.
 */
export const publicSurface: TsdocRule<DocumentedPublicSurfaceMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A public method or exported function carries a comment that says what its name cannot.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/public-surface.md',
      dialects: ['TypeScript'],
    },
    messages: {
      undocumented: '"{{name}}" is public and carries no documentation comment.',
      restatesName:
        'The summary of "{{name}}" rewrites its name. Say what the name cannot: a constraint, a reason, a consequence.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ testFolder, frameworkSymbols }] = context.options
    if (!where || where.segments.includes(testFolder)) return {}
    const { sourceCode } = context
    const parserServicesWithTypeInformation = ESLintUtils.getParserServices(context)
    const typeChecker = parserServicesWithTypeInformation.program.getTypeChecker()
    const judge = (documented: TSESTree.Node, name: string): void => {
      if (frameworkSymbols.includes(name)) return
      const comment = sourceCode.getCommentsBefore(documented).at(-1)
      if (!comment || comment.type !== AST_TOKEN_TYPES.Block || !comment.value.startsWith('*')) {
        context.report({ node: documented, messageId: 'undocumented', data: { name } })

        return
      }
      if (restatesName(summaryOf(comment.value), name))
        context.report({ node: comment, messageId: 'restatesName', data: { name } })
    }
    const listener: TSESLint.RuleListener = {
      MethodDefinition: node => {
        if (!isMethod(node) || !isPublic(node) || node.override) return
        if (implementsContract(node, parserServicesWithTypeInformation, typeChecker)) return
        judge(node, memberNameOf(node))
      },
      ExportNamedDeclaration: node => {
        const { declaration } = node
        if (declaration?.type === AST_NODE_TYPES.FunctionDeclaration && declaration.id) judge(node, declaration.id.name)
        if (declaration?.type !== AST_NODE_TYPES.VariableDeclaration) return
        for (const declarator of declaration.declarations) {
          if (declarator.id.type !== AST_NODE_TYPES.Identifier) continue
          if (
            declarator.init?.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            declarator.init?.type !== AST_NODE_TYPES.FunctionExpression
          )
            continue
          judge(node, declarator.id.name)
        }
      },
    }

    return listener
  },
}

/**
 * Whether the method is one an implemented interface or an extended class declares: the contract
 * is where that method is documented, and a comment here would repeat or contradict it.
 *
 * @param node - The method the rule judges.
 * @param parserServicesWithTypeInformations - What maps a node of the syntax tree onto the program.
 * @param typeChecker - What resolves a type of the program.
 * @returns Whether a contract declares it.
 */
const implementsContract = (
  node: TSESTree.MethodDefinition,
  parserServicesWithTypeInformations: ParserServicesWithTypeInformation,
  typeChecker: ts.TypeChecker,
): boolean => {
  const classNode = node.parent.parent
  /* v8 ignore next -- a method is declared in a class, which is what holds its body */
  if (classNode.type !== AST_NODE_TYPES.ClassDeclaration && classNode.type !== AST_NODE_TYPES.ClassExpression)
    /* v8 ignore next -- a method is declared in a class, which is what holds its body */
    return false
  const name = memberNameOf(node)
  const heritage = [...classNode.implements, ...superClassesOf(classNode)]

  return heritage.some(clause => {
    const type = parserServicesWithTypeInformations.getTypeAtLocation(declaredTypeOf(clause))
    const symbols = typeChecker.getPropertiesOfType(type)

    return symbols.some(symbol => symbol.name === name)
  })
}

/**
 * What the class extends, as a list, so an extended class and an implemented interface are read the same way.
 *
 * @param classNode - The class the member belongs to.
 * @returns The extended class, as a list of one, and none for a class extending nothing.
 */
const superClassesOf = (classNode: TSESTree.ClassDeclaration | TSESTree.ClassExpression): TSESTree.Expression[] => {
  if (!classNode.superClass) return []

  return [classNode.superClass]
}

/**
 * The node the checker reads the clause's type from: what an implements clause names, or the clause itself.
 *
 * @param clause - One clause of the class's heritage.
 * @returns The node the type is read from.
 */
const declaredTypeOf = (clause: TSESTree.TSClassImplements | TSESTree.Expression): TSESTree.Node => {
  if (clause.type === AST_NODE_TYPES.TSClassImplements) return clause.expression

  return clause
}

/**
 * The first sentence of a comment, without the asterisks.
 *
 * @param value - The comment as the parser read it.
 * @returns The summary.
 */
const summaryOf = (value: string): string => {
  const text = value
    .split('\n')
    .map(line => line.replace(/^\s*\*+\s?/, ''))
    .join(' ')
    .trim()
  const end = text.search(/[.!?](\s|$)/)
  if (end < 0) return text

  return text.slice(0, end)
}

/**
 * Whether every word of the summary is a word of the name, once the filler is dropped.
 *
 * @param summary - The first sentence of the comment.
 * @param name - The name it documents.
 * @returns Whether the summary only rewrites the name.
 */
const restatesName = (summary: string, name: string): boolean => {
  const nameWords = new Set(wordsOf(name))
  const said = wordsOf(summary).filter(word => !FILLER.has(word))

  return said.length > 0 && said.every(word => nameWords.has(word) || nameWords.has(stem(word)))
}

/**
 * The lowercase words of a camel-case name or a sentence.
 *
 * @param text - The name or the sentence.
 * @returns The words.
 */
const wordsOf = (text: string): string[] =>
  /* v8 ignore start -- a name is made of words, so the pattern always matches one */
  /* v8 ignore next -- a name is made of words, so the pattern always matches one */
  (text.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/g) ?? []).map(word => word.toLowerCase())
/* v8 ignore stop */

/**
 * `find` for `finds`, `create` for `creates`, `delete` for `deletes`, `retrieve` for `retrieves`.
 *
 * @param word - The word as the summary spells it.
 * @returns The word without its verb ending.
 */
const stem = (word: string): string => word.replace(/(es|s)$/, '')
