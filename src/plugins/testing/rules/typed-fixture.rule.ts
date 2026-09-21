import path from 'node:path'

import type { ParserServicesWithTypeInformation, TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import type ts from 'typescript'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { TestingRule, TypedTestDataMessageId } from '../types/index.js'

/**
 * A fixture built as an object literal and handed to the subject carries the type the subject
 * declares for it. An anonymous literal drifts in silence when the contract changes; the
 * annotation makes the test fail at compile time instead of passing on a shape nothing checks.
 */
export const typedFixture: TestingRule<TypedTestDataMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A fixture handed to the subject carries the type the subject declares for it.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/testing/docs/rules/typed-fixture.md',
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      anonymousData:
        '"{{name}}" is an anonymous literal handed to "{{callee}}", which declares it as {{type}}. Annotate it.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ testFolder }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const { sourceCode } = context
    const parserServicesWithTypeInformation = ESLintUtils.getParserServices(context)
    const typeChecker = parserServicesWithTypeInformation.program.getTypeChecker()
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || node.id.typeAnnotation) return
        if (node.init?.type !== AST_NODE_TYPES.ObjectExpression) return
        const usage = argumentUsageOf(node, sourceCode)
        if (!usage) return
        const declared = declaredTypeOf(usage, parserServicesWithTypeInformation, typeChecker)
        if (!declared) return
        const identifier = node.id
        context.report({
          node: identifier,
          messageId: 'anonymousData',
          data: { name: identifier.name, callee: usage.callee, type: declared.name },
          fix: ruleFixer => annotate(ruleFixer, identifier, declared, sourceCode, context.cwd, context.filename),
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
const argumentUsageOf = (
  declarator: TSESTree.VariableDeclarator,
  sourceCode: TSESLint.SourceCode,
): { call: TSESTree.CallExpression; index: number; callee: string } | null => {
  for (const variable of sourceCode.getDeclaredVariables(declarator)) {
    for (const reference of variable.references) {
      const { identifier } = reference
      const { parent } = identifier
      if (identifier.type !== AST_NODE_TYPES.Identifier || parent?.type !== AST_NODE_TYPES.CallExpression) continue
      const index = parent.arguments.indexOf(identifier)
      /* v8 ignore next -- the reference the walk found is the argument it was looking for */
      if (index < 0) continue

      return { call: parent, index, callee: sourceCode.getText(parent.callee) }
    }
  }

  return null
}

/**
 * The named type the callee declares for that argument, with the file that declares it.
 *
 * @param usage - Where the fixture is handed to the subject.
 * @param parserServicesWithTypeInformations - What maps a node of the syntax tree onto the program.
 * @param typeChecker - What resolves a type of the program.
 * @returns The type's name and where it is declared, and null for a shape that carries no name.
 */
const declaredTypeOf = (
  usage: { call: TSESTree.CallExpression; index: number },
  parserServicesWithTypeInformations: ParserServicesWithTypeInformation,
  typeChecker: ts.TypeChecker,
): { name: string; file: string } | null => {
  const callExpression = parserServicesWithTypeInformations.esTreeNodeToTSNodeMap.get(usage.call)
  const signature = typeChecker.getResolvedSignature(callExpression)
  const parameter = signature?.getParameters()[usage.index]
  if (!parameter) return null
  const type = typeChecker.getTypeOfSymbol(parameter)
  const symbol = type.aliasSymbol ?? type.getSymbol()
  const declaration = symbol?.declarations?.[0]
  if (!symbol || !declaration || !/^[A-Z]/.test(symbol.name) || symbol.name === '__type') return null

  return { name: symbol.name, file: declaration.getSourceFile().fileName }
}

/**
 * Adds the annotation, and the import of the type when the file has none.
 *
 * @param ruleFixer - What writes the fix.
 * @param identifier - The fixture's name.
 * @param declared - The type the subject declares, and where it is declared.
 * @param sourceCode - The source the fixture is written in.
 * @param cwd - The directory ESLint runs in.
 * @param filename - The file being fixed.
 * @returns The fixes, and null where the type cannot be reached by an import.
 */
const annotate = (
  ruleFixer: TSESLint.RuleFixer,
  identifier: TSESTree.Identifier,
  declared: { name: string; file: string },
  sourceCode: TSESLint.SourceCode,
  cwd: string,
  filename: string,
): TSESLint.RuleFix[] | null => {
  const ruleFixes = [ruleFixer.insertTextAfter(identifier, `: ${declared.name}`)]
  const program = sourceCode.ast
  const importDeclarations = program.body.filter(
    (statement): statement is TSESTree.ImportDeclaration => statement.type === AST_NODE_TYPES.ImportDeclaration,
  )
  const imported = importDeclarations.some(importDeclaration =>
    importDeclaration.specifiers.some(specifier => specifier.local.name === declared.name),
  )
  /* A type the file declares itself is already in scope, and an import of it would point at the file itself. */
  if (imported || path.resolve(cwd, declared.file) === path.resolve(cwd, filename)) return ruleFixes
  const source = barrelOf(declared.file, cwd)
  if (!source) return null
  const last = importDeclarations.at(-1)
  const line = `import type { ${declared.name} } from '${source}'\n`
  /* v8 ignore next -- a file that hands a fixture to a subject imports that subject */
  if (!last) return [...ruleFixes, ruleFixer.insertTextBefore(program, line)]

  return [...ruleFixes, ruleFixer.insertTextAfter(last, `\n${line.trimEnd()}`)]
}

/**
 * `@/policies/dtos` for a type declared under `src/policies/dtos/`, and null for a file outside `src/`.
 *
 * @param file - Where the type is declared.
 * @param cwd - The directory ESLint runs in.
 * @returns The specifier the import is written with.
 */
const barrelOf = (file: string, cwd: string): string | null => {
  const relative = path.relative(path.join(cwd, 'src'), file)
  /* v8 ignore next -- the type the checker resolved is declared under the source root the rule walks */
  if (relative.startsWith('..')) return null
  const [module, folder] = relative.split(path.sep)
  if (!module || !folder || folder.endsWith('.ts')) return null

  return `@/${module}/${folder}`
}
