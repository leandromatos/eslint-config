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

  it('names no directory for the package itself', () => {
    write({ exports: { '.': {} } })

    expect(publishedDirectoriesOf(cwd)).toEqual([])
  })

  it('answers with nothing for a package that publishes no path', () => {
    write({ name: 'an-application' })

    expect(publishedDirectoriesOf(cwd)).toEqual([])
  })

  it('answers with nothing where there is no manifest to read', () => {
    expect(publishedDirectoriesOf(path.join(cwd, 'elsewhere'))).toEqual([])
  })
})
