import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES, TSESLint } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { TsdocLinkSymbolsMessageId, TsdocRule } from '../types/index.js'

const BACKTICKED_WORD_REG_EXP = /`([A-Za-z_$][\w$]*)`/g
const LINK_REG_EXP = /\{@link\s+([^}|\s]+)/g
const URL_OR_PACKAGE_REG_EXP = /^(?:https?:|[@\w-]+\/|[\w-]+#)/

/**
 * The names TSDoc reads as selectors in a reference, which a link only names in quotes, as `Owner."type"`.
 *
 * @see {@link https://tsdoc.org/pages/spec/overview/ | TSDoc}
 */
const SYSTEM_SELECTORS = new Set([
  'class',
  'constructor',
  'enum',
  'function',
  'instance',
  'interface',
  'namespace',
  'static',
  'type',
  'variable',
])

/**
 * A name a reader could jump to is written so the tooling lets them: a symbol in scope goes in a link tag, and code
 * font is for what is not a symbol, a literal, a key, a path. Written
 * both ways, the same name reads as two things; and a link whose target resolves to nothing is a
 * promise the page cannot keep.
 *
 * A name TSDoc keeps as a selector, such as `type` or `class`, is linked in quotes, and a member of the class the
 * comment sits in is qualified by that class, as `Owner."type"`.
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
      symbolInBackticks: '"{{name}}" is a symbol in scope. Link it: {@link {{target}}}.',
      linkToNothing: '"{@link {{name}}}" resolves to nothing in scope.',
      unquotedSelector: '"{{name}}" is a TSDoc selector, so a link names it in quotes: {@link {{target}}}.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const classBodies: TSESTree.ClassBody[] = []
    const listener: TSESLint.RuleListener = {
      ClassBody: classBody => {
        classBodies.push(classBody)
      },
      'Program:exit': () => {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type !== AST_TOKEN_TYPES.Block || !comment.value.startsWith('*')) continue
          const classBody = enclosingClassBodyOf(comment, classBodies)
          const resolves = resolverFor(comment, sourceCode, classBody)
          const targetOf = targetFor(classBody)
          for (const regExpExecArray of comment.value.matchAll(BACKTICKED_WORD_REG_EXP)) {
            /* v8 ignore next -- the group is what the pattern matched on */
            const name = regExpExecArray[1] ?? ''
            const target = targetOf(name)
            if (!resolves(name) || !target) continue
            const start = comment.range[0] + 2 + regExpExecArray.index
            context.report({
              node: comment,
              messageId: 'symbolInBackticks',
              data: { name, target },
              fix: ruleFixer => ruleFixer.replaceTextRange([start, start + name.length + 2], `{@link ${target}}`),
            })
          }
          for (const regExpExecArray of comment.value.matchAll(LINK_REG_EXP)) {
            /* v8 ignore next -- the group is what the pattern matched on */
            const reference = regExpExecArray[1] ?? ''
            if (URL_OR_PACKAGE_REG_EXP.test(reference)) continue
            const segments = reference.split('.')
            /* v8 ignore next -- a reference split on its dots always has a head */
            const head = unquoted(segments[0] ?? '')
            if (!resolves(head)) {
              context.report({ node: comment, messageId: 'linkToNothing', data: { name: reference } })
              continue
            }
            const selector = segments.find(segment => SYSTEM_SELECTORS.has(segment))
            if (!selector) continue
            const target = quotedReference(segments, targetOf)
            const start = comment.range[0] + 2 + regExpExecArray.index + regExpExecArray[0].length - reference.length
            context.report({
              node: comment,
              messageId: 'unquotedSelector',
              data: { name: selector, target },
              fix: ruleFixer => ruleFixer.replaceTextRange([start, start + reference.length], target),
            })
          }
        }
      },
    }

    return listener
  },
}

/**
 * The innermost class body the comment sits in.
 *
 * @param comment - The comment the rule reads.
 * @param classBodies - The class bodies of the file, in the order they open.
 * @returns The body, and nothing where the comment sits in no class.
 */
const enclosingClassBodyOf = (
  comment: TSESTree.Comment,
  classBodies: TSESTree.ClassBody[],
): TSESTree.ClassBody | undefined => {
  const [at] = comment.range

  return (
    classBodies
      /* v8 ignore start -- the class bodies were filtered by the comment they enclose */
      .filter(classBody => encloses(classBody, at))
      /* v8 ignore next -- the class bodies were filtered by the comment they enclose */
      .sort((leftClassBody, rightClassBody) => rightClassBody.range[0] - leftClassBody.range[0])[0]
  )
  /* v8 ignore stop */
}

/**
 * What a link names a symbol by. A name TSDoc keeps as a selector goes in quotes, and a member of the class the
 * comment sits in is qualified by that class, which a class with no name cannot be.
 *
 * @param classBody - The body of the class the comment sits in, when it sits in one.
 * @returns What answers the target for a name, and null where no link can name it.
 */
const targetFor = (classBody: TSESTree.ClassBody | undefined): ((name: string) => string | null) => {
  const members = classMemberNamesOf(classBody)
  const owner = classBody?.parent.id?.name

  return name => {
    if (!SYSTEM_SELECTORS.has(name)) return name
    if (!members.has(name)) return `"${name}"`
    if (!owner) return null

    return `${owner}."${name}"`
  }
}

/**
 * A reference with every selector in quotes, and a lone member qualified the way {@link targetFor} qualifies one.
 *
 * @param segments - The reference, split on its dots.
 * @param targetOf - What answers the target for a lone name.
 * @returns The reference.
 */
const quotedReference = (segments: string[], targetOf: (name: string) => string | null): string => {
  const [only] = segments
  if (segments.length === 1 && only) return targetOf(only) ?? `"${only}"`

  return segments.map(quotedSegment).join('.')
}

/**
 * A segment of a reference, in quotes when TSDoc reads it as a selector.
 *
 * @param segment - The segment as the link writes it.
 * @returns The segment.
 */
const quotedSegment = (segment: string): string => {
  if (!SYSTEM_SELECTORS.has(segment)) return segment

  return `"${segment}"`
}

/**
 * A segment of a reference without the quotes that keep a selector a name.
 *
 * @param segment - The segment as the link writes it.
 * @returns The name.
 */
const unquoted = (segment: string): string => segment.replace(/^"(.*)"$/, '$1')

/**
 * Whether a name is reachable from where the comment sits: a binding of the innermost scope
 * enclosing it, its parents included, or a member of the innermost class it is inside. The global
 * scope is left out: `Partial` and `undefined` are words, not symbols a reader jumps to.
 *
 * @param comment - The comment the rule reads.
 * @param sourceCode - The source it is written in.
 * @param classBody - The body of the class the comment sits in, when it sits in one.
 * @returns What answers whether a name resolves.
 */
const resolverFor = (
  comment: TSESTree.Comment,
  sourceCode: TSESLint.SourceCode,
  classBody: TSESTree.ClassBody | undefined,
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
  const members = classMemberNamesOf(classBody)

  /* v8 ignore next -- a file the parser read has a scope of its own */
  return name => members.has(name) || isBound(scope ?? null, name)
}

/**
 * Whether a node spans a position of the source, the position of a comment among them.
 *
 * @param node - The node.
 * @param at - The position, as an offset of the source.
 * @returns Whether the position falls inside the node.
 */
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

/**
 * Whether a name is declared in a scope or in one around it, short of the global scope.
 *
 * @param scope - The scope the search starts from.
 * @param name - The name.
 * @returns Whether a scope declares it.
 */
const isBound = (scope: TSESLint.Scope.Scope | null, name: string): boolean => {
  for (let current = scope; current && current.type !== TSESLint.Scope.ScopeType.global; current = current.upper)
    if (current.set.has(name)) return true

  return false
}
