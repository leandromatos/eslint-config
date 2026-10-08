import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `param-tag` reports. */
export type ParamTagMessageId =
  'missingParam' | 'unknownParam' | 'paramOrder' | 'duplicateParam' | 'missingParamDescription'

/** What a judge of `param-tag` reports through: a message and its data, on the comment. */
export type CommentReporter = (messageId: ParamTagMessageId, messageValues: Record<string, string>) => void

/** What `param-tag` reads the parameters of: a function, a method signature, or a property typed as a function. */
export type ParameterizedNode = TSESTree.FunctionLike | TSESTree.TSMethodSignature | TSESTree.TSPropertySignature
