import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, locateFile, readCalleeName, toUpperFirst, unwrapAwait } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { NamingRule, ResultByVerbMessageId } from '../types/index.js'
import { removeParticiple, writeRename } from '../utils/index.js'

/**
 * A variable holding what a call produced opens with the participle of the verb that produced it:
 * `createdToken` for `createToken(body)`, `hashedPassword` for `hashPassword(password)`. The input and the output
 * of such a verb are two values that share a scope, and often a type; the participle is what
 * tells them apart and says which one is the result. A verb that only looks something up
 * produces nothing new, so its result is named by its type alone; the options list which verbs
 * produce, and what each one's participle is. An export is named by its file, and a name the
 * scope already holds is left alone: two results of one verb are told apart by hand. A name a
 * test gives by role, `result` or `expected*` from the options, is what the test reads by; and a
 * name that leaves as a shorthand property is fixed by the key, which is the reader's contract.
 */
export const resultByVerb: NamingRule<ResultByVerbMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A variable holding what a producing verb returned opens with its participle.',
      url: buildRuleDocsUrl('naming', 'result-by-verb'),
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      missingParticiple:
        '"{{name}}" holds what {{callee}}() produced. Open it with "{{participle}}": the participle says this is the result, not the input.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ verbParticiples, roleNames, testFolder }] = context.options
    const where = locateFile(context)
    const isNamedByRole = (name: string): boolean =>
      Boolean(where?.segments.includes(testFolder)) && roleNames.some(role => startsWithWord(name, role))
    const verbs = Object.keys(verbParticiples).sort((left, right) => right.length - left.length)
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || isExported(node, context.sourceCode)) return
        if (isNamedByRole(node.id.name) || isRendered(node, context.sourceCode)) return
        const callee = readInitCallee(node.init)
        if (!callee) return
        const verb = verbs.find(each => startsWithWord(callee, each))
        if (!verb) return
        const participle = verbParticiples[verb]
        if (!participle || startsWithWord(node.id.name, participle)) return
        const identifier = node.id
        const bare = removeParticiple(identifier.name, Object.values(verbParticiples))
        const expected = `${participle}${toUpperFirst(bare)}`
        if (isTaken(expected, node, context.sourceCode) || isShorthandKey(node, context.sourceCode)) return
        context.report({
          node: identifier,
          messageId: 'missingParticiple',
          data: { name: identifier.name, callee, participle },
          fix: ruleFixer => renameVariable(ruleFixer, node, identifier, expected, context.sourceCode),
        })
      },
    }

    return listener
  },
}

/**
 * Whether the declaration is what a module exports, which the file names instead.
 *
 * A module exports a name in two spellings: on the declaration itself, and in a list at the end of the file. Both
 * carry the name out of the module, so a rename would reach every caller rather than this file alone.
 *
 * @param declarator - The declaration the rule judges.
 * @param sourceCode - The file, for the references the name carries.
 * @returns Whether the module exports it.
 */
const isExported = (declarator: TSESTree.VariableDeclarator, sourceCode: TSESLint.SourceCode): boolean => {
  if (declarator.parent.parent.type === AST_NODE_TYPES.ExportNamedDeclaration) return true

  return sourceCode
    .getDeclaredVariables(declarator)
    .some(variable =>
      variable.references.some(reference => reference.identifier.parent?.type === AST_NODE_TYPES.ExportSpecifier),
    )
}

/**
 * Whether the value is written as a JSX element, which is what a component is.
 *
 * JSX reads a lowercase name as a tag of the language and an uppercase one as the component in scope, so a name the
 * render uses is the one thing renaming cannot reach: a context renamed to `createdThemeContext` stops being a
 * component and starts being an element the runtime does not know.
 *
 * @param declarator - The declaration the rule judges.
 * @param sourceCode - The source, to read what the declaration's references are.
 * @returns Whether a reference opens a JSX element.
 */
const isRendered = (declarator: TSESTree.VariableDeclarator, sourceCode: TSESLint.SourceCode): boolean =>
  sourceCode
    .getDeclaredVariables(declarator)
    .flatMap(variable => variable.references)
    .some(reference => reference.identifier.parent?.type === AST_NODE_TYPES.JSXOpeningElement)

/**
 * Whether the variable leaves as a shorthand property, `{ verifier }`: the key is the contract of
 * whoever reads the object, and a shorthand needs the local to spell it.
 *
 * @param declarator - The declaration the rule judges.
 * @param sourceCode - The source it is written in.
 * @returns Whether the name is a key somebody reads.
 */
const isShorthandKey = (declarator: TSESTree.VariableDeclarator, sourceCode: TSESLint.SourceCode): boolean =>
  sourceCode
    .getDeclaredVariables(declarator)
    .flatMap(variable => variable.references)
    .some(reference => {
      const { parent } = reference.identifier

      return parent?.type === AST_NODE_TYPES.Property && parent.shorthand && parent.value === reference.identifier
    })

/**
 * Whether the scope already holds the name: a second result of the same verb.
 *
 * @param name - The name the rule proposes.
 * @param declarator - The declaration the rule judges.
 * @param sourceCode - The source it is written in.
 * @returns Whether the name is taken.
 */
const isTaken = (name: string, declarator: TSESTree.VariableDeclarator, sourceCode: TSESLint.SourceCode): boolean =>
  sourceCode.getScope(declarator).set.has(name)

/**
 * Renames the declaration and every reference to it. A name that leaves as a shorthand property is refused before
 * the rule reports, so every place is the bare name.
 *
 * @param ruleFixer - What writes the fix.
 * @param declarator - The declaration the rule judges.
 * @param identifier - The name as it is declared.
 * @param expected - The name the rule proposes.
 * @param sourceCode - The source it is written in.
 * @returns The fixes, one per place the name is written.
 */
const renameVariable = (
  ruleFixer: TSESLint.RuleFixer,
  declarator: TSESTree.VariableDeclarator,
  identifier: TSESTree.Identifier,
  expected: string,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix[] => {
  const references = sourceCode
    .getDeclaredVariables(declarator)
    .flatMap(variable => variable.references.map(reference => reference.identifier))

  return writeRename(ruleFixer, [identifier, ...references], expected, sourceCode)
}

/**
 * Reads the name of the call an initializer makes, awaited or not: `toActivityEntity` for
 * `await this.transformer.toActivityEntity(x)`.
 *
 * @param init - What the declaration holds.
 * @returns The callee's name, and null for an initializer that calls nothing it names.
 */
const readInitCallee = (init: TSESTree.Expression | null): string | null => {
  if (!init) return null
  const expression = unwrapAwait(init)
  if (expression.type !== AST_NODE_TYPES.CallExpression) return null

  return readCalleeName(expression)
}

/**
 * Whether a camel-case name opens with the word: `toActivityEntity` opens with `to`, `token` does not.
 *
 * @param name - The name as it is declared.
 * @param word - The word it is compared against.
 * @returns Whether the name opens with it.
 */
const startsWithWord = (name: string, word: string): boolean =>
  name.startsWith(word) && (name.length === word.length || /[A-Z0-9]/.test(name.charAt(word.length)))
