import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'

import { BRITISH_SPELLINGS, EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { AmericanSpellingMessageId, TextRule } from '../types/index.js'

/** The import and export forms whose string names a module, which its package spells. */
const MODULE_SOURCES = new Set<string>([
  AST_NODE_TYPES.ImportDeclaration,
  AST_NODE_TYPES.ExportAllDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ImportExpression,
])

/** The members a class or an interface declares by name, whose key the code chooses. */
const MEMBERS = new Set<string>([
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.TSAbstractMethodDefinition,
  AST_NODE_TYPES.TSAbstractPropertyDefinition,
  AST_NODE_TYPES.TSMethodSignature,
  AST_NODE_TYPES.TSPropertySignature,
])

/**
 * Every name, comment and string the code carries is spelled in American English, so one search finds every use of a
 * word: two spellings of one word are two words to grep for. The names read are the ones the code declares; a name it
 * imports, or reads off another module, is that module's to spell. A string that names a module is its package's, and
 * a word another system defines, such as a field of a third-party payload, is listed by the project as an exception.
 */
export const americanSpelling: TextRule<AmericanSpellingMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Every name, comment and string the code carries is spelled in American English.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/text/docs/rules/american-spelling.md',
      dialects: ['TypeScript'],
    },
    messages: {
      britishSpelling: '"{{word}}" is British spelling. Write it with "{{american}}", as American English does.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ spellingExceptions }] = context.options
    const exceptions = new Set(spellingExceptions.map(exception => exception.toLowerCase()))
    /*
     * One pattern per spelling, read in any case. A spelling written with its endings is never followed by another
     * lower-case letter; a root no American word holds, as the British spelling of color is, is read inside a longer
     * word too.
     */
    const spellings = BRITISH_SPELLINGS.map(({ british, american }) => ({
      pattern: new RegExp(`${british}${endingGuardOf(british)}`, 'gi'),
      american,
    }))
    const { sourceCode } = context
    const judge = (text: string, node: TSESTree.Node | TSESTree.Token): void => {
      for (const { pattern, american } of spellings)
        for (const [word] of text.matchAll(pattern)) {
          if (wordsAround(text, word).some(each => exceptions.has(each.toLowerCase()))) continue
          context.report({ loc: node.loc, messageId: 'britishSpelling', data: { word, american } })
        }
    }
    const listener: TSESLint.RuleListener = {
      Literal: literal => {
        if (typeof literal.value !== 'string' || MODULE_SOURCES.has(literal.parent.type)) return
        judge(literal.value, literal)
      },
      TemplateElement: templateElement => judge(templateElement.value.raw, templateElement),
      JSXText: jsxText => judge(jsxText.value, jsxText),
      'Program:exit': () => {
        for (const comment of sourceCode.getAllComments()) judge(comment.value, comment)
        for (const name of declaredNamesOf(sourceCode)) judge(name.name, name)
      },
      Identifier: identifier => {
        if (MEMBERS.has(identifier.parent.type) && 'key' in identifier.parent && identifier.parent.key === identifier)
          judge(identifier.name, identifier)
      },
    }

    return listener
  },
}

/**
 * The words of a text that hold a match, so an exception names the word as the other system spells it.
 *
 * @param text - The text the match was found in.
 * @param match - What the pattern matched.
 * @returns The words that contain the match.
 */
const wordsAround = (text: string, match: string): string[] =>
  text.split(/[^\w$-]+/).filter(word => word.toLowerCase().includes(match.toLowerCase()))

/**
 * The names the file declares itself: its variables, functions, classes, parameters and types, imports left out.
 *
 * @param sourceCode - The source the names are declared in.
 * @returns The identifiers that declare them, once each.
 */
const declaredNamesOf = (sourceCode: TSESLint.SourceCode): TSESTree.Identifier[] => {
  const names = new Set<TSESTree.Identifier>()
  /* v8 ignore next -- a file the parser read carries the scopes it analyzed */
  for (const scope of sourceCode.scopeManager?.scopes ?? [])
    for (const variable of scope.variables)
      for (const definition of variable.defs)
        if (
          definition.type !== TSESLint.Scope.DefinitionType.ImportBinding &&
          definition.name.type === AST_NODE_TYPES.Identifier
        )
          names.add(definition.name)

  return [...names]
}

/**
 * What closes the pattern of a spelling: nothing for a root, and no lower-case letter after one written with its
 * endings, so a longer word that only starts the same way passes.
 *
 * @param british - The spelling, as its pattern source.
 * @returns The guard.
 */
const endingGuardOf = (british: string): string => {
  if (!british.includes('(?:')) return ''

  return '(?![a-z])'
}
