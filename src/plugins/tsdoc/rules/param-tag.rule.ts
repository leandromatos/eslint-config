import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type {
  CommentReporter,
  DocBlockTag,
  Parameter,
  ParameterizedNode,
  ParamTagMessageId,
  TsdocRule,
} from '../types/index.js'
import { ParameterKind } from '../types/index.js'
import {
  findDocBlock,
  inheritsDoc,
  isDescribedFunction,
  isSetter,
  lineLocationOf,
  parseDocBlock,
  readParameters,
} from '../utils/index.js'

/**
 * A documented function lists every parameter it takes in a `@param`, in the order of the signature, once, with a
 * description.
 *
 * Every parameter a caller passes needs a tag, in the kinds of function `requiredTagContexts` names. A setter takes
 * the value it is assigned, and a comment that inherits its documentation documents nothing here, so neither is
 * asked. A destructured parameter needs no tag, and a tag at its position may take any name. A dotted name documents
 * a property, so the order reads the names without a dot. The first tag out of place is reported, and nothing after it.
 * A property of an interface typed as a function compares its names with the parameters of that type.
 */
export const paramTag: TsdocRule<ParamTagMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A documented function lists every parameter in a @param, in order, once, with a description.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/param-tag.md',
      dialects: ['TypeScript'],
    },
    messages: {
      missingParam: 'The comment carries no @param for "{{name}}".',
      unknownParam: 'The @param "{{name}}" names no parameter of the function.',
      paramOrder: 'The @param names read "{{got}}", and the parameters read "{{expected}}".',
      duplicateParam: 'The @param "{{name}}" is written twice.',
      missingParamDescription: 'The @param "{{name}}" carries no description.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ requiredTagContexts }] = context.options
    const { sourceCode } = context
    const judge = (node: ParameterizedNode, declaredParameters: TSESTree.Parameter[]): void => {
      const comment = findDocBlock(sourceCode, node)
      if (!comment) return
      const docBlock = parseDocBlock(comment)
      const paramTags = docBlock.tags.filter(docBlockTag => docBlockTag.tag === 'param')
      const parameters = readParameters(declaredParameters)
      const reportOnComment: CommentReporter = (messageId, messageValues) =>
        context.report({ loc: comment.loc, messageId, data: messageValues })
      judgeNames(paramTags, parameters, reportOnComment)
      if (requiredTagContexts.includes(node.type) && !isSetter(node) && !inheritsDoc(docBlock))
        judgePresence(paramTags, parameters, reportOnComment)
      if (!isDescribedFunction(node)) return
      for (const paramTag of paramTags.filter(docBlockTag => docBlockTag.description === ''))
        context.report({
          loc: lineLocationOf(paramTag.line),
          messageId: 'missingParamDescription',
          data: { name: paramTag.parameterName },
        })
    }
    const judgeParameters = (node: TSESTree.FunctionLike | TSESTree.TSMethodSignature): void => judge(node, node.params)
    const listener: TSESLint.RuleListener = {
      ':function': judgeParameters,
      TSDeclareFunction: judgeParameters,
      TSMethodSignature: judgeParameters,
      TSPropertySignature: node => {
        const typeAnnotation = node.typeAnnotation?.typeAnnotation
        if (typeAnnotation?.type === AST_NODE_TYPES.TSFunctionType) judge(node, typeAnnotation.params)
      },
    }

    return listener
  },
}

/**
 * Compares the names of the tags with the parameters: no name twice, none past the last parameter, each at the
 * position of its parameter.
 *
 * @param paramTags - The `@param` tags of the comment, in order.
 * @param parameters - The parameters of the signature, in order.
 * @param reportOnComment - What a mismatch is reported through.
 */
const judgeNames = (paramTags: DocBlockTag[], parameters: Parameter[], reportOnComment: CommentReporter): void => {
  const names = paramTags.map(paramTag => paramTag.parameterName)
  const duplicate = names.find((name, index) => names.indexOf(name) !== index)
  if (duplicate !== undefined) {
    reportOnComment('duplicateParam', { name: duplicate })

    return
  }
  const rootNames = names.filter(name => !name.includes('.'))
  for (const [index, name] of rootNames.entries()) {
    const parameter = parameters[index]
    if (!parameter) {
      reportOnComment('unknownParam', { name })

      return
    }
    if (parameter.kind !== ParameterKind.DESTRUCTURED && name !== parameter.name) {
      const expected = parameters.map((each, position) => expectedNameOf(each, rootNames[position])).join(', ')
      reportOnComment('paramOrder', { got: rootNames.join(', '), expected })

      return
    }
  }
}

/**
 * Reports every parameter a caller passes that no tag names. A destructured parameter has no name to look for.
 *
 * @param paramTags - The `@param` tags of the comment.
 * @param parameters - The parameters of the signature.
 * @param reportOnComment - What a missing tag is reported through.
 */
const judgePresence = (paramTags: DocBlockTag[], parameters: Parameter[], reportOnComment: CommentReporter): void => {
  const documented = new Set(paramTags.map(paramTag => paramTag.parameterName))
  for (const parameter of parameters) {
    if (parameter.kind === ParameterKind.DESTRUCTURED || documented.has(parameter.name)) continue
    reportOnComment('missingParam', { name: parameter.name })
  }
}

/**
 * The name a tag at the position of a parameter is expected to carry, as the order message lists it.
 *
 * @param parameter - The parameter.
 * @param documentedName - The name the tag at that position carries, when there is one.
 * @returns The name of the parameter, spread for a rest one, and the tag's own for a destructured one.
 */
const expectedNameOf = (parameter: Parameter, documentedName: string | undefined): string => {
  if (parameter.kind === ParameterKind.REST) return `...${parameter.name}`
  if (parameter.kind === ParameterKind.DESTRUCTURED) return documentedName ?? ''

  return parameter.name
}
