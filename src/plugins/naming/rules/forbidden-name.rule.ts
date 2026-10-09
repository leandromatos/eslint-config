import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, splitIntoWords } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ForbiddenNameMessageId, ForbiddenWord, NamingRule } from '../types/index.js'

/**
 * A name the options forbid whole, or a word they forbid in any position of a name, wherever the author chose it.
 *
 * What the author chooses is a declaration: a variable, a parameter, a function, a class, a method or a property of a
 * class, an interface, a type alias, and a member of either. A key of an object literal is not one of those, and
 * neither is the key of a type written inline for a parameter: each is half of a contract the code is filling in, and
 * `report({ data })` spells `data` because ESLint asked for it, not because anybody named a value that way. A word is
 * a segment of a camel-case, Pascal-case or snake-case name, so a forbidden `data` is found in `userData` and
 * `UserData` and not in `metadata`, and a word refused as the last one is found in `userData` and not in
 * `dataSharing`.
 */
export const forbiddenName: NamingRule<ForbiddenNameMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A name the options forbid, or a name carrying a word they forbid, is never declared.',
      url: buildRuleDocsUrl('naming', 'forbidden-name'),
      dialects: ['TypeScript'],
    },
    messages: {
      forbiddenName: '"{{name}}" is a name this project forbids: {{because}}. Name it after what it holds.',
      forbiddenWord:
        '"{{name}}" carries "{{word}}", a word this project forbids: {{because}}. Name it after what it holds.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ forbiddenNames, forbiddenWords }] = context.options
    const judge = (identifier: TSESTree.Identifier | null): void => {
      if (!identifier) return
      const { name } = identifier
      const forbidden = forbiddenNames.find(each => each.name === name)
      if (forbidden) {
        context.report({ node: identifier, messageId: 'forbiddenName', data: { name, because: forbidden.because } })

        return
      }
      const words = splitIntoWords(name)
      const forbiddenWord = forbiddenWords.find(each => carriesWord(words, each))
      if (!forbiddenWord) return
      const messageValues = { name, word: forbiddenWord.word, because: forbiddenWord.because }
      context.report({ node: identifier, messageId: 'forbiddenWord', data: messageValues })
    }
    const judgeParameters = (node: TSESTree.FunctionLike): void => {
      for (const parameter of node.params) judge(readDeclaredIdentifier(parameter))
    }
    const judgeKey = (node: TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.TSPropertySignature) => {
      if (node.computed) return
      judge(readDeclaredIdentifier(node.key))
    }
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => judge(readDeclaredIdentifier(node.id)),
      FunctionDeclaration: node => {
        judge(node.id)
        judgeParameters(node)
      },
      FunctionExpression: judgeParameters,
      ArrowFunctionExpression: judgeParameters,
      TSDeclareFunction: node => judge(node.id),
      ClassDeclaration: node => judge(node.id),
      PropertyDefinition: judgeKey,
      MethodDefinition: judgeKey,
      TSInterfaceDeclaration: node => judge(node.id),
      TSTypeAliasDeclaration: node => judge(node.id),
      'TSInterfaceBody > TSPropertySignature': judgeKey,
      'TSTypeAliasDeclaration > TSTypeLiteral > TSPropertySignature': judgeKey,
    }

    return listener
  },
}

/**
 * Reads the identifier a node declares, and null for a pattern that declares none.
 *
 * A destructured parameter declares the keys of whatever it takes apart, and those are the contract's names rather
 * than the author's.
 *
 * @param node - What the declaration names.
 * @returns The identifier.
 */
const readDeclaredIdentifier = (node: TSESTree.Node): TSESTree.Identifier | null => {
  if (node.type === AST_NODE_TYPES.Identifier) return node
  if (node.type === AST_NODE_TYPES.AssignmentPattern) return readDeclaredIdentifier(node.left)
  if (node.type === AST_NODE_TYPES.TSParameterProperty) return readDeclaredIdentifier(node.parameter)

  return null
}

/**
 * Whether the words of a name carry a forbidden word where the entry refuses it: anywhere, or as the last word.
 *
 * @param words - The words of the name, in lower case.
 * @param forbiddenWord - The entry.
 * @returns Whether the name carries it there.
 */
const carriesWord = (words: string[], forbiddenWord: ForbiddenWord): boolean => {
  if (forbiddenWord.position === 'last') return words.at(-1) === forbiddenWord.word

  return words.includes(forbiddenWord.word)
}
