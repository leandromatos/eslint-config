import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ConstAssertionPairMessageId, TypescriptRule } from '../types/index.js'

/** What a name written as a vocabulary looks like: `OAuthScope`, never `OAUTH_SCOPE` and never `oauthScope`. */
const VOCABULARY_NAME_REG_EXP = /^[A-Z][a-zA-Z0-9]*$/

/**
 * A closed set of values is an object `as const` and the type derived from it, under one name.
 *
 * The pair is what stands in for an `enum`: the object is JavaScript, so it survives a transpiler and
 * compares with the literal a payload carries, and the alias is the union of its values. Half a pair is what the rule
 * reports a vocabulary nothing can be typed by, a type nothing can be read from, and a derivation
 * written by hand, which stops following the object the moment a member is added.
 *
 * A name in Pascal case is what declares the intent: a constant value shouts, a declaration read as a type
 * is written as one. So `ExampleId = { ... } as const` is judged and `EXAMPLE_IDS` is left alone, which is the line
 * between a vocabulary and a value the code would otherwise inline.
 */
export const constAssertionPair: TypescriptRule<ConstAssertionPairMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A vocabulary declared with `as const` carries the type derived from it, in the types folder.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/typescript/docs/rules/const-assertion-pair.md',
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      missingType:
        '"{{name}}" is a vocabulary and nothing types by it. Declare `type {{name}} = (typeof {{name}})[keyof typeof {{name}}]`.',
      missingValue: '"{{name}}" derives from a value this file does not declare. Declare the object it reads.',
      wrongDerivation:
        '"{{name}}" is written by hand and stops following the object. Derive it: `(typeof {{name}})[keyof typeof {{name}}]`.',
      outsideTypes: '"{{name}}" is a vocabulary, which is read as a type. Declare it in a ".{{suffix}}.ts" file.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ typeSuffix }] = context.options
    const vocabularies = new Map<string, TSESTree.VariableDeclarator>()
    const derivations = new Map<string, TSESTree.TSTypeAliasDeclaration>()
    const declared = new Set<string>()
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type === AST_NODE_TYPES.Identifier) declared.add(node.id.name)
        const name = vocabularyNameOf(node)
        if (name) vocabularies.set(name, node)
      },
      TSTypeAliasDeclaration: tsTypeAliasDeclaration => {
        if (VOCABULARY_NAME_REG_EXP.test(tsTypeAliasDeclaration.id.name))
          derivations.set(tsTypeAliasDeclaration.id.name, tsTypeAliasDeclaration)
      },
      'Program:exit': () => {
        for (const [name, node] of vocabularies) {
          const derivation = derivations.get(name)
          if (!derivation)
            context.report({
              node: node.id,
              messageId: 'missingType',
              data: { name },
              fix: ruleFixer => ruleFixer.insertTextAfter(statementOf(node), derivationFor(name)),
            })
          else if (!derivesFrom(derivation, name))
            context.report({
              node: derivation.id,
              messageId: 'wrongDerivation',
              data: { name },
              fix: ruleFixer => ruleFixer.replaceText(derivation.typeAnnotation, typeExpressionFor(name)),
            })
          if (where?.suffix && typeSuffix && where.suffix !== typeSuffix)
            context.report({ node: node.id, messageId: 'outsideTypes', data: { name, suffix: typeSuffix } })
        }
        /*
         * A value the file declares by calling a factory is a vocabulary the checker reads and this rule cannot: what
         * is reported is a derivation of a name the file declares nowhere at all.
         */
        for (const [name, node] of derivations) {
          if (!declared.has(name) && derivesFrom(node, name))
            context.report({ node: node.id, messageId: 'missingValue', data: { name } })
        }
      },
    }

    return listener
  },
}

/**
 * The name a vocabulary is declared under, and null for anything else an `as const` can hold.
 *
 * What makes it one is the shape of the whole: an object every member of which is a literal, under a name written as
 * a type. An object of functions is a helper, and a record of a handful of fields is a value.
 *
 * @param node - The declaration the rule reads.
 * @returns The name.
 */
const vocabularyNameOf = (node: TSESTree.VariableDeclarator): string | null => {
  if (node.id.type !== AST_NODE_TYPES.Identifier || !VOCABULARY_NAME_REG_EXP.test(node.id.name)) return null
  if (node.init?.type !== AST_NODE_TYPES.TSAsExpression || !isConstAssertion(node.init)) return null
  const object = node.init.expression
  if (object.type !== AST_NODE_TYPES.ObjectExpression || object.properties.length === 0) return null
  if (!object.properties.every(isLiteralProperty)) return null

  return node.id.name
}

/**
 * Whether the assertion is `as const` rather than a cast to a named type.
 *
 * @param tsAsExpression - The assertion the declaration is written with.
 * @returns Whether it is the const assertion.
 */
const isConstAssertion = (tsAsExpression: TSESTree.TSAsExpression): boolean =>
  tsAsExpression.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
  tsAsExpression.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
  tsAsExpression.typeAnnotation.typeName.name === 'const'

/**
 * Whether the member holds a literal, which is what a vocabulary is made of.
 *
 * @param property - One member of the object.
 * @returns Whether it holds a literal.
 */
const isLiteralProperty = (property: TSESTree.ObjectLiteralElement): boolean => {
  if (property.type !== AST_NODE_TYPES.Property || property.computed) return false
  const { value } = property

  return value.type === AST_NODE_TYPES.Literal && (typeof value.value === 'string' || typeof value.value === 'number')
}

/**
 * Whether the alias reads the object rather than repeating it: `(typeof X)[keyof typeof X]`.
 *
 * @param tsTypeAliasDeclaration - The alias the file declares.
 * @param name - The name the pair is declared under.
 * @returns Whether it derives.
 */
const derivesFrom = (tsTypeAliasDeclaration: TSESTree.TSTypeAliasDeclaration, name: string): boolean => {
  const annotation = tsTypeAliasDeclaration.typeAnnotation
  if (annotation.type !== AST_NODE_TYPES.TSIndexedAccessType) return false
  if (!isTypeQueryOf(annotation.objectType, name)) return false
  const { indexType } = annotation

  return indexType.type === AST_NODE_TYPES.TSTypeOperator && isTypeQueryOf(indexType.typeAnnotation, name)
}

/**
 * Whether the node is `typeof X` for the name, parentheses included.
 *
 * @param node - The node the alias is written with.
 * @param name - The name the pair is declared under.
 * @returns Whether it queries that value.
 */
const isTypeQueryOf = (node: TSESTree.TypeNode | undefined, name: string): boolean => {
  /* v8 ignore next -- the alias reads a value, which is what the index type queries */
  if (node?.type !== AST_NODE_TYPES.TSTypeQuery) return false

  return node.exprName.type === AST_NODE_TYPES.Identifier && node.exprName.name === name
}

/**
 * The statement the declaration belongs to, which is what the alias is written after.
 *
 * @param node - The declaration the rule reads.
 * @returns The statement, the export included.
 */
const statementOf = (node: TSESTree.VariableDeclarator): TSESTree.Node => {
  const declaration = node.parent
  if (declaration.parent.type === AST_NODE_TYPES.ExportNamedDeclaration) return declaration.parent

  /* v8 ignore next -- a declaration the rule reads belongs to a statement of the file */
  return declaration
}

/**
 * The alias the fix writes, exported when the value is.
 *
 * @param name - The name the pair is declared under.
 * @returns The lines to add.
 */
const derivationFor = (name: string): string => `\n\nexport type ${name} = ${typeExpressionFor(name)}`

/**
 * The expression a derived type is written with.
 *
 * @param name - The name the pair is declared under.
 * @returns The expression.
 */
const typeExpressionFor = (name: string): string => `(typeof ${name})[keyof typeof ${name}]`
