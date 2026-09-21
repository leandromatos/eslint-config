import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { NamingRule, ResultNamedByVerbMessageId } from '../types/index.js'

/**
 * A variable holding what a call produced opens with the participle of the verb that produced it:
 * `transformedActivityEntity` for `toActivityEntity(activity)`, `createdToken` for
 * `createToken(body)`, `hashedPassword` for `hashPassword(password)`. The input and the output
 * of such a verb are two values that share a scope, and often a type; the participle is what
 * tells them apart and says which one is the result. A verb that only looks something up
 * produces nothing new, so its result is named by its type alone; the options list which verbs
 * produce, and what each one's participle is. An export is named by its file, and a name the
 * scope already holds is left alone: two results of one verb are told apart by hand. A name a
 * test gives by role, `result` or `expected*` from the options, is what the test reads by; and a
 * name that leaves as a shorthand property is fixed by the key, which is the reader's contract.
 */
export const resultByVerb: NamingRule<ResultNamedByVerbMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A variable holding what a producing verb returned opens with its participle.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/naming/docs/rules/result-by-verb.md',
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
    const where = locate(context)
    const isNamedByRole = (name: string): boolean =>
      Boolean(where?.segments.includes(testFolder)) && roleNames.some(role => opensWith(name, role))
    const verbs = Object.keys(verbParticiples).sort((left, right) => right.length - left.length)
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || isExported(node, context.sourceCode)) return
        if (isNamedByRole(node.id.name) || isRendered(node, context.sourceCode)) return
        const callee = calleeNameOf(node.init)
        const verb = callee && verbs.find(each => opensWith(callee, each))
        if (!verb) return
        const participle = verbParticiples[verb]
        if (!participle || opensWith(node.id.name, participle)) return
        const identifier = node.id
        const bare = withoutParticiple(identifier.name, Object.values(verbParticiples))
        const expected = `${participle}${bare.charAt(0).toUpperCase()}${bare.slice(1)}`
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
 * `activity` for `createdActivity`: a participle of another verb is replaced, not stacked under.
 *
 * @param name - The name as it is declared.
 * @param participles - The participles a producing verb gives its result.
 * @returns The name without the participle.
 */
const withoutParticiple = (name: string, participles: string[]): string => {
  const worn = participles.find(each => name.startsWith(each) && /[A-Z]/.test(name.charAt(each.length)))
  if (!worn) return name
  const rest = name.slice(worn.length)

  return rest.charAt(0).toLowerCase() + rest.slice(1)
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
 * Renames the declaration and every reference to it; `{ user }` becomes `{ user: createdUser }`.
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
  const variable = sourceCode.getDeclaredVariables(declarator).find(each => each.name !== expected)
  /* v8 ignore next -- the declaration declares the variable the rule is renaming */
  const references = variable?.references.map(reference => reference.identifier) ?? []

  return [identifier, ...references]
    .filter((node, index, all) => all.indexOf(node) === index)
    .map(node => {
      const parent = node.parent
      /* v8 ignore next -- a name that leaves as a shorthand property is refused before the rule reports */
      if (parent?.type === AST_NODE_TYPES.Property && parent.shorthand && parent.value === node)
        /* v8 ignore next -- a name that leaves as a shorthand property is refused before the rule reports */
        return ruleFixer.replaceText(parent, `${sourceCode.getText(parent.key)}: ${expected}`)

      return ruleFixer.replaceTextRange([node.range[0], node.range[0] + node.name.length], expected)
    })
}

/**
 * `toActivityEntity` for `this.transformer.toActivityEntity(x)`, awaited or not, and null otherwise.
 *
 * @param init - What the declaration holds.
 * @returns The callee's name.
 */
const calleeNameOf = (init: TSESTree.Expression | null): string | null => {
  const expression = unwrapAwait(init)
  if (expression?.type !== AST_NODE_TYPES.CallExpression) return null
  const { callee } = expression
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (callee.type === AST_NODE_TYPES.MemberExpression && callee.property.type === AST_NODE_TYPES.Identifier)
    return callee.property.name

  return null
}

/**
 * Whether a camel-case name opens with the word: `toActivityEntity` opens with `to`, `token` does not.
 *
 * @param name - The name as it is declared.
 * @param word - The word it is compared against.
 * @returns Whether the name opens with it.
 */
const opensWith = (name: string, word: string): boolean =>
  name.startsWith(word) && (name.length === word.length || /[A-Z0-9]/.test(name.charAt(word.length)))

/**
 * What an initializer produces, past an await.
 *
 * @param init - What the declaration holds.
 * @returns The expression underneath.
 */
const unwrapAwait = (init: TSESTree.Expression | null): TSESTree.Expression | null => {
  if (init?.type === AST_NODE_TYPES.AwaitExpression) return init.argument

  return init
}
