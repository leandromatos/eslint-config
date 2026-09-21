import type { Linter } from 'eslint'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

import { firstLintResult } from '../../../__tests__/utils/index.js'
import { recommended } from '../../index.js'

/*
 * The package's own entries come from `typescript-eslint`, which declares `languageOptions` through
 * `@typescript-eslint/utils` rather than through `@eslint/core`. The two describe the same object, and only the linter
 * that runs here has to be told so.
 */
const eslint = new ESLint({ overrideConfigFile: true, baseConfig: recommended() as Linter.Config[] })

const lint = async (code: string, filePath: string): Promise<ESLint.LintResult> =>
  firstLintResult(await eslint.lintText(code, { filePath }), filePath)

describe('recommended', () => {
  it('answers a non-empty flat config array', () => {
    expect(recommended()).toBeInstanceOf(Array)
    expect(recommended().length).toBeGreaterThan(0)
  })

  it('ignores what a tool wrote, plus what the project adds', () => {
    const ignoring = recommended({ ignores: ['agents'] }).find(entry => entry.ignores && !entry.files)

    expect(ignoring?.ignores).toEqual(['**/.claude', '**/coverage', '**/dist', 'agents'])
  })

  it('flags relative parent imports', async () => {
    const result = await lint("import { x } from '../x'\n\nexport const y = () => x\n", 'sample.js')

    expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('no-restricted-imports')
  })

  it('flags unsorted imports', async () => {
    const result = await lint("import b from 'b'\nimport a from 'a'\n\nexport const x = () => a || b\n", 'sample.js')

    expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('simple-import-sort/imports')
  })

  it('parses JSX in a .jsx file', async () => {
    /*
     * The base layer matches .jsx, so it has to be able to read it. Without JSX enabled on that layer the file died
     * with "Parsing error: Unexpected token <" instead of being linted.
     */
    const result = await lint('export const Legacy = ({ title }) => <h1>{title}</h1>\n', 'sample.jsx')

    expect(result.messages.map(lintMessage => lintMessage.message)).not.toContain('Parsing error: Unexpected token <')
    expect(result.fatalErrorCount).toBe(0)
  })

  it('passes clean code', async () => {
    const result = await lint('export const value = () => 1\n', 'sample.js')

    expect(result.errorCount).toBe(0)
  })

  it('lints JSON structurally', async () => {
    const result = await lint('{ "a": 1, "a": 2 }\n', 'sample.json')

    expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('jsonc/no-dupe-keys')
  })

  it('lints Markdown structurally', async () => {
    const result = await lint('# Title\n\n[text]()\n', 'sample.md')

    expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('markdown/no-empty-links')
  })

  it('leaves no-missing-label-refs off', async () => {
    /*
     * Turned off on purpose, and worth pinning: the rule misreads the bracket syntax used by checklists and shortcut
     * references.
     */
    const result = await lint('# Title\n\n[broken][missing]\n', 'sample.md')

    expect(result.messages.map(lintMessage => lintMessage.ruleId)).not.toContain('markdown/no-missing-label-refs')
  })

  /*
   * These need real files. The type-checked layer runs through projectService, which resolves a file against the
   * nearest tsconfig. A path handed to lintText that does not exist on disk is reported as outside the project instead
   * of being linted, which is why the cases above all use .js.
   */
  describe('layers that need a TypeScript project', () => {
    const lintFixture = async (name: string): Promise<ESLint.LintResult> =>
      firstLintResult(await esLint.lintFiles([`src/configs/__tests__/fixtures/invalid/${name}`]), name)

    const esLint = new ESLint({ overrideConfigFile: true, baseConfig: recommended() as Linter.Config[] })

    it('reports a floating promise', async () => {
      const result = await lintFixture('floating-promise.ts')

      expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain(
        '@typescript-eslint/no-floating-promises',
      )
    })

    it('reports an image without alt text', async () => {
      const result = await lintFixture('missing-alt.tsx')

      expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('jsx-a11y/alt-text')
    })

    it('refuses an enum, which no transpiler can inline', async () => {
      const result = await lintFixture('closed-set.ts')

      expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('no-restricted-syntax')
    })

    it('refuses a builtin imported without its protocol', async () => {
      const result = await lintFixture('bare-builtin.ts')

      expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('no-restricted-syntax')
    })

    it('refuses a catch that answers every failure with one value', async () => {
      const result = await lintFixture('swallowed-catch.ts')

      expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('no-restricted-syntax')
    })

    it('reports a hook called conditionally', async () => {
      const result = await lintFixture('conditional-hook.tsx')

      expect(result.messages.map(lintMessage => lintMessage.ruleId)).toContain('react-hooks/rules-of-hooks')
    })
  })
})
