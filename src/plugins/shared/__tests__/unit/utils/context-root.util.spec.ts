import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isContextRoot } from '../../../utils/index.js'

const FOLDERS = ['services', 'types']

describe('isContextRoot', () => {
  let cwd: string

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'context-root-'))
  })

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  const makeDirectory = (...segments: string[]): void => {
    fs.mkdirSync(path.join(cwd, ...segments), { recursive: true })
  }

  it.each(['.', 'apps/x', 'libs/x', 'packages/x'])(
    'reads the context under the source root of the package at %s',
    packageDirectory => {
      makeDirectory(packageDirectory, 'src', 'config', 'database', 'types')
      const sourceRoot = path.join(cwd, packageDirectory, 'src')

      const isRoot = isContextRoot(sourceRoot, ['config', 'database'], 'database', FOLDERS)

      expect(isRoot).toBe(true)
    },
  )

  it('reads the context under the outermost root when a module is named src', () => {
    makeDirectory('src', 'a', 'src', 'types')

    const isRoot = isContextRoot(path.join(cwd, 'src'), ['a', 'src'], 'src', FOLDERS)

    expect(isRoot).toBe(true)
  })

  it('answers false for a context that carries no responsibility folder', () => {
    makeDirectory('apps', 'x', 'src', 'config', 'loose', 'helpers')

    const isRoot = isContextRoot(path.join(cwd, 'apps', 'x', 'src'), ['config', 'loose'], 'loose', FOLDERS)

    expect(isRoot).toBe(false)
  })

  it('answers false for a file not named after its directory, and for one at the root of the sources', () => {
    const sourceRoot = path.join(cwd, 'src')

    expect(isContextRoot(sourceRoot, ['config', 'database'], 'read', FOLDERS)).toBe(false)
    expect(isContextRoot(sourceRoot, [], 'main', FOLDERS)).toBe(false)
  })
})
