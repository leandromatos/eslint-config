import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils, TSESLint } from '@typescript-eslint/utils'
import { isIntersectionType, isTypeParameter as isTypeParameterType, isTypeReference, isUnionType } from 'ts-api-utils'
import type ts from 'typescript'

import { asList, locate, toCamelCase, toScreamingCase } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { NamingRule, VariableNamedByTypeMessageId } from '../types/index.js'

/**
 * A variable or a parameter of a named type ends with that type's name in camel case:
 * `userEntity`, `confirmEmailQuery`, `transformedActivityEntity`, `existingActivity`. The type says
 * what the value is, and the name is read where the type is not in view; what comes before the
 * type name is what tells two values of one type apart, a participle or an adjective. A list of
 * a type ends with its plural. An export is named by its file, a primitive by its content, and a
 * type parameter names nothing, so those are free. So is a name a test gives by role, from the
 * options: `result` is what the subject answered and `expected*` what it is compared to, and a
 * test reads by those two words before it reads by type.
 *
 * What comes before the type name is a prefix, and a prefix has one job: telling two values of
 * one type apart. It is kept when another value of the type shares the function, or when it is
 * the participle a producing verb gives its result; otherwise the name is the type alone, and
 * `httpServerApp: App` is `app`. A name that leaves as a shorthand property is fixed by the key,
 * which is the reader's contract, and the key is what the rule does not judge.
 */
export const variableByType: NamingRule<VariableNamedByTypeMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A variable or parameter of a named type ends with the name of the type.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/naming/docs/rules/variable-by-type.md',
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      lonePrefix:
        '"{{name}}" carries a prefix and no other {{type}} shares its scope. Name it {{expected}}: a prefix is what tells two of a type apart.',
      notNamedByType:
        '"{{name}}" is a {{type}}. Name it {{expected}}, or end it with that: the type says what it is, and the name is read where the type is not.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const parserServicesWithTypeInformation = ESLintUtils.getParserServices(context)
    const typeChecker = parserServicesWithTypeInformation.program.getTypeChecker()
    const [{ genericNames, roleNames, shapelessTypes, testFolder, verbParticiples }] = context.options
    const participles = Object.values(verbParticiples)
    const readType = (identifier: TSESTree.Identifier): string | null =>
      annotatedTypeNameOf(identifier) ??
      typeNameOf(typeChecker, parserServicesWithTypeInformation.getTypeAtLocation(identifier), genericNames)
    const where = locate(context)
    const isNamedByRole = (name: string): boolean =>
      Boolean(where?.segments.includes(testFolder)) && roleNames.some(role => opensWith(name, role))
    const judge = (identifier: TSESTree.Identifier, declaration: TSESTree.Node): void => {
      if (isNamedByRole(identifier.name)) return
      const type = readType(identifier)
      if (!type || shapelessTypes.includes(type)) return
      if (isTypeParameter(type, declaration) || isShorthandKey(identifier, declaration, sourceCode)) return
      if (endsWithType(identifier.name, type)) {
        const bare = bareNameOf(identifier.name, type)
        if (bare === identifier.name || participles.some(participle => opensWith(identifier.name, participle))) return
        if (sharesScopeWithAnother(identifier, type, declaration, sourceCode, readType)) return
        context.report({
          node: identifier,
          messageId: 'lonePrefix',
          data: { name: identifier.name, type, expected: bare },
          fix: ruleFixer => renameIn(ruleFixer, declaration, identifier, bare, sourceCode),
        })

        return
      }
      const expected = expectedNameOf(identifier.name, type)
      if (isTaken(expected, declaration, sourceCode)) return
      context.report({
        node: identifier,
        messageId: 'notNamedByType',
        data: { name: identifier.name, type, expected },
        fix: ruleFixer => renameIn(ruleFixer, declaration, identifier, expected, sourceCode),
      })
    }
    const listener: TSESLint.RuleListener = {
      ':function': (node: TSESTree.FunctionLike) => {
        for (const parameter of node.params) {
          const identifier = identifierOf(parameter)
          if (identifier) judge(identifier, node)
        }
      },
      VariableDeclarator: node => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || isExported(node)) return
        if (isRendered(node, sourceCode)) return
        judge(node.id, node.parent)
      },
    }

    return listener
  },
}

/**
 * Whether the value is written as a JSX element, which is what a component is.
 *
 * JSX reads a lowercase name as a tag of the language and an uppercase one as the component in scope, so a name the
 * render uses is the one thing renaming cannot reach: `<Icon />` renamed to `<lucideIcon />` stops being a component
 * and starts being an element the browser does not know.
 *
 * @param node - The declaration.
 * @param sourceCode - The source, to read what the declaration's references are.
 * @returns Whether a reference opens a JSX element.
 */
const isRendered = (node: TSESTree.VariableDeclarator, sourceCode: TSESLint.SourceCode): boolean =>
  sourceCode
    .getDeclaredVariables(node)
    .flatMap(variable => variable.references)
    .some(reference => reference.identifier.parent?.type === AST_NODE_TYPES.JSXOpeningElement)
/**
 * The name the annotation spells, when there is one and it is a bare name: `Database` for
 * `let database: Database`, whatever `Database` expands to. The checker sees the expansion, and
 * an alias with a defaulted argument looks instantiated to it; the annotation is what the author
 * wrote, and what the reader sees.
 *
 * @param identifier - The name as it is declared.
 * @returns The type's name, and null where the annotation spells none.
 */
const annotatedTypeNameOf = (identifier: TSESTree.Identifier): string | null => {
  const annotation = identifier.typeAnnotation?.typeAnnotation
  if (annotation?.type !== AST_NODE_TYPES.TSTypeReference || annotation.typeArguments) return null
  if (annotation.typeName.type !== AST_NODE_TYPES.Identifier) return null

  return annotation.typeName.name
}

/**
 * `UserEntity` for a `UserEntity`, `UserEntities` for a `UserEntity[]`, and null for a primitive,
 * a union, a generic instantiation, or an anonymous shape.
 *
 * @param typeChecker - What resolves a type of the program.
 * @param type - The type the checker answered.
 * @param genericNames - The generic types the options name, and the word each contributes.
 * @returns The name the value is judged against.
 */
const typeNameOf = (
  typeChecker: ts.TypeChecker,
  type: ts.Type,
  genericNames: Record<string, string>,
): string | null => {
  const wrapped = wrappedTypeOf(typeChecker, type, genericNames)
  if (wrapped) return wrapped
  if (isTypeReference(type) && typeChecker.isArrayType(type)) {
    const [element] = typeChecker.getTypeArguments(type)
    const name = element && namedTypeOf(typeChecker, element)
    if (!name) return null

    return pluralOf(name)
  }

  return namedTypeOf(typeChecker, type)
}

/**
 * `PaginatedActivityEntity` for a `PaginatedEntity<ActivityEntity>`, `Database` for a
 * `DeepMocked<Database>`: the wrapper's word, from the options, before the argument's name. A
 * wrapper the options do not list, or one holding no named type, names nothing.
 *
 * @param typeChecker - What resolves a type of the program.
 * @param type - The type the checker answered.
 * @param genericNames - The generic types the options name, and the word each contributes.
 * @returns The name, and null for a wrapper the options leave out.
 */
const wrappedTypeOf = (
  typeChecker: ts.TypeChecker,
  type: ts.Type,
  genericNames: Record<string, string>,
): string | null => {
  const outer = (type.aliasSymbol ?? type.getSymbol())?.name
  const word = wrapperWordOf(outer, genericNames)
  if (word === undefined) return null
  const [argument] = type.aliasTypeArguments ?? typeArgumentsOf(typeChecker, type)
  const inner = argument && namedTypeOf(typeChecker, argument)
  if (!inner) return null

  return `${word.charAt(0).toUpperCase()}${word.slice(1)}${inner}`
}

/**
 * The word the options give the wrapper, and nothing for a type with no symbol or one the options leave out.
 *
 * @param outer - The wrapper's own name, when the type has one.
 * @param genericNames - The generic types the options name, and the word each contributes.
 * @returns The word, and nothing for a wrapper the options leave out.
 */
const wrapperWordOf = (outer: string | undefined, genericNames: Record<string, string>): string | undefined => {
  if (outer === undefined) return undefined

  return genericNames[outer]
}

/**
 * The arguments a type reference was instantiated with, and none for a type that is not one.
 *
 * @param typeChecker - What resolves a type of the program.
 * @param type - The type the rule reads.
 * @returns The arguments.
 */
const typeArgumentsOf = (typeChecker: ts.TypeChecker, type: ts.Type): readonly ts.Type[] => {
  /* v8 ignore next -- the caller reads a generic the options named, which is a type reference */
  if (!isTypeReference(type)) return []

  return typeChecker.getTypeArguments(type)
}

/**
 * The declared name of a type, and null for anything the name would not describe: a union, a
 * type parameter, an instantiated generic, an anonymous shape.
 *
 * @param typeChecker - What resolves a type of the program.
 * @param type - The type the checker answered.
 * @returns The name.
 */
const namedTypeOf = (typeChecker: ts.TypeChecker, type: ts.Type): string | null => {
  if (isUnionType(type) || isIntersectionType(type) || isTypeParameterType(type)) return null
  if (type.aliasSymbol) {
    /* v8 ignore next -- an alias either takes arguments or does not, and the checker answers both the same way */
    if (type.aliasTypeArguments?.length) return null

    /* v8 ignore next -- the alias carries the name the branch above read it for */
    return type.aliasSymbol.name
  }
  if (isTypeReference(type) && typeChecker.getTypeArguments(type).length) return null
  const symbol = type.getSymbol()
  if (!symbol || symbol.name === '__type' || symbol.name === '__object') return null
  if (!/^[A-Z]/.test(symbol.name)) return null

  return symbol.name
}

/**
 * Whether a camel-case name opens with the word: `expectedResult` opens with `expected`, `expect` does not.
 *
 * @param name - The name as it is declared.
 * @param word - The word it is compared against.
 * @returns Whether the name opens with it.
 */
const opensWith = (name: string, word: string): boolean =>
  name.startsWith(word) && (name.length === word.length || /[A-Z0-9_]/.test(name.charAt(word.length)))

/**
 * Whether the name is a type parameter of the declaration or of what encloses it.
 *
 * @param name - The name the checker answered.
 * @param declaration - The declaration the identifier belongs to.
 * @returns Whether a type parameter declares it.
 */
const isTypeParameter = (name: string, declaration: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = declaration
  while (current) {
    if (
      'typeParameters' in current &&
      current.typeParameters?.params.some(tsTypeParameter => tsTypeParameter.name.name === name)
    )
      return true
    current = current.parent
  }

  return false
}

/**
 * Whether the variable leaves as a shorthand property, `{ database }`: the key is the contract of
 * whoever reads the object, and a shorthand needs the local to spell it.
 *
 * @param identifier - The name as it is declared.
 * @param declaration - The declaration the identifier belongs to.
 * @param sourceCode - The source it is written in.
 * @returns Whether the name is a key somebody reads.
 */
const isShorthandKey = (
  identifier: TSESTree.Identifier,
  declaration: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): boolean =>
  sourceCode
    .getDeclaredVariables(declaration)
    .filter(variable => variable.name === identifier.name)
    .flatMap(variable => variable.references)
    .some(reference => {
      const { parent } = reference.identifier

      return parent?.type === AST_NODE_TYPES.Property && parent.shorthand && parent.value === reference.identifier
    })

/**
 * Whether the name already ends with the type or its plural, in either case: `userEntity`, `DEFAULT_USER_ENTITY`,
 * `paginatedActivityEntities`.
 *
 * @param name - The name as it is declared.
 * @param type - The type's declared name.
 * @returns Whether the name ends with it.
 */
const endsWithType = (name: string, type: string): boolean => {
  const constant = isConstantCase(name)

  return [type, pluralOf(type)].some(form => {
    const suffix = casedLike(form, constant)

    return name.toLowerCase().endsWith(suffix.toLowerCase())
  })
}

/**
 * The name with no prefix: `app` for `httpServerApp: App`, `responses` for `tokenResponses:
 * Response[]`, the unused mark kept. A constant keeps its name: its prefix is its meaning.
 *
 * @param name - The name as it is declared.
 * @param type - The type's declared name.
 * @returns The name without its prefix.
 */
const bareNameOf = (name: string, type: string): string => {
  if (isConstantCase(name)) return name
  const unused = unusedMarkOf(name)
  const plural = name.toLowerCase().endsWith(toCamelCase(pluralOf(type)).toLowerCase())

  return `${unused}${toCamelCase(formOf(type, plural))}`
}

/**
 * Whether another value of the type is declared in the same function, which is what a prefix
 * is for: `existingActivity` beside `activity`, `remainingDevicesResponse` after `devicesResponse`.
 *
 * @param identifier - The name as it is declared.
 * @param type - The type's declared name.
 * @param declaration - The declaration the identifier belongs to.
 * @param sourceCode - The source it is written in.
 * @param readType - What answers the declared type of an identifier.
 * @returns Whether another value of the type shares the scope.
 */
const sharesScopeWithAnother = (
  identifier: TSESTree.Identifier,
  type: string,
  declaration: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
  readType: (identifier: TSESTree.Identifier) => string | null,
): boolean => {
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(declaration)
  while (scope) {
    const another = scope.variables.some(variable => {
      const [other] = variable.identifiers
      if (!other || other.type !== AST_NODE_TYPES.Identifier || other === identifier) return false

      return readType(other) === type
    })
    if (another) return true
    scope = upperScopeOf(scope)
  }

  return false
}

/**
 * The scope a name is looked up in next, and null at the function or the module, where the search stops.
 *
 * @param scope - The scope the search is in.
 * @returns The next scope, and null where the search stops.
 */
const upperScopeOf = (scope: TSESLint.Scope.Scope): TSESLint.Scope.Scope | null => {
  if (scope.type === TSESLint.Scope.ScopeType.function) return null
  /* v8 ignore next -- the walk starts inside a function or a block, never at the module itself */
  if (scope.type === TSESLint.Scope.ScopeType.module) return null

  return scope.upper
}

/**
 * Renames the declaration, every reference to it, and the `@param` tag that documents it.
 *
 * @param ruleFixer - What writes the fix.
 * @param declaration - The declaration the identifier belongs to.
 * @param identifier - The name as it is declared.
 * @param expected - The name the rule proposes.
 * @param sourceCode - The source it is written in.
 * @returns The fixes, one per place the name is written.
 */
const renameIn = (
  ruleFixer: TSESLint.RuleFixer,
  declaration: TSESTree.Node,
  identifier: TSESTree.Identifier,
  expected: string,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix[] => {
  const references = sourceCode
    .getDeclaredVariables(declaration)
    .filter(variable => variable.name === identifier.name)
    .flatMap(variable => variable.references.map(reference => reference.identifier))
  const ruleFixes = [identifier, ...references, ...fieldReferencesOf(identifier, sourceCode)]
    .filter((node, index, all) => all.indexOf(node) === index)
    .map(node => renameReference(ruleFixer, node, expected))
  const comment = sourceCode.getCommentsBefore(statementOf(declaration)).at(-1)
  if (!comment || comment.type !== AST_TOKEN_TYPES.Block) return ruleFixes
  const text = comment.value.replace(PARAM_TAG_REG_EXP, (whole, tag: string, name: string) => {
    if (name !== identifier.name) return whole

    return `${tag}${expected}`
  })
  if (text === comment.value) return ruleFixes

  return [...ruleFixes, ruleFixer.replaceText(comment, `/*${text}*/`)]
}

/**
 * Every `this.<name>` of the class, when the parameter is a property of it. A field is not a
 * variable, so scope analysis does not know its references; the class body is walked instead.
 *
 * @param identifier - The name as the constructor declares it.
 * @param sourceCode - The source it is written in.
 * @returns Every place the field is read.
 */
const fieldReferencesOf = (identifier: TSESTree.Identifier, sourceCode: TSESLint.SourceCode): TSESTree.Identifier[] => {
  if (identifier.parent.type !== AST_NODE_TYPES.TSParameterProperty) return []
  const classBody = sourceCode.getAncestors(identifier).find(node => node.type === AST_NODE_TYPES.ClassBody)
  /* v8 ignore next -- a property parameter is declared in a class, which is what holds the body */
  if (!classBody) return []
  const identifiers: TSESTree.Identifier[] = []
  const visit = (node: TSESTree.Node): void => {
    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      node.object.type === AST_NODE_TYPES.ThisExpression &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      node.property.name === identifier.name
    )
      identifiers.push(node.property)
    for (const child of childrenOf(node)) visit(child)
  }
  visit(classBody)

  return identifiers
}

/**
 * The AST nodes a node holds, whatever their keys.
 *
 * @param node - The node the walk reads.
 * @returns The nodes it holds.
 */
const childrenOf = (node: TSESTree.Node): TSESTree.Node[] =>
  Object.entries(node)
    .filter(([key]) => key !== 'parent')
    .flatMap(([, value]): unknown[] => asList(value))
    .filter((value): value is TSESTree.Node => typeof value === 'object' && value !== null && 'type' in value)

/**
 * The name is replaced where it is written, and its annotation kept. A name that leaves as a shorthand property is
 * never renamed: {@link isShorthandKey} refuses it before the rule reports.
 *
 * @param ruleFixer - What writes the fix.
 * @param node - Where the name is written.
 * @param expected - The name the rule proposes.
 * @returns The fix for that one place.
 */
const renameReference = (
  ruleFixer: TSESLint.RuleFixer,
  node: TSESTree.Identifier | TSESTree.JSXIdentifier,
  expected: string,
): TSESLint.RuleFix => ruleFixer.replaceTextRange([node.range[0], node.range[0] + node.name.length], expected)

/**
 * The statement a declaration belongs to, which is what its documentation comment precedes.
 *
 * @param declaration - The declaration the identifier belongs to.
 * @returns The statement the comment precedes.
 */
const statementOf = (declaration: TSESTree.Node): TSESTree.Node => {
  let current = declaration
  while (current.parent && current.parent.type !== AST_NODE_TYPES.Program && !ENCLOSING.has(current.parent.type)) {
    current = current.parent
  }

  return current
}

/** The nodes whose body a documented declaration sits in, so the walk stops at them. */
const ENCLOSING = new Set<AST_NODE_TYPES>([AST_NODE_TYPES.ClassBody, AST_NODE_TYPES.BlockStatement])

/** The tag of a documentation comment that names a parameter, and has to follow it when it is renamed. */
const PARAM_TAG_REG_EXP = /(@param\s+)(\w+)/g

/**
 * The name the rule proposes. A name is a prefix and a type: the words before the type are kept
 * and the words that stood for the type are replaced, so `runningUpdateActivityBody` becomes
 * `runningCreateActivityBody` and `query` becomes `confirmEmailQuery`. A plural name stays
 * plural. A constant takes the type in screaming case after what it had, and the unused mark
 * stays where it was.
 *
 * @param name - The name as it is declared.
 * @param type - The type's declared name.
 * @returns The name the rule proposes.
 */
const expectedNameOf = (name: string, type: string): string => {
  const unused = unusedMarkOf(name)
  const bare = name.slice(unused.length)
  if (isConstantCase(bare)) return `${name}_${toScreamingCase(type)}`
  const words = wordsOf(bare)
  const typeWords = wordsOf(type)
  /* v8 ignore next -- a name split into words always has a last one */
  const last = words[words.length - 1] ?? ''
  const plural = typeWords.some(typeWord => isPluralOf(last, typeWord))
  const prefix = prefixOf(words, typeWords).join('')
  const suffix = formOf(type, plural)

  return `${unused}${prefixed(prefix, suffix)}`
}

/**
 * Whether the name is a constant's: `PARAM_TAG`, `_UNUSED`.
 *
 * @param name - The name as it is declared.
 * @returns Whether it is a constant's.
 */
const isConstantCase = (name: string): boolean => /^_?[A-Z][A-Z0-9_]*$/.test(name)

/**
 * The mark a parameter the function does not read carries, which a rename keeps.
 *
 * @param name - The name as it is declared.
 * @returns The mark, and nothing for a parameter the function reads.
 */
const unusedMarkOf = (name: string): string => {
  if (name.startsWith(UNUSED)) return UNUSED

  return ''
}

/** What marks a parameter the function takes and does not read; the mark stays. */
const UNUSED = '_'

/**
 * `['running', 'Update', 'Activity', 'Body']` for `runningUpdateActivityBody`; an acronym is one word.
 *
 * @param name - The name as it is declared.
 * @returns The words, in order.
 */
/* v8 ignore next -- a name is made of words, so the pattern always matches one */
const wordsOf = (name: string): string[] => name.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/g) ?? []

/**
 * The words of a name that are its own and not the type's: `running` in
 * `runningUpdateActivityBody`, nothing in `query`. A word that shares nothing with the type but
 * is followed only by words that do, `Update` there, stood for the type and goes with it.
 *
 * @param words - The words of the name, in order.
 * @param typeWords - The words of the type, in order.
 * @returns The words that are the name's own.
 */
const prefixOf = (words: string[], typeWords: string[]): string[] => {
  const matches = words.map(word => typeWords.some(typeWord => isSameWord(word, typeWord)))
  const firstMatch = matches.indexOf(true)
  if (firstMatch < 0) return words
  const own = words.slice(0, firstMatch)
  if (own.length > 0 && matches.slice(firstMatch).every(Boolean)) own.pop()

  return own
}

/**
 * The type's name, plural where the value holds several.
 *
 * @param type - The type's declared name.
 * @param isPlural - Whether the value holds several.
 * @returns The form the name carries.
 */
const formOf = (type: string, isPlural: boolean): string => {
  if (isPlural) return pluralOf(type)

  return type
}

/**
 * Whether a word of a name stands for a word of the type: the same word, or one the plural of the other.
 *
 * @param word - The word of the name.
 * @param typeWord - The word of the type.
 * @returns Whether they stand for the same thing.
 */
const isSameWord = (word: string, typeWord: string): boolean =>
  word.toLowerCase() === typeWord.toLowerCase() || isPluralOf(word, typeWord) || isPluralOf(typeWord, word)

/**
 * `activities` for `Activity`, `bodies` for `Body`.
 *
 * @param word - The word of the name.
 * @param typeWord - The word of the type.
 * @returns Whether the first is the plural of the second.
 */
const isPluralOf = (word: string, typeWord: string): boolean => word.toLowerCase() === pluralOf(typeWord).toLowerCase()

/**
 * `Entities` for `Entity`, `Statuses` for `Status`, `Bodies` for `Body`; `Attributes` is already plural.
 *
 * @param name - The name in the singular.
 * @returns The name in the plural.
 */
const pluralOf = (name: string): string => {
  if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`
  if (/(ss|us|x|ch|sh)$/.test(name)) return `${name}es`
  if (name.endsWith('s')) return name

  return `${name}s`
}

/**
 * The type's name in the case the value is declared in: screaming for a constant, camel for anything else.
 *
 * @param form - The type's name, singular or plural.
 * @param isConstant - Whether the value is a constant.
 * @returns The name in that case.
 */
const casedLike = (form: string, isConstant: boolean): string => {
  if (isConstant) return toScreamingCase(form)

  return toCamelCase(form)
}

/**
 * The name the rule proposes: the prefix and the type, or the type alone when no prefix survives.
 *
 * @param prefix - What comes before the type in the name.
 * @param suffix - The type as the name carries it.
 * @returns The name.
 */
const prefixed = (prefix: string, suffix: string): string => {
  if (!prefix) return toCamelCase(suffix)

  return `${prefix}${suffix}`
}

/**
 * Whether the declaration already gives the name to something else: a second value of the type.
 *
 * @param name - The name the rule proposes.
 * @param declaration - The declaration the identifier belongs to.
 * @param sourceCode - The source it is written in.
 * @returns Whether the name is taken.
 */
const isTaken = (name: string, declaration: TSESTree.Node, sourceCode: TSESLint.SourceCode): boolean => {
  const scope = sourceCode.getScope(declaration)

  return (
    scope.set.has(name) ||
    scope.childScopes.some(child => child.set.has(name)) ||
    sourceCode.getDeclaredVariables(declaration).some(variable => variable.name === name)
  )
}

/**
 * The identifier a parameter declares, and null for a destructured or rest one.
 *
 * `this` is not a parameter: it is how a function annotates its own receiver, and the position it occupies carries
 * no argument. Renaming it changes the function's arity.
 *
 * @param parameter - The parameter the function declares.
 * @returns The identifier, and null for a pattern that declares none.
 */
const identifierOf = (parameter: TSESTree.Parameter): TSESTree.Identifier | null => {
  const inner = declaredParameterOf(parameter)
  if (inner.type === AST_NODE_TYPES.AssignmentPattern) return identifierOrNull(inner.left)
  if (inner.type !== AST_NODE_TYPES.Identifier || inner.name === 'this') return null

  return inner
}

/**
 * What a parameter declares: the parameter a property parameter wraps, or the parameter itself.
 *
 * @param parameter - The parameter the function declares.
 * @returns What it declares.
 */
const declaredParameterOf = (parameter: TSESTree.Parameter): TSESTree.Node => {
  if (parameter.type === AST_NODE_TYPES.TSParameterProperty) return parameter.parameter

  return parameter
}

/**
 * The node when it is an identifier, and null for a pattern that declares none.
 *
 * @param node - The node the rule reads.
 * @returns The identifier.
 */
const identifierOrNull = (node: TSESTree.Node): TSESTree.Identifier | null => {
  if (node.type === AST_NODE_TYPES.Identifier) return node

  return null
}

/**
 * Whether the declaration is what a module exports, which the file names instead.
 *
 * @param declarator - The declaration the rule judges.
 * @returns Whether the module exports it.
 */
const isExported = (declarator: TSESTree.VariableDeclarator): boolean =>
  declarator.parent.parent.type === AST_NODE_TYPES.ExportNamedDeclaration
