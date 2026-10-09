import fs from 'node:fs'
import path from 'node:path'

import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, findTestSuffix, locateFile, toPascalCase } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DescribesSourceMessageId, TestingRule } from '../types/index.js'

/** The call a spec opens its outermost block with. */
const DESCRIBE = 'describe'

/** A declaration a source exports under its own name, whatever the keywords before it. */
const DECLARED_EXPORT_REG_EXP =
  /^export (?:declare )?(?:default )?(?:abstract )?(?:async )?(?:const|let|var|class|function\*?|interface|type|enum) (\w+)/gm

/** A list of names a source exports, written on one line or over several. */
const LISTED_EXPORT_REG_EXP = /^export (?:type )?\{([^}]*)\}/gm

/**
 * Every outermost `describe` of a spec that mirrors a source names something that source exports:
 * `UsersService` for `users.service.spec.ts`, `toStoredTimestamp` for
 * `to-stored-timestamp.util.spec.ts`, `bindRequestContext` and `readRequestOrigin` for a util
 * exporting both. The name is what the runner prints, so a spec named after something else
 * reports on it. The source's exports are read from its file; where the source cannot be read,
 * the name of the file stands in.
 */
export const describesSource: TestingRule<DescribesSourceMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'The outermost describe of a mirroring spec names the mirrored source.',
      url: buildRuleDocsUrl('testing', 'describes-source'),
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
    const where = locateFile(context)
    const [{ testFolder, mirroringTestKinds, suffixToFolder }] = context.options
    if (!where || where.suffix !== findTestSuffix(suffixToFolder, testFolder)) return {}
    const at = where.segments.indexOf(testFolder)
    const kind = where.segments[at + 1]
    if (at < 0 || !kind || !mirroringTestKinds.includes(kind)) return {}
    const source = path.join(
      where.sourceRoot,
      ...where.segments.slice(0, at),
      ...where.segments.slice(at + 2),
      where.stem,
    )
    const expected = listExpectedSubjects(readSourceExports(source), where.stem)
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
 * Reads the names a source file exports, written as a module or as a component, and none when neither can be read.
 *
 * @param sourceWithoutExtension - The absolute path of the mirrored source, up to its extension.
 * @returns The names it exports.
 */
const readSourceExports = (sourceWithoutExtension: string): string[] => {
  const source = [`${sourceWithoutExtension}.ts`, `${sourceWithoutExtension}.tsx`].find(file => fs.existsSync(file))
  if (!source) return []
  const text = fs.readFileSync(source, 'utf8')
  const declared = [...text.matchAll(DECLARED_EXPORT_REG_EXP)].flatMap(match => match.slice(1, 2))
  const listed = [...text.matchAll(LISTED_EXPORT_REG_EXP)]
    .flatMap(match => match.slice(1, 2))
    .flatMap(list => list.split(','))
    .flatMap(entry =>
      entry
        .trim()
        .split(/\s+as\s+/)
        .slice(-1),
    )
    .filter(Boolean)

  return [...declared, ...listed]
}

/**
 * The names the outermost describe may carry: what the source exports, or, where the source cannot be read, what its
 * file name stands for, with and without the layer suffix.
 *
 * @param exported - The names the source exports.
 * @param stem - The file name before its suffix.
 * @returns The names.
 */
const listExpectedSubjects = (exported: string[], stem: string): string[] => {
  if (exported.length) return exported

  return [toPascalCase(stem), toPascalCase(stem.replace(/\.[^.]+$/, ''))]
}
