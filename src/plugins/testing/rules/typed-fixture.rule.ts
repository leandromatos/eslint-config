import type { ParserServicesWithTypeInformation, TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import ts from 'typescript'

import { buildRuleDocsUrl } from '../../shared/utils/build-rule-docs-url.util.js'
import { locateFile } from '../../shared/utils/locate-file.util.js'
import { OPTIONS_SCHEMA } from '../constants/options.constant.js'
import { EMPTY_OPTIONS } from '../constants/testing.constant.js'
import type { ArgumentUsage, TypedFixtureMessageId } from '../types/rules/typed-fixture.rule.type.js'
import type { TestingRule } from '../types/testing.type.js'

/** The name TypeScript gives the symbol of a type written as a literal, which carries no name to import. */
const ANONYMOUS_TYPE = '__type'

/**
 * A fixture built as an object literal and handed to the subject carries the type the subject
 * declares for it. An anonymous literal drifts in silence when the contract changes; the
 * annotation makes the test fail at compile time instead of passing on a shape nothing checks.
 */
export const typedFixture: TestingRule<TypedFixtureMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A fixture handed to the subject carries the type the subject declares for it.',
      url: buildRuleDocsUrl('testing', 'typed-fixture'),
      dialects: ['TypeScript'],
    },
    messages: {
      anonymousFixture:
        '"{{name}}" is an anonymous literal handed to "{{callee}}", which declares it as {{type}}. Annotate it.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [{ testFolder }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const { sourceCode } = context
    const parserServices = ESLintUtils.getParserServices(context)
    const typeChecker = parserServices.program.getTypeChecker()
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || node.id.typeAnnotation) return
        if (node.init?.type !== AST_NODE_TYPES.ObjectExpression) return
        const usage = findArgumentUsage(node, sourceCode)
        if (!usage) return
        const type = readDeclaredType(usage, parserServices, typeChecker)
        if (!type) return
        context.report({
          node: node.id,
          messageId: 'anonymousFixture',
          data: { name: node.id.name, callee: usage.callee, type },
        })
      },
    }

    return listener
  },
}

/**
 * Where the variable is passed as an argument: the call, the index of the argument, and the callee's text.
 *
 * @param declarator - The declaration of the fixture.
 * @param sourceCode - The source the fixture is written in.
 * @returns Where it is handed to the subject, and null where it is handed to nothing.
 */
const findArgumentUsage = (
  declarator: TSESTree.VariableDeclarator,
  sourceCode: TSESLint.SourceCode,
): ArgumentUsage | null => {
  for (const variable of sourceCode.getDeclaredVariables(declarator))
    for (const reference of variable.references) {
      const { identifier } = reference
      const { parent } = identifier
      if (parent?.type !== AST_NODE_TYPES.CallExpression || parent.callee === identifier) continue
      const index = parent.arguments.findIndex(argument => argument === identifier)
      const argumentUsage: ArgumentUsage = { call: parent, index, callee: sourceCode.getText(parent.callee) }

      return argumentUsage
    }

  return null
}

/**
 * The named type the callee declares for that argument, as the type-checker writes it.
 *
 * @param usage - Where the fixture is handed to the subject.
 * @param parserServices - What maps a node of the syntax tree onto the program.
 * @param typeChecker - What resolves a type of the program.
 * @returns The type, such as `CreateUserDto`, and null for a shape that carries no name or a rest parameter.
 */
const readDeclaredType = (
  usage: ArgumentUsage,
  parserServices: ParserServicesWithTypeInformation,
  typeChecker: ts.TypeChecker,
): string | null => {
  const callExpression = parserServices.esTreeNodeToTSNodeMap.get(usage.call)
  const signature = typeChecker.getResolvedSignature(callExpression)
  const parameter = signature?.getParameters()[usage.index]
  if (!parameter) return null
  // A rest parameter takes a list of the fixtures, so its type names no single fixture.
  const parameterDeclaration = parameter.valueDeclaration
  if (parameterDeclaration && ts.isParameter(parameterDeclaration) && parameterDeclaration.dotDotDotToken) return null
  const type = typeChecker.getTypeOfSymbol(parameter)
  const symbol = type.aliasSymbol ?? type.getSymbol()
  const declaration = symbol?.declarations?.[0]
  if (!symbol || !declaration || !/^[A-Z]/.test(symbol.name) || symbol.name === ANONYMOUS_TYPE) return null

  return typeChecker.typeToString(type)
}
