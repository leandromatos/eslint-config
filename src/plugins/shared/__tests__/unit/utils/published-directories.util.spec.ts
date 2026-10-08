import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { publishedDirectoriesOf } from '../../../utils/index.js'

describe('publishedDirectoriesOf', () => {
  let cwd: string

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'published-directories-'))
  })

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  const write = (manifest: object): void => {
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(manifest))
  }

  it('names the directory of every entrypoint the package declares', () => {
    write({ exports: { './cache': {}, './database': {}, './utils': {} } })

    expect(publishedDirectoriesOf(cwd)).toEqual(['cache', 'database', 'utils'])
  })

  it('reads the top directory of a nested entrypoint, and names it once', () => {
    write({ exports: { './cache': {}, './cache/testing': {} } })

    expect(publishedDirectoriesOf(cwd)).toEqual(['cache'])
  })

  it('reads the directory a wildcard entrypoint sits under', () => {
    write({ exports: { './schemas/*': {} } })

    expect(publishedDirectoriesOf(cwd)).toEqual(['schemas'])
  })

  it('reads the directory a target is built from, which names the barrel the package itself publishes', () => {
    write({
      exports: {
        '.': { types: './dist/tokens/index.d.ts', import: './dist/tokens/index.js' },
        './css': './dist/tokens/tokens.css',
        './blocked': null,
      },
    })

    expect(publishedDirectoriesOf(cwd)).toEqual(['css', 'blocked', 'tokens'])
  })

  it('names no directory for a target at the root of the build', () => {
    write({ exports: { '.': './dist/index.js' } })

    expect(publishedDirectoriesOf(cwd)).toEqual([])
  })

  it('names no directory for the package itself', () => {
    write({ exports: { '.': {} } })

    expect(publishedDirectoriesOf(cwd)).toEqual([])
  })

  it('answers with nothing for a package that publishes no path', () => {
    write({ name: 'an-application' })

    expect(publishedDirectoriesOf(cwd)).toEqual([])
  })

  it('reads the manifest once per package, and answers the next call from what it read', () => {
    write({ exports: { './cache': {} } })
    const expectedAnswer = publishedDirectoriesOf(cwd)
    write({ exports: { './database': {} } })

    const secondAnswer = publishedDirectoriesOf(cwd)

    expect(secondAnswer).toBe(expectedAnswer)
  })

  it.each(['apps/x', 'libs/x', 'packages/x'])('reads the manifest of the package at %s', packageDirectory => {
    const packageRoot = path.join(cwd, packageDirectory)
    fs.mkdirSync(packageRoot, { recursive: true })
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ exports: { './cache': {} } }))

    expect(publishedDirectoriesOf(packageRoot)).toEqual(['cache'])
  })

  it('reads each package of one working directory by its own manifest', () => {
    write({ exports: { './root': {} } })
    fs.mkdirSync(path.join(cwd, 'libs', 'x'), { recursive: true })
    fs.writeFileSync(path.join(cwd, 'libs', 'x', 'package.json'), JSON.stringify({ exports: { './database': {} } }))

    const answers = [publishedDirectoriesOf(cwd), publishedDirectoriesOf(path.join(cwd, 'libs', 'x'))]

    expect(answers).toEqual([['root'], ['database']])
  })

  it('answers with nothing where there is no manifest to read', () => {
    expect(publishedDirectoriesOf(path.join(cwd, 'elsewhere'))).toEqual([])
  })
})
