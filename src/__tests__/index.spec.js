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

  it('passes clean code', async () => {
    const result = await lint('export const value = () => 1\n', 'sample.js')

    expect(result.errorCount).toBe(0)
  })
})
