import { TSESLint } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { readRuleOptions } from '../../../__tests__/utils/index.js'
import { DEFAULT_FILES, EXPO_CATALOG_FILES, EXPO_FILES, NESTJS_FILES, NEXTJS_FILES } from '../../../index.js'
import {
  CONTROLLED_LANGUAGE,
  CONTROLLED_LANGUAGE_FORBIDDEN_WORDS,
  DEFAULT_ARCHITECTURE,
} from '../../constants/index.js'
import { expo } from '../../expo.config.js'
import { nestjs } from '../../nestjs.config.js'
import { nextjs } from '../../nextjs.config.js'
import { recommended } from '../../recommended.config.js'
import { strict } from '../../strict.config.js'

describe('strict', () => {
  it('opens with the shared configuration and closes with the rules of this package', () => {
    const entries = strict()
    const names = entries.map(entry => entry.name).filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/rules']))
  })

  it('ignores what a tool wrote, plus what the project adds', () => {
    const entries = strict({ ignores: ['agents'] })
    const ignoring = entries.find(entry => entry.ignores && !entry.files)

    expect(ignoring?.ignores).toEqual(['**/coverage', '**/dist', 'agents'])
  })

  it('hands the test folder the architecture names to the naming rules', () => {
    const [ownEntry] = strict({ architecture: { testFolder: 'tests' } }).filter(
      entry => entry.name === 'leandromatos/rules',
    )

    expect(readRuleOptions(ownEntry, 'leandromatos/naming-forbidden-name')).toHaveProperty('testFolder', 'tests')
  })

  it('judges the files of constants alone with the rules that read one', () => {
    const entry = strict().find(configEntry => configEntry.name === 'leandromatos/constants')

    expect(entry?.files).toEqual(['**/*.constant.ts'])
    expect(entry?.rules).toEqual({
      'leandromatos/typescript-composed-constant': 'error',
      'leandromatos/typescript-repeated-literal': 'error',
    })
    expect(Object.keys(entry?.plugins ?? {})).toEqual(['leandromatos'])
  })

  it('names no kind of value outside a framework', () => {
    expect(strict().map(entry => entry.name)).not.toContain('leandromatos/value-suffixes')
  })

  it('turns the import boundaries on, which is where a layer says what it exposes', () => {
    const entries = strict({ architecture: { suffixToFolder: { service: 'services' } } })
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.rules?.['leandromatos/architecture-import-boundaries']).toBeDefined()
  })

  it('refuses a cycle everywhere but in a barrel, which re-exports its siblings by design', () => {
    const [cycles] = strict().filter(entry => entry.rules?.['import-x/no-cycle'])

    expect(cycles?.ignores).toEqual(['**/index.{ts,tsx}'])
  })

  it('admits no cast and no any in the sources, specs included, and leaves as const alone', () => {
    const entry = strict().find(configEntry => configEntry.name === 'leandromatos/casts')

    expect(entry?.files).toEqual(['src/**/*.ts', '{apps,libs,packages}/*/src/**/*.ts', 'scripts/**/*.{ts,mts}'])
    expect(entry?.ignores).toBeUndefined()
    expect(entry?.rules).toEqual({
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    })
  })

  it('writes every function as an arrow, outside the files a component is declared in', () => {
    const entry = strict().find(configEntry => configEntry.name === 'leandromatos/function-style')

    expect(entry?.ignores).toEqual(['**/*.tsx'])
    expect(entry?.rules).toEqual({ 'func-style': ['error', 'expression'] })
  })

  it('lets no value typed any travel through the sources, outside a spec', () => {
    const entry = strict().find(configEntry => configEntry.name === 'leandromatos/unsafe-values')

    expect(entry?.ignores).toEqual(['**/*.{spec,test}.{ts,tsx}'])
    expect(Object.values(entry?.rules ?? {})).toEqual(['error', 'error', 'error', 'error', 'error'])
  })

  it('asks every directive that turns a rule off for its reason', () => {
    const entry = strict({ files: ['lib/**/*.ts'] }).find(configEntry => configEntry.name === 'leandromatos/directives')

    expect(entry?.files).toEqual([...DEFAULT_FILES, 'lib/**/*.ts'])
    expect(entry?.rules).toEqual({ '@eslint-community/eslint-comments/require-description': 'error' })
  })

  it('refuses an else and a ternary, and leaves a ternary that chooses between two elements of JSX', async () => {
    const controlFlow = strict().find(entry => entry.name === 'leandromatos/control-flow')
    const eslint = new TSESLint.ESLint({
      overrideConfigFile: true,
      baseConfig: [...recommended(), { files: ['**/*.{js,jsx}'], rules: controlFlow?.rules }],
    })
    const lintRules = async (code: string, filePath: string): Promise<(string | null)[]> =>
      (await eslint.lintText(code, { filePath })).flatMap(result => result.messages.map(message => message.ruleId))

    expect(await lintRules('export const read = (value) => (value ? 1 : 2)\n', 'sample.js')).toEqual([
      'no-restricted-syntax',
    ])
    expect(
      await lintRules('export const read = (value) => {\n  if (value) return 1\n  else return 2\n}\n', 'sample.js'),
    ).toEqual(['no-restricted-syntax'])
    expect(
      await lintRules('export const Status = ({ on }) => <p>{on ? <b>on</b> : <i>off</i>}</p>\n', 'sample.jsx'),
    ).toEqual([])
    expect(
      await lintRules(
        'export const Status = ({ on, off }) => <p>{on ? <b>on</b> : off ? <i>off</i> : null}</p>\n',
        'sample.jsx',
      ),
    ).toEqual(expect.arrayContaining(['no-nested-ternary']))
  })

  it('applies a preset over the tier before the options of the project, so a list joins both', () => {
    const entries = strict({
      presets: [CONTROLLED_LANGUAGE],
      naming: { forbiddenWords: [{ word: 'info', because: 'it names no content' }] },
    })
    const ownEntry = entries.find(entry => entry.name === 'leandromatos/rules')
    const namingOptions = readRuleOptions(ownEntry, 'leandromatos/naming-forbidden-name')
    const tsdocOptions = readRuleOptions(ownEntry, 'leandromatos/tsdoc-comment-form')

    expect(namingOptions['forbiddenWords']).toEqual([
      ...CONTROLLED_LANGUAGE_FORBIDDEN_WORDS,
      { word: 'info', because: 'it names no content' },
    ])
    expect(tsdocOptions['commentWidth']).toBe(120)
  })

  it('keeps the cycle walk inside the project, which is the only graph it can act on', () => {
    const [cycles] = strict().filter(entry => entry.rules?.['import-x/no-cycle'])
    const options = readRuleOptions(cycles, 'import-x/no-cycle')

    expect(options).toHaveProperty('ignoreExternal', true)
  })

  it('joins what a project adds to the map of the tier, so passing the default back changes nothing', () => {
    const suffixToFolder = { ...DEFAULT_ARCHITECTURE.suffixToFolder, widget: 'widgets' }
    const suffixDictionary = { widget: 'widgets' }
    const entries = strict({ architecture: { ...DEFAULT_ARCHITECTURE, suffixToFolder, suffixDictionary } })
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/rules')
    const options = readRuleOptions(ownEntry, 'leandromatos/architecture-known-suffix')

    expect(options['suffixToFolder']).toEqual({ ...DEFAULT_ARCHITECTURE.suffixToFolder, widget: 'widgets' })
    expect(options).not.toHaveProperty('suffixDictionary')
  })

  it('judges the sources of the repository, of each package of a workspace folder, and the root scripts, by default', () => {
    const [ownEntry] = strict().filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual(['src/**/*.ts', '{apps,libs,packages}/*/src/**/*.ts', 'scripts/**/*.{ts,mts}'])
  })

  it('judges the files the project adds beside the ones of the tier', () => {
    const [ownEntry] = strict({ files: ['lib/**/*.ts'] }).filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual([...DEFAULT_FILES, 'lib/**/*.ts'])
  })

  it('checks the grammar of a comment with the TSDoc parser, which this package does not carry itself', () => {
    const [documentation] = strict().filter(entry => entry.rules?.['tsdoc/syntax'])

    expect(documentation?.rules?.['tsdoc/syntax']).toBe('error')
  })

  it('reads no release tag until the project says a tool reads them', () => {
    const [ownEntry] = strict().filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.rules?.['leandromatos/tsdoc-unread-tag']).toEqual([
      'error',
      expect.objectContaining({ readsReleaseTags: false }),
    ])
  })

  it('reaches the configuration files with the comment rule, which reads no type', () => {
    const [notes] = strict().filter(entry => entry.files?.includes('*.{ts,mts,cts,js,mjs,cjs}'))

    expect(notes?.rules?.['leandromatos/tsdoc-comment-form']).toBeDefined()
  })

  it('reads a package of a monorepo under its own directory, and leaves the layers of recommended to the root', () => {
    const entries = strict({ basePath: 'packages/web' })
    const [ignoring] = entries

    expect(entries.length).toBe(strict().length - recommended().length + 1)
    expect(ignoring?.ignores).toEqual(recommended()[0]?.ignores)
    expect(entries.every(entry => entry.basePath === 'packages/web')).toBe(true)
    expect(entries.map(entry => entry.name)).toContain('leandromatos/rules')
  })

  it('lays a package over the root, so a file of the package is judged by the tier of the package', async () => {
    const eslint = new TSESLint.ESLint({
      cwd: '/repository',
      overrideConfigFile: true,
      baseConfig: [...strict(), ...nestjs({ basePath: 'apps/api' })],
    })

    const config: unknown = await eslint.calculateConfigForFile('/repository/apps/api/src/users/users.service.ts')

    expect(config).toHaveProperty(
      ['rules', 'leandromatos/architecture-method-order', 1, 'orderedSuffixes', 0],
      'controller',
    )
  })

  it('hands out the files each tier judges, so a project adds a directory instead of retyping them', () => {
    const filesOf = (entries: ReturnType<typeof strict>): string[] | undefined =>
      entries.find(entry => entry.name === 'leandromatos/rules')?.files?.flat()

    expect(filesOf(strict())).toEqual(DEFAULT_FILES)
    expect(filesOf(nestjs())).toEqual(NESTJS_FILES)
    expect(filesOf(nextjs())).toEqual(NEXTJS_FILES)
    expect(filesOf(expo())).toEqual([...EXPO_FILES, ...EXPO_CATALOG_FILES])
    expect(filesOf(expo({ catalog: false }))).toEqual(EXPO_FILES)
  })
})
