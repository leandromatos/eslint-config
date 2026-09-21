import fs from 'node:fs'
import path from 'node:path'

import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate, toPascalCase } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { SpecDescribesSourceMessageId, TestingRule } from '../types/index.js'

const DESCRIBE = 'describe'

/** What a source exports by name: a declaration of its own, or names re-exported in a list. */
const EXPORT_REG_EXP =
  /^export (?:abstract )?(?:const|class|function|interface|type|enum) (\w+)|^export (?:type )?\{([^}]*)\}/gm

/**
 * Every outermost `describe` of a spec that mirrors a source names something that source exports:
 * `UsersService` for `users.service.spec.ts`, `toStoredTimestamp` for
 * `to-stored-timestamp.util.spec.ts`, `bindRequestContext` and `readRequestOrigin` for a util
 * exporting both. The name is what the runner prints, so a spec named after something else
 * reports on it. The source's exports are read from its file; where the source cannot be read,
 * the name of the file stands in.
 */
export const describesSource: TestingRule<SpecDescribesSourceMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'The outermost describe of a mirroring spec names the mirrored source.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/testing/docs/rules/describes-source.md',
      dialects: ['TypeScript'],
    },
    messages: {
      wrongSubject:
        'The outermost describe is "{{subject}}"; this spec mirrors "{{stem}}", so it describes {{expected}}.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ testFolder, mirroringTestKinds, suffixToFolder }] = context.options
    const testSuffix = Object.keys(suffixToFolder).find(key => suffixToFolder[key] === testFolder)
    if (!where || where.suffix !== testSuffix) return {}
    const at = where.segments.indexOf(testFolder)
    const kind = where.segments[at + 1]
    if (at < 0 || !kind || !mirroringTestKinds.includes(kind)) return {}
    const source = path.join(
      context.cwd,
      'src',
      ...where.segments.slice(0, at),
      ...where.segments.slice(at + 2),
      `${where.stem}.ts`,
    )
    const expected = expectedSubjectsOf(exportsOf(source), where.stem)
    const listener: TSESLint.RuleListener = {
      'Program > ExpressionStatement > CallExpression': (callExpression: TSESTree.CallExpression) => {
        if (callExpression.callee.type !== AST_NODE_TYPES.Identifier || callExpression.callee.name !== DESCRIBE) return
        const subject = callExpression.arguments[0]
        if (!subject || subject.type !== AST_NODE_TYPES.Literal || typeof subject.value !== 'string') return
        const subjectName = subject.value
        if (expected.some(name => name.toLowerCase() === subjectName.toLowerCase())) return
        context.report({
          node: subject,
          messageId: 'wrongSubject',
          data: { subject: subjectName, stem: where.stem, expected: expected.join(' or ') },
        })
      },
    }

    return listener
  },
}

/**
 * The names a source file exports, and none when the file cannot be read.
 *
 * @param source - The absolute path of the mirrored source.
 * @returns The names it exports.
 */
const exportsOf = (source: string): string[] => {
  if (!fs.existsSync(source)) return []
  const text = fs.readFileSync(source, 'utf8')

  return [...text.matchAll(EXPORT_REG_EXP)].flatMap(namesOf)
}

/**
 * What one match exports: the name it declares, or the names it re-exports, each under the name it leaves by.
 *
 * @param regExpExecArray - One match of the export pattern.
 * @returns The names.
 */
const namesOf = (regExpExecArray: RegExpExecArray): string[] => {
  const declared = regExpExecArray[1]
  if (declared) return [declared]

  /* v8 ignore next -- the pattern matched one of its two groups */
  return (regExpExecArray[2] ?? '').split(',').map(
    name =>
      name
        .trim()
        .split(/\s+as\s+/)
        /* v8 ignore next -- a name split on `as` always has a last part */
        .pop() ?? '',
  )
}

/**
 * The names the outermost describe may carry: what the source exports, or, where the source cannot be read, what its
 * file name stands for, with and without the layer suffix.
 *
 * @param exported - The names the source exports.
 * @param stem - The file name before its suffix.
 * @returns The names.
 */
const expectedSubjectsOf = (exported: string[], stem: string): string[] => {
  if (exported.length) return exported

  return [toPascalCase(stem), toPascalCase(stem.replace(/\.[^.]+$/, ''))]
}
