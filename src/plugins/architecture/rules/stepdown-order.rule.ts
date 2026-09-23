import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, ModuleFunction, StepdownOrderMessageId } from '../types/index.js'

/**
 * A module reads top down, the way a caller would walk it: a function comes after every
 * function that calls it, and two functions called by the same one come in the order it calls
 * them, unless one of them reaches the other, in which case the first rule decides. Two
 * functions that call each other are left where they are.
 */
export const stepdownOrder: ArchitectureRule<StepdownOrderMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A top-level function comes after its callers, in the order they call it.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/stepdown-order.md',
      dialects: ['TypeScript'],
    },
    messages: {
      calleeBeforeCaller:
        '"{{callee}}" is declared before "{{caller}}", which calls it. A function comes after its callers; move it down.',
      siblingsOutOfOrder:
        '"{{later}}" is declared before "{{earlier}}", but "{{caller}}" calls "{{earlier}}" first. Functions come in the order their caller calls them.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const listener: TSESLint.RuleListener = {
      'Program:exit': program => {
        const [{ definitionTimeDirectives }] = context.options
        const moduleFunctions = readModuleFunctions(program, context.sourceCode)
        const evaluatedAtImport = readImportTimeNames(program, context.sourceCode)
        const capturedAtDefinition = readDefinitionTimeNames(program, context.sourceCode, definitionTimeDirectives)
        const position = new Map(moduleFunctions.map((moduleFunction, index) => [moduleFunction.name, index]))
        const byName = new Map(moduleFunctions.map(moduleFunction => [moduleFunction.name, moduleFunction]))
        for (const moduleFunction of moduleFunctions) {
          const callees = moduleFunction.calls.filter(
            name => byName.has(name) && !byName.get(name)?.calls.includes(moduleFunction.name),
          )
          for (const callee of callees) {
            const target = byName.get(callee)
            /* v8 ignore next -- both names come from the map the positions were built from */
            if (!target || (position.get(callee) ?? 0) > (position.get(moduleFunction.name) ?? 0)) continue
            if (!target.hoisted && evaluatedAtImport.has(callee)) continue
            if (capturedAtDefinition.has(callee)) continue
            context.report({
              node: target.node,
              messageId: 'calleeBeforeCaller',
              data: { callee, caller: moduleFunction.name },
            })
          }
          for (const [index, earlier] of callees.entries()) {
            const later = callees[index + 1]
            /* v8 ignore next -- both names come from the map the positions were built from */
            if (!later || (position.get(earlier) ?? 0) < (position.get(later) ?? 0)) continue
            if (reaches(later, earlier, byName) || reaches(earlier, later, byName)) continue
            if (isCalledInReverse(later, earlier, moduleFunctions, moduleFunction.name)) continue
            const node = byName.get(later)?.node
            if (node)
              context.report({
                node,
                messageId: 'siblingsOutOfOrder',
                data: { later, earlier, caller: moduleFunction.name },
              })
          }
        }
      },
    }

    return listener
  },
}

/**
 * Whether another function calls the two in the opposite order, which leaves the pair with no order to be in.
 *
 * Two callers asking for opposite orders is not something the file can answer, and reporting it would ask the author
 * to move a function back and forth; the first caller in the file is the one whose order stands.
 *
 * @param later - The function declared second.
 * @param earlier - The function declared first.
 * @param moduleFunctions - Every function the module declares.
 * @param caller - The function whose order is being judged.
 * @returns Whether another caller disagrees.
 */
const isCalledInReverse = (
  later: string,
  earlier: string,
  moduleFunctions: ModuleFunction[],
  caller: string,
): boolean =>
  moduleFunctions.some(moduleFunction => {
    if (moduleFunction.name === caller) return false
    const at = moduleFunction.calls.indexOf(later)
    const after = moduleFunction.calls.indexOf(earlier)

    return at >= 0 && after >= 0 && at < after
  })

/**
 * Whether `from` calls `to`, directly or through other functions of the module.
 *
 * @param from - The function the walk starts at.
 * @param to - The function the walk looks for.
 * @param byName - Every function the module declares, by name.
 * @param seen - The functions the walk already passed, which is what ends a cycle.
 * @returns Whether it reaches it.
 */
const reaches = (from: string, to: string, byName: Map<string, ModuleFunction>, seen = new Set<string>()): boolean => {
  /* v8 ignore next -- the walk only follows names the module declares */
  if (seen.has(from)) return false
  seen.add(from)
  /* v8 ignore next -- the walk only follows names the module declares */
  const calls = byName.get(from)?.calls ?? []
  if (calls.includes(to)) return true

  return calls.some(next => reaches(next, to, byName, seen))
}

/**
 * The functions the module declares at its top level, in order, each with the names it calls in order.
 *
 * @param program - The file, as the parser read it.
 * @param sourceCode - The source the functions are written in.
 * @returns The functions, in the order they are declared.
 */
const readModuleFunctions = (program: TSESTree.Program, sourceCode: TSESLint.SourceCode): ModuleFunction[] => {
  const moduleFunctions: ModuleFunction[] = []
  for (const statement of program.body) {
    const declaration = unwrapExport(statement)
    /* v8 ignore next -- an export of the module declares what it exports */
    if (!declaration) continue
    if (declaration.type === AST_NODE_TYPES.FunctionDeclaration && declaration.id) {
      moduleFunctions.push({
        name: declaration.id.name,
        node: statement,
        calls: referencedNames(declaration, sourceCode),
        hoisted: true,
      })
    }
    if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) continue
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== AST_NODE_TYPES.Identifier || !isFunctionExpression(declarator.init)) continue
      moduleFunctions.push({
        name: declarator.id.name,
        node: statement,
        calls: referencedNames(declarator.init, sourceCode),
        hoisted: false,
      })
    }
  }

  return moduleFunctions
}

/**
 * The names a module reaches while it is being imported, rather than when something calls it.
 *
 * A value declared at the top level runs its initializer on import, so every function that initializer reaches has
 * to be declared above it. Moving one down puts the call inside the callee's temporal dead zone, and the module
 * throws the moment it loads.
 *
 * @param program - The module, as it was parsed.
 * @param sourceCode - The source, for the scope analysis the parser did.
 * @returns The names an initializer reaches.
 */
const readImportTimeNames = (program: TSESTree.Program, sourceCode: TSESLint.SourceCode): Set<string> => {
  const names = new Set<string>()
  for (const statement of program.body) {
    const declaration = unwrapExport(statement)
    if (declaration?.type !== AST_NODE_TYPES.VariableDeclaration) continue
    for (const declarator of declaration.declarations) {
      if (!declarator.init || isFunctionExpression(declarator.init)) continue
      for (const name of referencedNames(declarator.init, sourceCode)) names.add(name)
    }
  }

  return names
}

/**
 * The names a function reaches where it is declared, because a directive hands its closure over there.
 *
 * The runtime behind such a directive rewrites the function into a factory called at its declaration, a function
 * declaration included, so what it calls is read at that moment and has to be declared above it, hoisting or not.
 *
 * @param program - The module, as it was parsed.
 * @param sourceCode - The source, for the scope analysis the parser did.
 * @param definitionTimeDirectives - The directives that make a function read its closure where it is declared.
 * @returns The names such a function reaches.
 */
const readDefinitionTimeNames = (
  program: TSESTree.Program,
  sourceCode: TSESLint.SourceCode,
  definitionTimeDirectives: string[],
): Set<string> => {
  const names = new Set<string>()
  for (const statement of program.body) {
    const declaration = unwrapExport(statement)
    const functions = readDeclaredFunctions(declaration)
    for (const declaredFunction of functions) {
      if (!opensWith(declaredFunction, definitionTimeDirectives)) continue
      for (const name of referencedNames(declaredFunction, sourceCode)) names.add(name)
    }
  }

  return names
}

const unwrapExport = (statement: TSESTree.ProgramStatement): TSESTree.Node | null => {
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) return statement.declaration

  return statement
}

/**
 * The functions a top-level statement declares, by declaration or by initializer.
 *
 * @param declaration - The statement, with its export taken off.
 * @returns The functions, none when it declares no function.
 */
const readDeclaredFunctions = (
  declaration: TSESTree.Node | null,
): (TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression)[] => {
  if (declaration?.type === AST_NODE_TYPES.FunctionDeclaration) return [declaration]
  if (declaration?.type !== AST_NODE_TYPES.VariableDeclaration) return []

  return declaration.declarations
    .map(declarator => declarator.init)
    .filter((init): init is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression =>
      isFunctionExpression(init),
    )
}

/**
 * Whether a function body opens with one of the directives, in its prologue.
 *
 * @param node - The function.
 * @param directives - The directives to look for.
 * @returns Whether the prologue names one of them.
 */
const opensWith = (
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression,
  directives: string[],
): boolean => {
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) return false

  return node.body.body.some(
    statement =>
      statement.type === AST_NODE_TYPES.ExpressionStatement &&
      typeof statement.directive === 'string' &&
      directives.includes(statement.directive),
  )
}

/**
 * The identifiers a function body resolves outside itself, in source order and once each, by the
 * scope analysis the parser did.
 *
 * @param node - The function the walk reads.
 * @param sourceCode - The source the function is written in.
 * @returns The names, in the order the body reaches them.
 */
const referencedNames = (node: TSESTree.Node, sourceCode: TSESLint.SourceCode): string[] => {
  const references: TSESLint.Scope.Reference[] = []
  const visit = (scope: TSESLint.Scope.Scope): void => {
    references.push(...scope.through)
    scope.childScopes.forEach(visit)
  }
  visit(sourceCode.getScope(node))
  references.sort(
    (leftReference, rightReference) => leftReference.identifier.range[0] - rightReference.identifier.range[0],
  )

  return [...new Set(references.map(reference => reference.identifier.name))]
}

const isFunctionExpression = (
  node: TSESTree.Expression | null,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression =>
  node?.type === AST_NODE_TYPES.ArrowFunctionExpression || node?.type === AST_NODE_TYPES.FunctionExpression
