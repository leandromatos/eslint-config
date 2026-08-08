import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

import { importBoundaries } from '../index.js'

const ROOT = 'fixtures/boundaries/src'

// The package ships no default vocabulary, so every call declares its own. This is the
// map the fixture tree under `ROOT` is built from.
const SUFFIX_TO_FOLDER = { entity: 'entities', service: 'services', spec: '__tests__', type: 'types' }

const boundaries = options =>
  importBoundaries({
    root: ROOT,
    suffixToFolder: SUFFIX_TO_FOLDER,
    mirrorFolders: ['types', '__tests__'],
    testFolder: '__tests__',
    ...options,
  })

// `noCycle: false` because `import-x/no-cycle` comes from a plugin the base config
// registers, and these instances run the boundary layer on its own.
const eslint = new ESLint({ overrideConfigFile: true, baseConfig: boundaries({ noCycle: false }) })

/**
 * Lints a single import statement as if it were written in `filePath`, and returns the
 * `no-restricted-imports` messages it produced. The rule is the whole surface here, so
 * everything else is noise.
 */
const messagesFor = async (specifier, filePath) => {
  const [result] = await eslint.lintText(`import { x } from '${specifier}'\n\nexport const y = x\n`, {
    filePath: `${ROOT}/${filePath}`,
  })

  return result.messages.filter(message => message.ruleId === 'no-restricted-imports').map(message => message.message)
}

const allowed = async (specifier, filePath) => (await messagesFor(specifier, filePath)).length === 0

const blockedWith = async (specifier, filePath, reason) =>
  (await messagesFor(specifier, filePath)).some(message => message.includes(reason))

describe('importBoundaries', () => {
  it('walks the tree and emits one override per layer directory', () => {
    const configs = boundaries()
    const layerFiles = configs.slice(1, -1).flatMap(config => config.files)

    expect(layerFiles).toContain(`${ROOT}/authorizer/tokens/entities/**/*.entity.ts`)
    expect(layerFiles).toContain(`${ROOT}/authorizer/tokens/services/**/*.service.ts`)
    expect(layerFiles).toContain(`${ROOT}/authorizer/tokens/__tests__/**/*.spec.ts`)
  })

  it('treats a folder nested under a mirror folder as part of the mirror layer', () => {
    // `roles/types/entities` holds `*.type.ts`, so it must not get an `entities`
    // override of its own — that override would demand a suffix no file there carries.
    const layerFiles = boundaries()
      .slice(1, -1)
      .flatMap(config => config.files)

    expect(layerFiles).not.toContain(`${ROOT}/authorizer/roles/types/entities/**/*.entity.ts`)
    expect(layerFiles).toContain(`${ROOT}/authorizer/roles/types/**/*.type.ts`)
  })

  describe('files without a layer suffix', () => {
    const file = 'app.module.ts'

    it('allows a barrel', async () => {
      expect(await allowed('@/authorizer/tokens/services', file)).toBe(true)
    })

    it('blocks a direct file import', async () => {
      expect(await blockedWith('@/authorizer/tokens/services/tokens.service', file, 'Use barrel imports')).toBe(true)
    })

    it('blocks a relative import', async () => {
      expect(await blockedWith('./services', file, 'Use absolute imports')).toBe(true)
    })
  })

  describe('files with a layer suffix', () => {
    const file = 'authorizer/tokens/entities/token.entity.ts'

    it('blocks its own barrel, which would be a cycle', async () => {
      expect(await blockedWith('@/authorizer/tokens/entities', file, 'Same layer requires direct import')).toBe(true)
    })

    it('allows a sibling in the same layer directory', async () => {
      expect(await allowed('@/authorizer/tokens/entities/session.entity', file)).toBe(true)
    })

    it('blocks the same suffix in another layer directory', async () => {
      expect(await blockedWith('@/authorizer/users/entities/user.entity', file, 'Cross-layer requires barrel')).toBe(
        true,
      )
    })

    it('allows another layer through its barrel', async () => {
      expect(await allowed('@/authorizer/users/services', file)).toBe(true)
    })

    it('blocks another layer reached directly', async () => {
      expect(await blockedWith('@/authorizer/users/services/users.service', file, 'Cross-layer requires barrel')).toBe(
        true,
      )
    })
  })

  describe('test files', () => {
    it('blocks production code from importing a test', async () => {
      expect(
        await blockedWith(
          '@/authorizer/tokens/__tests__/tokens.spec',
          'authorizer/tokens/entities/token.entity.ts',
          'Do not import test files in production code',
        ),
      ).toBe(true)
    })

    it('treats an unsuffixed file under the test folder as a test', async () => {
      // A shared helper there carries no layer suffix, so keying the exemption off the
      // suffix alone left it classified as production code and cut off from the tree it
      // belongs to.
      const messages = await messagesFor(
        '@/authorizer/tokens/__tests__/tokens.spec',
        'authorizer/tokens/__tests__/helpers.ts',
      )

      expect(messages).not.toContainEqual(expect.stringContaining('Do not import test files'))
    })

    it('keeps every other constraint on that helper', async () => {
      expect(
        await blockedWith(
          '@/authorizer/tokens/services/tokens.service',
          'authorizer/tokens/__tests__/helpers.ts',
          'Use barrel imports',
        ),
      ).toBe(true)
    })

    it('lets a test import another test', async () => {
      // Tests are never part of a production import graph, so the `spec` layer is the
      // one layer that does not carry the restriction.
      const messages = await messagesFor(
        '@/authorizer/tokens/__tests__/other.spec',
        'authorizer/tokens/__tests__/tokens.spec.ts',
      )

      expect(messages).not.toContainEqual(expect.stringContaining('Do not import test files'))
    })
  })

  describe('options', () => {
    it('honours a custom alias', async () => {
      const aliased = new ESLint({
        overrideConfigFile: true,
        baseConfig: boundaries({ alias: '~', noCycle: false }),
      })
      const [result] = await aliased.lintText("import { x } from '~/authorizer/tokens/services/tokens.service'\n", {
        filePath: `${ROOT}/app.module.ts`,
      })

      expect(result.messages.map(message => message.message)).toContainEqual(
        expect.stringContaining('Use barrel imports'),
      )
    })

    it('adds import-x/no-cycle by default and drops it on request', () => {
      const withCycle = boundaries()
      const withoutCycle = boundaries({ noCycle: false })

      expect(withCycle.at(-1)?.rules).toHaveProperty('import-x/no-cycle')
      expect(withoutCycle.at(-1)?.rules).not.toHaveProperty('import-x/no-cycle')
    })

    it('fails loudly when the root is not a directory', () => {
      // Config-load-time filesystem access, so a wrong root would otherwise surface as
      // an ENOENT from inside the package with no hint of what to fix.
      expect(() => boundaries({ root: 'fixtures/nope' })).toThrow(/is not a directory/)
    })

    it('refuses to run without a vocabulary', () => {
      // No default map on purpose: a default would be one framework's convention
      // imposed on every project that installs the package.
      expect(() => importBoundaries({ root: ROOT, suffixToFolder: {} })).toThrow(/`suffixToFolder` is required/)
    })

    it('drops the test rule when no test folder is declared', async () => {
      const untested = new ESLint({
        overrideConfigFile: true,
        baseConfig: boundaries({ testFolder: undefined, noCycle: false }),
      })
      const [result] = await untested.lintText("import { x } from '@/authorizer/tokens/__tests__/tokens.spec'\n", {
        filePath: `${ROOT}/app.module.ts`,
      })

      expect(result.messages.map(message => message.message)).not.toContainEqual(
        expect.stringContaining('Do not import test files'),
      )
    })
  })
})
