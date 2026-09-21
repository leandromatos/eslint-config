import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES, TSESLint } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { TsdocLinkSymbolsMessageId, TsdocRule } from '../types/index.js'

const BACKTICKED_WORD_REG_EXP = /`([A-Za-z_$][\w$]*)`/g
const LINK_REG_EXP = /\{@link\s+([^}|\s]+)/g
const URL_OR_PACKAGE_REG_EXP = /^(?:https?:|[@\w-]+\/|[\w-]+#)/

/**
 * A name a reader could jump to is written so the tooling lets them: a symbol in scope goes in a link tag, and code
 * font is for what is not a symbol, a literal, a key, a path. Written
 * both ways, the same name reads as two things; and a link whose target resolves to nothing is a
 * promise the page cannot keep.
 */
export const linkSymbols: TsdocRule<TsdocLinkSymbolsMessageId> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'A symbol in scope is linked with {@link}, never set in backticks; a link resolves.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/link-symbols.md',
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      symbolInBackticks: '"{{name}}" is a symbol in scope. Link it: {@link {{name}}}.',
      linkToNothing: '"{@link {{name}}}" resolves to nothing in scope.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    if (!locate(context)) return {}
    const { sourceCode } = context
    const classBodies: TSESTree.ClassBody[] = []
    const listener: TSESLint.RuleListener = {
      ClassBody: classBody => {
        classBodies.push(classBody)
      },
      'Program:exit': () => {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type !== AST_TOKEN_TYPES.Block || !comment.value.startsWith('*')) continue
          const resolves = resolverFor(comment, sourceCode, classBodies)
          for (const regExpExecArray of comment.value.matchAll(BACKTICKED_WORD_REG_EXP)) {
            /* v8 ignore next -- the group is what the pattern matched on */
            const name = regExpExecArray[1] ?? ''
            if (!resolves(name)) continue
            const start = comment.range[0] + 2 + regExpExecArray.index
            context.report({
              node: comment,
              messageId: 'symbolInBackticks',
              data: { name },
              fix: ruleFixer => ruleFixer.replaceTextRange([start, start + name.length + 2], `{@link ${name}}`),
            })
          }
          for (const regExpExecArray of comment.value.matchAll(LINK_REG_EXP)) {
            /* v8 ignore next -- the group is what the pattern matched on */
            const target = regExpExecArray[1] ?? ''
            if (URL_OR_PACKAGE_REG_EXP.test(target)) continue
            const [head] = target.split('.')
            /* v8 ignore next -- a target split on its dots always has a head */
            if (resolves(head ?? '')) continue
            context.report({ node: comment, messageId: 'linkToNothing', data: { name: target } })
          }
        }
      },
    }

    return listener
  },
}

/**
 * Whether a name is reachable from where the comment sits: a binding of the innermost scope
 * enclosing it, its parents included, or a member of the innermost class it is inside. The global
 * scope is left out: `Partial` and `undefined` are words, not symbols a reader jumps to.
 *
 * @param comment - The comment the rule reads.
 * @param sourceCode - The source it is written in.
 * @param classBodies - The class bodies of the file, in the order they open.
 * @returns What answers whether a name resolves.
 */
const resolverFor = (
  comment: TSESTree.Comment,
  sourceCode: TSESLint.SourceCode,
  classBodies: TSESTree.ClassBody[],
): ((name: string) => boolean) => {
  const [at] = comment.range
  const scopes = sourceCode.scopeManager?.scopes.filter(
    candidateScope => candidateScope.type !== TSESLint.Scope.ScopeType.global,
  )
  /*
   * A comment above the first statement sits before the program itself, which opens at its first token, so no scope
   * encloses it. What it names is what the file holds, which is the outermost scope.
   */
  const scope =
    scopes
      ?.filter(candidateScope => encloses(candidateScope.block, at))
      .sort((leftScope, rightScope) => rightScope.block.range[0] - leftScope.block.range[0])[0] ?? scopes?.[0]
  const classBody = classBodies
    /* v8 ignore start -- the class bodies were filtered by the comment they enclose */
    .filter(classBody => encloses(classBody, at))
    /* v8 ignore next -- the class bodies were filtered by the comment they enclose */
    .sort((leftClassBody, rightClassBody) => rightClassBody.range[0] - leftClassBody.range[0])[0]
  /* v8 ignore stop */
  const members = classMemberNamesOf(classBody)

  /* v8 ignore next -- a file the parser read has a scope of its own */
  return name => members.has(name) || isBound(scope ?? null, name)
}

const encloses = (node: TSESTree.Node, at: number): boolean => node.range[0] <= at && at < node.range[1]

/**
 * The names the enclosing class declares, and none where the comment sits in no class.
 *
 * @param classBody - The body of the class the comment sits in, when it sits in one.
 * @returns The names.
 */
const classMemberNamesOf = (classBody: TSESTree.ClassBody | undefined): Set<string> => {
  if (!classBody) return new Set<string>()

  return memberNamesOf(classBody)
}

/**
 * The names of the members of a class.
 *
 * @param classBody - The body of the class.
 * @returns The names.
 */
const memberNamesOf = (classBody: TSESTree.ClassBody): Set<string> => {
  const names = new Set<string>()
  for (const member of classBody.body)
    if ('key' in member && member.key.type === AST_NODE_TYPES.Identifier) names.add(member.key.name)

  return names
}

const isBound = (scope: TSESLint.Scope.Scope | null, name: string): boolean => {
  for (let current = scope; current && current.type !== TSESLint.Scope.ScopeType.global; current = current.upper)
    if (current.set.has(name)) return true

  return false
}
