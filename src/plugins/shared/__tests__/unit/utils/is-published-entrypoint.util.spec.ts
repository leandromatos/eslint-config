import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Location } from '../../../types/shared.type.js'
import { isPublishedEntrypoint } from '../../../utils/is-published-entrypoint.util.js'

describe('isPublishedEntrypoint', () => {
  let packageRoot: string
  let sourceRoot: string

  beforeEach(() => {
    packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'is-published-entrypoint-'))
    sourceRoot = path.join(packageRoot, 'src')
  })

  afterEach(() => {
    fs.rmSync(packageRoot, { recursive: true, force: true })
  })

  const writeManifest = (manifest: string): void => {
    fs.writeFileSync(path.join(packageRoot, 'package.json'), manifest)
  }

  const writeSource = (...segments: string[]): Location => {
    const file = segments.at(-1) ?? ''
    const directories = segments.slice(0, -1)
    fs.mkdirSync(path.join(sourceRoot, ...directories), { recursive: true })
    fs.writeFileSync(path.join(sourceRoot, ...segments), "export * from './a.js'")
    const location: Location = {
      packageRoot,
      sourceRoot,
      file,
      segments: directories,
      module: directories[0] ?? '',
      suffix: null,
      stem: file,
    }

    return location
  }

  it('reads the index file at the source root as published, with no manifest', () => {
    expect(isPublishedEntrypoint(writeSource('index.ts'))).toBe(true)
  })

  it('reads any other file as unpublished when the package has no manifest', () => {
    expect(isPublishedEntrypoint(writeSource('users', 'index.ts'))).toBe(false)
  })

  it.each([
    ['a string', '"./dist/users/index.js"'],
    ['a list', '["./dist/users/index.js"]'],
    ['an object of conditions', '{ "import": { "types": "./dist/users/index.d.ts" } }'],
    ['an object of keys', '{ ".": "./dist/users/index.js", "./other": null }'],
  ])('reads a target of exports written as %s', (_label, exportsValue) => {
    writeManifest(`{ "exports": ${exportsValue} }`)

    expect(isPublishedEntrypoint(writeSource('users', 'index.ts'))).toBe(true)
  })

  it('reads no file from a key, since only targets name files', () => {
    writeManifest('{ "exports": { "./legacy": "./dist/users/index.js" } }')
    writeSource('users', 'index.ts')

    expect(isPublishedEntrypoint(writeSource('legacy', 'index.ts'))).toBe(false)
  })

  it('reads a new file under a wildcard target without a fresh read of the manifest', () => {
    writeManifest('{ "exports": { "./*": "./dist/*.js" } }')
    const isUsersPublished = isPublishedEntrypoint(writeSource('users', 'users.util.ts'))

    const isRolesPublished = isPublishedEntrypoint(writeSource('roles', 'roles.util.ts'))

    expect([isUsersPublished, isRolesPublished]).toEqual([true, true])
  })

  it('reads a target named after a directory as the build of its index file, as a bundler names it', () => {
    writeManifest('{ "exports": { "./testing": "./dist/testing.js" } }')

    expect(isPublishedEntrypoint(writeSource('testing', 'index.ts'))).toBe(true)
  })

  it('reads a `*` under a key that holds none as a plain character', () => {
    writeManifest('{ "exports": { "./all": "./dist/*.js", "./odd": "./dist/(a)[b]+.js" } }')

    expect(isPublishedEntrypoint(writeSource('users', 'users.util.ts'))).toBe(false)
  })

  it('reads a `*` under a key that holds one, through a condition, as any text', () => {
    writeManifest('{ "exports": { "./*": { "import": "./dist/*.js" } } }')

    expect(isPublishedEntrypoint(writeSource('users', 'users.util.ts'))).toBe(true)
  })

  it('reads a manifest nested deeper than the stack allows', () => {
    writeManifest(`{ "exports": ${'{ "a": '.repeat(20_000)}"./dist/users/index.js"${' }'.repeat(20_000)} }`)

    expect(isPublishedEntrypoint(writeSource('users', 'index.ts'))).toBe(true)
  })

  it('reads a target with no build folder as the build of no file', () => {
    writeManifest('{ "exports": { "./*": "./*.js" } }')

    expect(isPublishedEntrypoint(writeSource('users', 'users.util.ts'))).toBe(false)
  })

  it('answers from the targets it read while the manifest is unchanged', () => {
    writeManifest('{ "exports": "./dist/users/index.js" }')
    const manifest = path.join(packageRoot, 'package.json')
    const readAt = new Date(2026, 0, 1)
    fs.utimesSync(manifest, readAt, readAt)
    const location = writeSource('users', 'index.ts')
    isPublishedEntrypoint(location)
    writeManifest('{ "exports": "./dist/roles/index.js" }')
    fs.utimesSync(manifest, readAt, readAt)

    expect(isPublishedEntrypoint(location)).toBe(true)
  })

  it('reads the targets again once the manifest changes', () => {
    writeManifest('{ "exports": "./dist/users/index.js" }')
    const location = writeSource('users', 'index.ts')
    isPublishedEntrypoint(location)
    writeManifest('{ "exports": "./dist/roles/index.js" }')
    const later = new Date(Date.now() + 60_000)
    fs.utimesSync(path.join(packageRoot, 'package.json'), later, later)

    expect(isPublishedEntrypoint(location)).toBe(false)
  })

  it('reads a manifest past a byte order mark, as Node does', () => {
    writeManifest('\uFEFF{ "exports": "./dist/users/index.js" }')

    expect(isPublishedEntrypoint(writeSource('users', 'index.ts'))).toBe(true)
  })

  it('reads a manifest that does not parse as publishing nothing', () => {
    writeManifest('{ "exports": ')

    expect(isPublishedEntrypoint(writeSource('users', 'index.ts'))).toBe(false)
  })
})
