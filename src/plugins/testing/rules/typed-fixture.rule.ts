import path from 'node:path'

import type { ParserServicesWithTypeInformation, TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import type ts from 'typescript'

import { buildRuleDocsUrl, locateFile } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type {
  ArgumentUsage,
  DeclaredType,
  FixtureFixOrigin,
  TestingRule,
  TypedFixtureMessageId,
} from '../types/index.js'

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
    fixable: 'code',
    messages: {
      anonymousFixture:
        '"{{name}}" is an anonymous literal handed to "{{callee}}", which declares it as {{type}}. Annotate it.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [{ testFolder, alias }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const { sourceCode } = context
    const file = path.resolve(context.cwd, context.filename)
    const fixOrigin: FixtureFixOrigin = { sourceRoot: where.sourceRoot, file, alias }
    const parserServices = ESLintUtils.getParserServices(context)
    const typeChecker = parserServices.program.getTypeChecker()
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || node.id.typeAnnotation) return
        if (node.init?.type !== AST_NODE_TYPES.ObjectExpression) return
        const usage = findArgumentUsage(node, sourceCode)
        if (!usage) return
        const declared = readDeclaredType(usage, parserServices, typeChecker)
        if (!declared) return
        const identifier = node.id
        context.report({
          node: identifier,
          messageId: 'anonymousFixture',
          data: { name: identifier.name, callee: usage.callee, type: declared.name },
          fix: ruleFixer => annotateFixture(ruleFixer, identifier, declared, sourceCode, fixOrigin),
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
 * The named type the callee declares for that argument, with the file that declares it.
 *
 * @param usage - Where the fixture is handed to the subject.
 * @param parserServices - What maps a node of the syntax tree onto the program.
 * @param typeChecker - What resolves a type of the program.
 * @returns The type's name and where it is declared, and null for a shape that carries no name.
 */
const readDeclaredType = (
  usage: ArgumentUsage,
  parserServices: ParserServicesWithTypeInformation,
  typeChecker: ts.TypeChecker,
): DeclaredType | null => {
  const callExpression = parserServices.esTreeNodeToTSNodeMap.get(usage.call)
  const signature = typeChecker.getResolvedSignature(callExpression)
  const parameter = signature?.getParameters()[usage.index]
  if (!parameter) return null
  const type = typeChecker.getTypeOfSymbol(parameter)
  const symbol = type.aliasSymbol ?? type.getSymbol()
  const declaration = symbol?.declarations?.[0]
  if (!symbol || !declaration || !/^[A-Z]/.test(symbol.name) || symbol.name === ANONYMOUS_TYPE) return null
  const declaredType: DeclaredType = { name: symbol.name, file: declaration.getSourceFile().fileName }

  return declaredType
}

/**
 * Adds the annotation, and the import of the type when the file has none.
 *
 * @param ruleFixer - What writes the fix.
 * @param identifier - The fixture's name.
 * @param declared - The type the subject declares, and where it is declared.
 * @param sourceCode - The source the fixture is written in.
 * @param fixOrigin - The file being fixed, and how it names a barrel.
 * @returns The fixes, and null where the type cannot be reached by an import.
 */
const annotateFixture = (
  ruleFixer: TSESLint.RuleFixer,
  identifier: TSESTree.Identifier,
  declared: DeclaredType,
  sourceCode: TSESLint.SourceCode,
  fixOrigin: FixtureFixOrigin,
): TSESLint.RuleFix[] | null => {
  const ruleFixes = [ruleFixer.insertTextAfter(identifier, `: ${declared.name}`)]
  const program = sourceCode.ast
  const importDeclarations = program.body.filter(
    (statement): statement is TSESTree.ImportDeclaration => statement.type === AST_NODE_TYPES.ImportDeclaration,
  )
  const imported = importDeclarations.some(importDeclaration =>
    importDeclaration.specifiers.some(specifier => specifier.local.name === declared.name),
  )
  // A type the file declares itself is already in scope, and an import of it would point at the file itself.
  if (imported || path.resolve(declared.file) === fixOrigin.file) return ruleFixes
  const source = readTypeBarrel(declared.file, fixOrigin)
  if (!source) return null
  const line = `import type { ${declared.name} } from '${source}'`
  const importFix = writeImportFix(ruleFixer, importDeclarations.at(-1), program, line)

  return [...ruleFixes, importFix]
}

/**
 * Reads the barrel a type is imported from, which is the one of the directory that declares it: `@/policies/dtos` for
 * a type declared under `src/policies/dtos/`, and null for a file outside the source root or at its root, where no
 * barrel sits.
 *
 * @param file - Where the type is declared.
 * @param fixOrigin - The source root the alias reaches, and the alias.
 * @returns The specifier the import is written with.
 */
const readTypeBarrel = (file: string, fixOrigin: FixtureFixOrigin): string | null => {
  const relative = path.relative(fixOrigin.sourceRoot, file)
  if (relative.startsWith('..')) return null
  const directories = relative.split(path.sep).slice(0, -1)
  if (directories.length === 0) return null

  return [fixOrigin.alias, ...directories].join('/')
}

/**
 * Writes the fix that imports the type: after the last import of the file, or at its top when it has none.
 *
 * @param ruleFixer - What writes the fix.
 * @param lastImport - The last import declaration of the file, when it has one.
 * @param program - The file.
 * @param line - The import to add.
 * @returns The fix.
 */
const writeImportFix = (
  ruleFixer: TSESLint.RuleFixer,
  lastImport: TSESTree.ImportDeclaration | undefined,
  program: TSESTree.Program,
  line: string,
): TSESLint.RuleFix => {
  if (!lastImport) return ruleFixer.insertTextBefore(program, `${line}\n`)

  return ruleFixer.insertTextAfter(lastImport, `\n${line}`)
}
