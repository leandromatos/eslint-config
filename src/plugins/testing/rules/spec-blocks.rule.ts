import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate, receiverOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { SpecBlocksMessageId, TestingRule } from '../types/index.js'

const TEST_CALLS = new Set(['it', 'test'])
const BLOCK_LABEL_REG_EXP = /^\s*(arrange|act|assert)\b/i
const BLOCKS_AT_MOST = 3

/**
 * A test body is made of at most three blocks, arrange, act and assert, and a blank line is
 * what separates them, so no comment labels a block. A fourth block is a second test hiding in
 * the first, or a blank line inside a block; and the first assertion opens the last block, so it
 * never sits on the line after the act.
 */
export const specBlocks: TestingRule<SpecBlocksMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A test body has at most three blocks, separated by blank lines.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/testing/docs/rules/spec-blocks.md',
      dialects: ['TypeScript'],
    },
    fixable: 'whitespace',
    messages: {
      assertJoinsAct: 'The first assertion shares its block with the act. A blank line opens the assert block.',
      tooManyBlocks:
        'This test has {{count}} blocks. Arrange, act and assert make three; split the test, or join two blocks.',
      labelComment: 'A comment labels a block. The blank line is the label; remove the comment.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ testFolder }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const { sourceCode } = context
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        if (callExpression.callee.type !== AST_NODE_TYPES.Identifier || !TEST_CALLS.has(callExpression.callee.name))
          return
        const body = testBodyOf(callExpression)
        if (!body) return
        const blocks = splitByBlankLines(body.body, sourceCode.lines)
        if (blocks.length > BLOCKS_AT_MOST) {
          context.report({ node: body, messageId: 'tooManyBlocks', data: { count: String(blocks.length) } })
        }
        const assertion = firstAssertionOf(body.body)
        if (!assertion) return
        /* v8 ignore next -- the assertion came from the statements the blocks were split from */
        const assertBlock = blocks.find(block => block.includes(assertion)) ?? []
        const act = assertBlock
          .slice(0, assertBlock.indexOf(assertion))
          .find(statement => !isRead(statement, sourceCode))
        if (act)
          context.report({
            node: assertion,
            messageId: 'assertJoinsAct',
            /* The blank line opens before the indentation of the assertion, so the line it leaves behind is empty. */
            fix: ruleFixer =>
              ruleFixer.insertTextBeforeRange(
                [sourceCode.getIndexFromLoc({ line: assertion.loc.start.line, column: 0 }), 0],
                '\n',
              ),
          })
        for (const comment of sourceCode.getCommentsInside(body)) {
          if (BLOCK_LABEL_REG_EXP.test(comment.value)) context.report({ node: comment, messageId: 'labelComment' })
        }
      },
    }

    return listener
  },
}

/**
 * The block of the function a test call receives, when it receives one.
 *
 * @param callExpression - The `it` or `test` call.
 * @returns The body, and null for a test written without one.
 */
const testBodyOf = (callExpression: TSESTree.CallExpression): TSESTree.BlockStatement | null => {
  const callback = callExpression.arguments[1]
  if (!callback) return null
  const isFunction =
    callback.type === AST_NODE_TYPES.ArrowFunctionExpression || callback.type === AST_NODE_TYPES.FunctionExpression
  if (!isFunction || callback.body.type !== AST_NODE_TYPES.BlockStatement) return null

  return callback.body
}

/**
 * A statement that only reads a value the assertions look at: a declaration with nothing awaited
 * in it. Anything else before the first assertion in its block is the act, which the blank line
 * should have set apart.
 *
 * @param statement - The statement the block holds.
 * @param sourceCode - The source the statement is written in.
 * @returns Whether it only reads.
 */
const isRead = (statement: TSESTree.Statement, sourceCode: TSESLint.SourceCode): boolean =>
  statement.type === AST_NODE_TYPES.VariableDeclaration && !/\bawait\b/.test(sourceCode.getText(statement))

/**
 * The first statement that is an `expect(...)` call, awaited or not.
 *
 * @param statements - The statements of the test body, in order.
 * @returns The assertion, and null for a body that asserts nothing.
 */
const firstAssertionOf = (statements: TSESTree.Statement[]): TSESTree.Statement | null =>
  statements.find(
    statement =>
      statement.type === AST_NODE_TYPES.ExpressionStatement && isExpectCall(unwrapAwait(statement.expression)),
  ) ?? null

/**
 * Whether the call chain starts at `expect(...)`: `expect(x).toBe(y)`, `expect(x).rejects.toThrow(y)`.
 *
 * @param expression - The expression the statement holds.
 * @returns Whether it is an assertion.
 */
const isExpectCall = (expression: TSESTree.Expression): boolean => {
  let current: TSESTree.Node = expression
  while (current.type === AST_NODE_TYPES.CallExpression || current.type === AST_NODE_TYPES.MemberExpression)
    current = receiverOf(current)
  if (current.type !== AST_NODE_TYPES.Identifier || current.name !== 'expect') return false
  const parent = current.parent

  return parent?.type === AST_NODE_TYPES.CallExpression && parent.callee === current
}

const unwrapAwait = (expression: TSESTree.Expression): TSESTree.Expression => {
  if (expression.type === AST_NODE_TYPES.AwaitExpression) return expression.argument

  return expression
}

/**
 * Consecutive statements with no blank line between them form one block; a comment is not a blank line.
 *
 * @param statements - The statements of the test body, in order.
 * @param lines - The lines of the file, which is where a blank line is read.
 * @returns The blocks, in order.
 */
const splitByBlankLines = (statements: TSESTree.Statement[], lines: string[]): TSESTree.Statement[][] => {
  const blocks: TSESTree.Statement[][] = []
  let previous: TSESTree.Statement | null = null
  for (const statement of statements) {
    const startsBlock = !previous || hasBlankLineBetween(lines, previous.loc.end.line, statement.loc.start.line)
    if (startsBlock) blocks.push([])
    blocks[blocks.length - 1]?.push(statement)
    previous = statement
  }

  return blocks
}

/**
 * Whether any line strictly between the two (1-based) is empty.
 *
 * @param lines - The lines of the file.
 * @param from - The line the statement above ends on.
 * @param to - The line the statement below opens on.
 * @returns Whether a blank line separates them.
 */
const hasBlankLineBetween = (lines: string[], from: number, to: number): boolean =>
  lines.slice(from, to - 1).some(line => line.trim() === '')
