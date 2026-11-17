import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isBarrel } from '../../../utils/is-barrel.util.js'

describe('isBarrel', () => {
  let directory: string

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'is-barrel-'))
  })

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true })
  })

  const writeIndex = (sourceText: string, fileName = 'index.ts'): void => {
    fs.writeFileSync(path.join(directory, fileName), sourceText)
  }

  it('answers false for a directory with no index file', () => {
    expect(isBarrel(directory)).toBe(false)
  })

  it.each([
    ['a re-export of everything', "export * from './a.js'"],
    ['a re-export as a namespace', "export * as a from './a.js'"],
    ['a re-export by name', "export { a } from './a.js'"],
    ['an empty re-export, which loads the module', "export {} from './a.js'"],
    ['a re-export with a type beside a value', "export { type A, a } from './a.js'"],
    ['an import passed on by name', "import { a } from './a.js'\n\nexport { a }"],
    ['an import passed on under another name', "import { a } from './a.js'\n\nexport { a as b }"],
    ['a namespace passed on whole', "import * as users from './users.js'\n\nexport { users }"],
    ['a default import passed on as the default', "import a from './a.js'\n\nexport default a"],
    ['a re-export beside code', "export * from './a.js'\n\nexport const b = 1"],
    ['a default import passed on by export assignment', "import a from './a.js'\n\nexport = a"],
    ['a default import passed on through `as`', "import a from './a.js'\n\nexport default a as A"],
    ['a default import passed on through `satisfies`', "import a from './a.js'\n\nexport default (a as A) satisfies A"],
    ['an import assigned through `satisfies`', "import a from './a.js'\n\nexport = a satisfies A"],
    ['a required module passed on', "import a = require('./a.js')\n\nexport { a }"],
    ['a required module exported where it is bound', "export import a = require('./a.js')"],
  ])('reads an index file with %s as a barrel', (_label, sourceText) => {
    writeIndex(sourceText)

    expect(isBarrel(directory)).toBe(true)
  })

  it.each([
    ['nothing', ''],
    ['a declaration', 'export const a = 1'],
    ['a local name exported', 'const a = 1\n\nexport { a }'],
    ['a default export of a value', 'export default 1'],
    ['a default export of a name nothing imports', 'export default a'],
    ['a default export of a local value through `as`', 'const a = 1\n\nexport default a as number'],
    ['a type re-export of everything', "export type * from './a.js'"],
    ['a type re-export by name', "export type { A } from './a.js'"],
    ['an inline type re-export', "export { type A } from './a.js'"],
    ['a type import passed on', "import type { A } from './a.js'\n\nexport { A }"],
    ['an inline type import passed on', "import { type A } from './a.js'\n\nexport { A }"],
    ['a type passed on by an inline type export', "import { a } from './a.js'\n\nexport { type a }"],
    ['an import run for its side effect', "import './a.js'"],
    ['a local value passed on by export assignment', 'const a = 1\n\nexport = a'],
  ])('reads an index file with %s as no barrel', (_label, sourceText) => {
    writeIndex(sourceText)

    expect(isBarrel(directory)).toBe(false)
  })

  it('reads an index file that does not parse as no barrel, rather than stopping the run', () => {
    writeIndex("export * from './a.js'\nexport const = ")

    expect(isBarrel(directory)).toBe(false)
  })

  it.each(['.ts', '.tsx', '.d.ts', '.js', '.jsx'])(
    'reads a directory as no barrel when a %s file takes its path',
    extension => {
      writeIndex("export * from './a.js'")
      fs.writeFileSync(`${directory}${extension}`, 'export const a = 1')

      const isDirectoryBarrel = isBarrel(directory)
      fs.rmSync(`${directory}${extension}`)

      expect(isDirectoryBarrel).toBe(false)
    },
  )

  it('reads the component index file when no module index file sits beside it', () => {
    writeIndex("export * from './a.js'", 'index.tsx')

    expect(isBarrel(directory)).toBe(true)
  })
})
