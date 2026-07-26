import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

import config from '../index.js'

const eslint = new ESLint({ overrideConfigFile: true, baseConfig: config })

const lint = async (code, filePath) => {
  const [result] = await eslint.lintText(code, { filePath })

  return result
}

describe('eslint-config', () => {
  it('exports a non-empty flat config array', () => {
    expect(Array.isArray(config)).toBe(true)
    expect(config.length).toBeGreaterThan(0)
  })

  it('flags relative parent imports', async () => {
    const result = await lint("import { x } from '../x'\n\nexport const y = () => x\n", 'sample.js')

    expect(result.messages.map(message => message.ruleId)).toContain('no-restricted-imports')
  })

  it('flags unsorted imports', async () => {
    const result = await lint("import b from 'b'\nimport a from 'a'\n\nexport const x = () => a || b\n", 'sample.js')

    expect(result.messages.map(message => message.ruleId)).toContain('simple-import-sort/imports')
  })

  it('parses JSX in a .jsx file', async () => {
    // The base layer matches .jsx, so it has to be able to read it. Without JSX
    // enabled on that layer the file died with "Parsing error: Unexpected token
    // <" instead of being linted.
    const result = await lint('export const Legacy = ({ title }) => <h1>{title}</h1>\n', 'sample.jsx')

    expect(result.messages.map(message => message.message)).not.toContain('Parsing error: Unexpected token <')
    expect(result.fatalErrorCount).toBe(0)
  })

  it('passes clean code', async () => {
    const result = await lint('export const value = () => 1\n', 'sample.js')

    expect(result.errorCount).toBe(0)
  })

  it('lints JSON structurally', async () => {
    const result = await lint('{ "a": 1, "a": 2 }\n', 'sample.json')

    expect(result.messages.map(message => message.ruleId)).toContain('jsonc/no-dupe-keys')
  })

  it('lints Markdown structurally', async () => {
    const result = await lint('# Title\n\n[text]()\n', 'sample.md')

    expect(result.messages.map(message => message.ruleId)).toContain('markdown/no-empty-links')
  })

  it('leaves no-missing-label-refs off', async () => {
    // Turned off on purpose, and worth pinning: the rule misreads the bracket
    // syntax used by checklists and shortcut references.
    const result = await lint('# Title\n\n[broken][missing]\n', 'sample.md')

    expect(result.messages.map(message => message.ruleId)).not.toContain('markdown/no-missing-label-refs')
  })

  // These need real files. The type-checked layer runs through projectService,
  // which resolves a file against the nearest tsconfig — a path handed to
  // lintText that does not exist on disk is reported as outside the project
  // instead of being linted, which is why the cases above all use .js.
  describe('layers that need a TypeScript project', () => {
    const lintFixture = async name => {
      const [result] = await onDisk.lintFiles([`fixtures/invalid/${name}`])

      return result
    }

    const onDisk = new ESLint({ overrideConfigFile: true, baseConfig: config })

    it('reports a floating promise', async () => {
      const result = await lintFixture('floating-promise.ts')

      expect(result.messages.map(message => message.ruleId)).toContain('@typescript-eslint/no-floating-promises')
    })

    it('reports an image without alt text', async () => {
      const result = await lintFixture('missing-alt.tsx')

      expect(result.messages.map(message => message.ruleId)).toContain('jsx-a11y/alt-text')
    })
  })
})
