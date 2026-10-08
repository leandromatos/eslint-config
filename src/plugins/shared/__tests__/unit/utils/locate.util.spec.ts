import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { locate } from '../../../utils/index.js'

const cwd = path.resolve('/repository')

describe('locate', () => {
  it('roots a file at the src of the working directory', () => {
    const location = locate({ cwd, filename: 'src/users/services/user.service.ts' })

    expect(location).toEqual({
      packageRoot: cwd,
      sourceRoot: path.join(cwd, 'src'),
      file: 'user.service.ts',
      segments: ['users', 'services'],
      module: 'users',
      suffix: 'service',
      stem: 'user',
    })
  })

  it.each(['apps/x', 'libs/x', 'packages/x'])('roots a file at the src of the package under %s', packageDirectory => {
    const location = locate({ cwd, filename: path.join(packageDirectory, 'src', 'users', 'user.service.ts') })

    expect(location).toMatchObject({
      packageRoot: path.join(cwd, packageDirectory),
      sourceRoot: path.join(cwd, packageDirectory, 'src'),
      segments: ['users'],
      module: 'users',
    })
  })

  it('reads an absolute path the same as one relative to the working directory', () => {
    const location = locate({ cwd, filename: path.join(cwd, 'apps', 'x', 'src', 'main.ts') })

    expect(location).toMatchObject({ sourceRoot: path.join(cwd, 'apps', 'x', 'src'), segments: [], module: '' })
  })

  it('keeps a module named src inside the sources as a module, under the outermost root', () => {
    const location = locate({ cwd, filename: 'src/a/src/b.ts' })

    expect(location).toMatchObject({ sourceRoot: path.join(cwd, 'src'), segments: ['a', 'src'], module: 'a' })
  })

  it('reads a file at the root of the sources, named without a suffix', () => {
    const location = locate({ cwd, filename: 'libs/x/src/main.ts' })

    expect(location).toMatchObject({ file: 'main.ts', segments: [], module: '', suffix: null, stem: 'main' })
  })

  it('reads the last suffix of a name with more than one, and keeps the rest as the stem', () => {
    const location = locate({ cwd, filename: 'src/users/__tests__/user.service.spec.ts' })

    expect(location).toMatchObject({ suffix: 'spec', stem: 'user.service' })
  })

  it.each(['scripts/build.ts', 'main.ts', 'apps/x/src.ts', 'apps/x/test/user.spec.ts'])(
    'answers null for %s, which has no src directory in its path',
    filename => {
      expect(locate({ cwd, filename })).toBeNull()
    },
  )

  it('answers null for a file outside the working directory', () => {
    expect(locate({ cwd, filename: '../other/src/main.ts' })).toBeNull()
  })
})
