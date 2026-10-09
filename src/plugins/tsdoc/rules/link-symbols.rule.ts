import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { LinkSymbolsMessageId, TsdocRule } from '../types/index.js'
import { isDocComment } from '../utils/index.js'

/** A code span as Markdown reads one: a run of backticks, the text, and a run of the same length that closes it. */
const CODE_SPAN_REG_EXP = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g

/** A name a span holds whole, which is the only span that can stand for a symbol. */
const IDENTIFIER_REG_EXP = /^[A-Za-z_$][\w$]*$/

/** The declarations a page documents whatever their name: a class, a type and an enum. */
const TYPE_DEFINITIONS = new Set<string>([
  TSESLint.Scope.DefinitionType.ClassName,
  TSESLint.Scope.DefinitionType.TSEnumName,
  TSESLint.Scope.DefinitionType.Type,
])

/** What a const holds when it declares a function or a class rather than a value. */
const DOCUMENTED_INITIALIZERS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.ClassExpression,
  AST_NODE_TYPES.FunctionExpression,
])

/** A link tag and the reference it names, up to a pipe, a space or the closing brace. */
const LINK_REG_EXP = /\{@link\s+([^}|\s]+)/g

/** A reference that names something outside the file: a URL, a package, or an anchor of one. */
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
 * font is for what is not a symbol, a literal, a key, a path. Written both ways, the same name reads as two things;
 * and a link whose target resolves to nothing is a promise the page cannot keep.
 *
 * A name TSDoc keeps as a selector, such as `type` or `class`, is linked in quotes, and a member of the class the
 * comment sits in is qualified by that class, as `Owner."type"`.
 *
 * A code span is read as a symbol only when it holds one name whole and that name is something a page documents: a
 * class, an interface, a type, an enum, a method of the enclosing class, or a function or a name imported by name
 * that opens in upper case. A name in lower case spells a value, a key or a CSS keyword as often as a function, and a
 * variable, a parameter, a property and a default import name a value, a key or a package, so a span that spells one
 * is left alone. What the rule offers for a span is a suggestion, never a fix: whether the author meant the symbol is
 * the author's call.
 */
export const linkSymbols: TsdocRule<LinkSymbolsMessageId> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'A symbol in scope is linked with {@link}, never set in backticks; a link resolves.',
      url: buildRuleDocsUrl('tsdoc', 'link-symbols'),
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      symbolInBackticks: '"{{name}}" is a symbol in scope. Link it: {@link {{target}}}.',
      linkSymbol: 'Link "{{name}}": {@link {{target}}}.',
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
          if (!isDocComment(comment)) continue
          const classBody = findEnclosingClassBody(comment, classBodies)
          const resolves = buildResolver(comment, sourceCode, classBody, false)
          const documents = buildResolver(comment, sourceCode, classBody, true)
          const targetOf = buildTargetResolver(classBody)
          for (const codeSpan of comment.value.matchAll(CODE_SPAN_REG_EXP)) {
            const [, ticks, name] = codeSpan
            if (ticks !== '`' || !name || !IDENTIFIER_REG_EXP.test(name)) continue
            const target = targetOf(name)
            if (!documents(name) || !target) continue
            const start = comment.range[0] + 2 + codeSpan.index
            const link = { name, target }
            context.report({
              node: comment,
              messageId: 'symbolInBackticks',
              data: link,
              suggest: [
                {
                  messageId: 'linkSymbol',
                  data: link,
                  fix: ruleFixer => ruleFixer.replaceTextRange([start, start + name.length + 2], `{@link ${target}}`),
                },
              ],
            })
          }
          for (const linkTag of comment.value.matchAll(LINK_REG_EXP)) {
            const [opening, reference] = linkTag
            if (!reference || URL_OR_PACKAGE_REG_EXP.test(reference)) continue
            const segments = reference.split('.')
            const head = unquoteSegment(reference.replace(/\..*$/, ''))
            if (!resolves(head)) {
              context.report({ node: comment, messageId: 'linkToNothing', data: { name: reference } })
              continue
            }
            const selector = segments.find(segment => SYSTEM_SELECTORS.has(segment))
            if (!selector) continue
            const target = quoteReference(segments, targetOf)
            const start = comment.range[0] + 2 + linkTag.index + opening.length - reference.length
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
const findEnclosingClassBody = (
  comment: TSESTree.Comment,
  classBodies: TSESTree.ClassBody[],
): TSESTree.ClassBody | undefined => {
  const [at] = comment.range

  // The bodies are in the order they open, so the last one that encloses the comment is the innermost.
  return classBodies.filter(classBody => isEnclosing(classBody, at)).at(-1)
}

/**
 * What a link names a symbol by. A name TSDoc keeps as a selector goes in quotes, and a member of the class the
 * comment sits in is qualified by that class, which a class with no name cannot be.
 *
 * @param classBody - The body of the class the comment sits in, when it sits in one.
 * @returns What answers the target for a name, and null where no link can name it.
 */
const buildTargetResolver = (classBody: TSESTree.ClassBody | undefined): ((name: string) => string | null) => {
  const members = listClassMemberNames(classBody, false)
  const owner = classBody?.parent.id?.name

  return name => {
    if (!SYSTEM_SELECTORS.has(name)) return name
    if (!members.has(name)) return `"${name}"`
    if (!owner) return null

    return `${owner}."${name}"`
  }
}

/**
 * A reference with every selector in quotes, and a lone member qualified the way {@link buildTargetResolver} qualifies
 * one.
 *
 * @param segments - The reference, split on its dots.
 * @param targetOf - What answers the target for a lone name.
 * @returns The reference.
 */
const quoteReference = (segments: string[], targetOf: (name: string) => string | null): string => {
  const [only] = segments
  if (segments.length === 1 && only) return targetOf(only) ?? `"${only}"`

  return segments.map(quoteSegment).join('.')
}

/**
 * A segment of a reference, in quotes when TSDoc reads it as a selector.
 *
 * @param segment - The segment as the link writes it.
 * @returns The segment.
 */
const quoteSegment = (segment: string): string => {
  if (!SYSTEM_SELECTORS.has(segment)) return segment

  return `"${segment}"`
}

/**
 * A segment of a reference without the quotes that keep a selector a name.
 *
 * @param segment - The segment as the link writes it.
 * @returns The name.
 */
const unquoteSegment = (segment: string): string => segment.replace(/^"(.*)"$/, '$1')

/**
 * Whether a name is reachable from where the comment sits: a binding of the innermost scope
 * enclosing it, its parents included, or a member of the innermost class it is inside. The global
 * scope is left out: `Partial` and `undefined` are words, not symbols a reader jumps to.
 *
 * @param comment - The comment the rule reads.
 * @param sourceCode - The source it is written in.
 * @param classBody - The body of the class the comment sits in, when it sits in one.
 * @param isDocumentedOnly - Whether only what a page documents counts: a declaration of a type, a class, an enum or a
 * function, a method, or a name imported by name.
 * @returns What answers whether a name resolves.
 */
const buildResolver = (
  comment: TSESTree.Comment,
  sourceCode: TSESLint.SourceCode,
  classBody: TSESTree.ClassBody | undefined,
  isDocumentedOnly: boolean,
): ((name: string) => boolean) => {
  const [at] = comment.range
  const scopes = listScopes(sourceCode.getScope(sourceCode.ast)).filter(
    candidateScope => candidateScope.type !== TSESLint.Scope.ScopeType.global,
  )
  /*
   * A scope comes after the scopes around it, so the last one that encloses the comment is the innermost. A comment
   * above the first statement sits before the program itself, which opens at its first token, so no scope encloses
   * it. What it names is what the file holds, which is the outermost scope.
   */
  const scope = scopes.filter(candidateScope => isEnclosing(candidateScope.block, at)).at(-1) ?? scopes[0]
  const members = listClassMemberNames(classBody, isDocumentedOnly)

  return name => members.has(name) || isBound(scope, name, isDocumentedOnly)
}

/**
 * Lists a scope and every scope inside it, each after the one that holds it.
 *
 * @param scope - The scope the walk starts at.
 * @returns The scopes.
 */
const listScopes = (scope: TSESLint.Scope.Scope): TSESLint.Scope.Scope[] => [
  scope,
  ...scope.childScopes.flatMap(listScopes),
]

/**
 * Whether a node spans a position of the source, the position of a comment among them.
 *
 * @param node - The node.
 * @param at - The position, as an offset of the source.
 * @returns Whether the position falls inside the node.
 */
const isEnclosing = (node: TSESTree.Node, at: number): boolean => node.range[0] <= at && at < node.range[1]

/**
 * The names the enclosing class declares, and none where the comment sits in no class.
 *
 * @param classBody - The body of the class the comment sits in, when it sits in one.
 * @param isDocumentedOnly - Whether only the methods count.
 * @returns The names.
 */
const listClassMemberNames = (classBody: TSESTree.ClassBody | undefined, isDocumentedOnly: boolean): Set<string> => {
  if (!classBody) return new Set<string>()

  return listMemberNames(classBody, isDocumentedOnly)
}

/**
 * The names of the members of a class.
 *
 * @param classBody - The body of the class.
 * @param isDocumentedOnly - Whether only the methods count: a property holds a value, which a span names as a key.
 * @returns The names.
 */
const listMemberNames = (classBody: TSESTree.ClassBody, isDocumentedOnly: boolean): Set<string> => {
  const names = new Set<string>()
  for (const member of classBody.body) {
    if (!('key' in member) || member.key.type !== AST_NODE_TYPES.Identifier) continue
    if (isDocumentedOnly && member.type !== AST_NODE_TYPES.MethodDefinition) continue
    names.add(member.key.name)
  }

  return names
}

/**
 * Whether a name is declared in a scope or in one around it, short of the global scope.
 *
 * @param scope - The scope the search starts from.
 * @param name - The name.
 * @param isDocumentedOnly - Whether only a declaration a page documents counts.
 * @returns Whether a scope declares it.
 */
const isBound = (scope: TSESLint.Scope.Scope | undefined, name: string, isDocumentedOnly: boolean): boolean => {
  for (let current = scope; current && current.type !== TSESLint.Scope.ScopeType.global; current = current.upper) {
    const variable = current.set.get(name)
    if (variable) return !isDocumentedOnly || variable.defs.some(isDocumentedDefinition)
  }

  return false
}

/**
 * Whether a declaration is one a page documents: a class, a type, an enum, and, when its name opens in upper case, a
 * function, a const holding a function or a class, or a name imported by name. A variable holding a value, a
 * parameter, and a default or namespace import, which names a package, are not.
 *
 * @param definition - How the scope declares the name.
 * @returns Whether a link to it lands on documentation.
 */
const isDocumentedDefinition = (definition: TSESLint.Scope.Definition): boolean => {
  const { DefinitionType } = TSESLint.Scope
  if (TYPE_DEFINITIONS.has(definition.type)) return true
  // A name that opens in lower case spells a value, a key or a CSS keyword as often as a function.
  if (definition.name.type !== AST_NODE_TYPES.Identifier || !/^[A-Z]/.test(definition.name.name)) return false
  if (definition.type === DefinitionType.FunctionName) return true
  if (definition.type === DefinitionType.ImportBinding) return definition.node.type === AST_NODE_TYPES.ImportSpecifier
  if (definition.type !== DefinitionType.Variable) return false
  const { init } = definition.node

  return Boolean(init && DOCUMENTED_INITIALIZERS.has(init.type))
}
