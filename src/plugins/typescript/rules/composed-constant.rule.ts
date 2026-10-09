import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, isTableRow, unwrapAssertion } from '../../shared/utils/index.js'
import type { ComposedConstantMessageId } from '../types/index.js'

/** What a message names a field by when its key is computed, which the source does not spell. */
const COMPUTED_KEY = '[computed]'

/** What a message names a spread by. */
const SPREAD = '...'

/** What tells a sentence from a word. */
const SPACE = /\s/

/**
 * A value built from constants is built from constants alone: an object or a list that reads one writes nothing else in
 * place.
 *
 * A project extends a default by reading it, `[...NEXTJS_ROOT_CONTEXTS, 'docs']`, and it can only read what has a name.
 * An object that reads some of its fields from constants and writes the others in place mixes two ways of saying a
 * value, and a reader cannot tell which fields are the ones to extend. A field is read from a name, a call or a
 * template that reads one, or is a group built the same way. A value that only spreads a default extends it, so it adds
 * its items in place, and still writes no list or map in place. A switch, `true` or `false`, an empty string, and an
 * empty list or map, which hold nothing to name, are left alone, and so is an object or a list of literals alone, which
 * is a constant itself. A sentence, a string with a space in it, is text the reader reads whole and the text rules
 * judge, never a value a project extends, so it is left alone too. A row of a table, an object a list holds or a field
 * of a map of objects, holds its own fields, so it is not judged inside, and a constant of the specs is a record of the
 * same kind.
 */
export const composedConstant: TSESLint.RuleModule<ComposedConstantMessageId> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'An object or a list built from constants writes no value in place.',
      url: buildRuleDocsUrl('typescript', 'composed-constant'),
      dialects: ['TypeScript'],
    },
    messages: {
      valueInPlace:
        '"{{field}}" is written in place, beside fields read from constants. Declare it as a constant of its own and read it here, so every field of the value is read by name.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: context => {
    const report = (node: TSESTree.Node, field: string): void =>
      context.report({ node, messageId: 'valueInPlace', data: { field } })
    const judgeContainer = (container: TSESTree.Node): void => {
      const composed = readsField(container)
      if (!composed && !extendsConstant(container)) return
      for (const [field, child] of listChildren(container)) {
        const value = unwrapAssertion(child)
        if (isNamed(value) || isLeftAlone(value) || isTableRow(value)) continue
        if (isContainer(value) && (readsField(value) || extendsConstant(value))) {
          judgeContainer(value)
          continue
        }
        if (composed || isContainer(value)) report(child, field)
      }
    }
    const listener: TSESLint.RuleListener = {
      'Program > VariableDeclaration > VariableDeclarator, Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator':
        (declarator: TSESTree.VariableDeclarator) => {
          if (declarator.init) judgeContainer(unwrapAssertion(declarator.init))
        },
    }

    return listener
  },
}

/**
 * Whether an object or a list reads a field by name: a child read from a constant, or a group that does. A spread is
 * not a field, so a value that only spreads a default extends it rather than composing from it.
 *
 * @param node - The value.
 * @returns Whether it is composed of constants.
 */
const readsField = (node: TSESTree.Node): boolean =>
  listChildren(node).some(([, child]) => {
    const value = unwrapAssertion(child)
    if (value.type === AST_NODE_TYPES.SpreadElement) return false

    return isNamed(value) || readsField(value)
  })

/**
 * Whether an object or a list spreads a constant, which is how a default is extended: `[...DEFAULTS, 'docs']`.
 *
 * @param node - The value.
 * @returns Whether it extends a constant.
 */
const extendsConstant = (node: TSESTree.Node): boolean =>
  listChildren(node).some(([, child]) => child.type === AST_NODE_TYPES.SpreadElement && isNamed(child.argument))

/**
 * Lists what an object or a list holds, each with the name a message gives it: the key of a field, the position of an
 * item, and `...` for a spread.
 *
 * @param node - The value.
 * @returns The children, and none for a value that holds none.
 */
const listChildren = (node: TSESTree.Node): [string, TSESTree.Node][] => {
  if (node.type === AST_NODE_TYPES.ArrayExpression)
    return node.elements.flatMap((element, index) => {
      if (!element) return []

      return [[`[${index}]`, element]]
    })
  if (node.type !== AST_NODE_TYPES.ObjectExpression) return []

  return node.properties.map(property => {
    if (property.type === AST_NODE_TYPES.SpreadElement) return [SPREAD, property]

    return [readKeyText(property), property.value]
  })
}

/**
 * Reads the key of a field as the source spells it.
 *
 * @param property - The field.
 * @returns The key.
 */
const readKeyText = (property: TSESTree.Property): string => {
  if (property.computed) return COMPUTED_KEY
  if (property.key.type === AST_NODE_TYPES.Identifier) return property.key.name

  return String(property.key.value)
}

/**
 * Whether a value is read from a name: a constant, a field of one, a call, or a template that reads one.
 *
 * @param node - The value.
 * @returns Whether it reads a name.
 */
const isNamed = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.Identifier || node.type === AST_NODE_TYPES.MemberExpression) return true
  if (node.type === AST_NODE_TYPES.CallExpression) return true
  if (node.type === AST_NODE_TYPES.SpreadElement) return isNamed(node.argument)

  return node.type === AST_NODE_TYPES.TemplateLiteral && node.expressions.length > 0
}

/**
 * Whether a value holds nothing to name: a switch, an empty string, a sentence, or an empty list or map.
 *
 * @param node - The value.
 * @returns Whether the rule leaves it alone.
 */
const isLeftAlone = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.Literal) return typeof node.value === 'boolean' || isText(node.value)
  if (node.type === AST_NODE_TYPES.TemplateLiteral) return node.quasis.every(quasi => isText(quasi.value.cooked))
  if (node.type === AST_NODE_TYPES.ArrayExpression) return node.elements.length === 0
  if (node.type === AST_NODE_TYPES.ObjectExpression) return node.properties.length === 0

  return false
}

/**
 * Whether a value is text rather than a word: empty, or a sentence, with a space in it.
 *
 * @param value - The value of a literal.
 * @returns Whether it is text.
 */
const isText = (value: unknown): boolean => typeof value === 'string' && (value === '' || SPACE.test(value))

/**
 * Whether a value is an object or a list, which holds other values.
 *
 * @param node - The value.
 * @returns Whether it is a container.
 */
const isContainer = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.ArrayExpression || node.type === AST_NODE_TYPES.ObjectExpression
