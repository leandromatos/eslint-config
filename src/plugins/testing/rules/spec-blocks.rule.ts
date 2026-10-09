import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import {
  buildRuleDocsUrl,
  isFunctionNode,
  locateFile,
  readChildNodes,
  readReceiver,
  unwrapAwait,
} from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { SpecBlocksMessageId, TestingRule } from '../types/index.js'

/** The calls a test is written with, bare or through a modifier: `it`, `test`, `it.only`, `it.each([...])`. */
const TEST_CALLS = new Set(['it', 'test'])

/** The members that leave a call a test, across Vitest, Jest and Playwright. */
const TEST_MODIFIERS = new Set([
  'concurrent',
  'each',
  'fail',
  'failing',
  'fails',
  'fixme',
  'only',
  'runIf',
  'sequential',
  'skip',
  'skipIf',
  'todo',
])

/** A comment that names a block, which the blank line already does. */
const BLOCK_LABEL_REG_EXP = /^\s*(arrange|act|assert)\b/i

/** Arrange, act and assert. */
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
      url: buildRuleDocsUrl('testing', 'spec-blocks'),
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
    const where = locateFile(context)
    const [{ testFolder }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const { sourceCode } = context
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        if (!isTestCall(callExpression)) return
        const body = findTestBody(callExpression)
        if (!body) return
        const blocks = splitByBlankLines(body.body, sourceCode.lines)
        if (blocks.length > BLOCKS_AT_MOST)
          context.report({ node: body, messageId: 'tooManyBlocks', data: { count: String(blocks.length) } })
        const assertion = findFirstAssertion(body.body)
        if (!assertion) return
        const assertBlock = blocks.filter(block => block.includes(assertion)).flat()
        const act = assertBlock.slice(0, assertBlock.indexOf(assertion)).find(statement => !isRead(statement))
        if (act)
          context.report({
            node: assertion,
            messageId: 'assertJoinsAct',
            // The blank line opens before the indentation of the assertion, so the line it leaves behind is empty.
            fix: ruleFixer =>
              ruleFixer.insertTextBeforeRange(
                [sourceCode.getIndexFromLoc({ line: assertion.loc.start.line, column: 0 }), 0],
                '\n',
              ),
          })
        for (const comment of sourceCode.getCommentsInside(body))
          if (BLOCK_LABEL_REG_EXP.test(comment.value)) context.report({ node: comment, messageId: 'labelComment' })
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
const findTestBody = (callExpression: TSESTree.CallExpression): TSESTree.BlockStatement | null => {
  const callback = callExpression.arguments[1]
  if (!isFunctionNode(callback) || callback.body.type !== AST_NODE_TYPES.BlockStatement) return null

  return callback.body
}

/**
 * Whether a call writes a test: `it` or `test`, bare, through a modifier such as `it.only`, or called on what a
 * modifier such as `it.each([...])` returns.
 *
 * @param callExpression - The call the rule reads.
 * @returns Whether it writes a test.
 */
const isTestCall = (callExpression: TSESTree.CallExpression): boolean => {
  let root: TSESTree.Node = callExpression.callee
  while (root.type === AST_NODE_TYPES.CallExpression || root.type === AST_NODE_TYPES.MemberExpression) {
    if (root.type === AST_NODE_TYPES.MemberExpression && !isTestModifier(root)) return false
    root = readReceiver(root)
  }

  return root.type === AST_NODE_TYPES.Identifier && TEST_CALLS.has(root.name)
}

/**
 * Whether a member of a test call keeps it a test, as `only` and `each` do, rather than naming a group, a hook or a
 * step of one: `test.describe`, `test.beforeEach`, `test.step`.
 *
 * @param member - The member the call reads.
 * @returns Whether it is a modifier of a test.
 */
const isTestModifier = (member: TSESTree.MemberExpression): boolean =>
  member.property.type === AST_NODE_TYPES.Identifier && TEST_MODIFIERS.has(member.property.name)

/**
 * Whether a statement only reads a value the assertions look at: a declaration with nothing awaited in it. Anything
 * else before the first assertion in its block is the act, which the blank line should have set apart.
 *
 * @param statement - The statement the block holds.
 * @returns Whether it only reads.
 */
const isRead = (statement: TSESTree.Statement): boolean =>
  statement.type === AST_NODE_TYPES.VariableDeclaration && !hasAwait(statement)

/**
 * Whether a node awaits something of its own: an `await` in it, and not one inside a function it declares, which waits
 * only when that function is called.
 *
 * @param node - The node the walk reads.
 * @returns Whether it awaits.
 */
const hasAwait = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.AwaitExpression ||
  readChildNodes(node).some(child => !isFunctionNode(child) && hasAwait(child))

/**
 * The first statement that is an `expect(...)` call, awaited or not.
 *
 * @param statements - The statements of the test body, in order.
 * @returns The assertion, and null for a body that asserts nothing.
 */
const findFirstAssertion = (statements: TSESTree.Statement[]): TSESTree.Statement | null =>
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
    current = readReceiver(current)
  if (current.type !== AST_NODE_TYPES.Identifier || current.name !== 'expect') return false
  const parent = current.parent

  return parent?.type === AST_NODE_TYPES.CallExpression && parent.callee === current
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
