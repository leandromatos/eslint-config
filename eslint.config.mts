import eslintPlugin from 'eslint-plugin-eslint-plugin'

import type { Config } from './src/index.js'
import { configs } from './src/index.js'

/** Layer suffix to the folder that holds it, which every structural rule and the boundaries read. */
const SUFFIX_TO_FOLDER = {
  config: 'configs',
  constant: 'constants',
  plugin: 'plugins',
  rule: 'rules',
  spec: '__tests__',
  type: 'types',
  util: 'utils',
}

/** The one kind of test this package writes: every spec mirrors one source. */
const TEST_KINDS = ['unit']

/**
 * ESLint configuration for this repository, which is the package judging itself.
 *
 * It takes the `strict` tier it publishes, so a rule that cannot be lived with is a rule to fix rather than a rule to
 * turn off somewhere else.
 *
 * The annotation is the package's own exported `Config`, so the type a consumer is told to use is the type this
 * repository lints itself with: one that stopped being exported, or stopped describing what the configuration contains,
 * fails here.
 * @see {@link https://eslint.org/docs/latest/use/configure/configuration-files ESLint Configuration}
 */
const eslintConfig: Config[] = [
  ...configs.strict({
    /*
     * The fixture trees the spec suite lints on its own terms: what sits there is deliberately broken, or stands for
     * a project of its own. None belongs to a tsconfig project the type-checked layer could read.
     */
    ignores: ['src/**/__tests__/fixtures'],
    /*
     * Nothing, here: `data` is what ESLint calls the payload a report carries into its message, so every rule of this
     * package writes the name its own API imposes.
     */
    naming: {
      genericNames: {},
      verbParticiples: {},
      valueCases: [],
      resourceSuffixes: [],
      testFolder: SUFFIX_TO_FOLDER.spec,
    },
    tsdoc: { testFolder: SUFFIX_TO_FOLDER.spec },
    architecture: {
      suffixToFolder: SUFFIX_TO_FOLDER,
      // The runner reads this one by name, so it carries the framework's suffix rather than a layer's.
      folderlessSuffixes: ['setup'],
      mirrorFolders: [SUFFIX_TO_FOLDER.type, SUFFIX_TO_FOLDER.spec],
      /*
       * This package holds one module, and what sits at the top of `src` are its layers rather than modules of their
       * own: `configs` is reached through its barrel, and `plugins` groups the rules by subject.
       */
      rootContexts: [SUFFIX_TO_FOLDER.config, SUFFIX_TO_FOLDER.plugin],
      executedFolders: [],
      typeSuffixes: {},
      orderedSuffixes: [],
      wholeArguments: [],
      testFolder: SUFFIX_TO_FOLDER.spec,
      testKinds: TEST_KINDS,
      mirroringTestKinds: TEST_KINDS,
    },
    testing: {
      suffixToFolder: SUFFIX_TO_FOLDER,
      testFolder: SUFFIX_TO_FOLDER.spec,
      testKinds: TEST_KINDS,
      mirroringTestKinds: TEST_KINDS,
      // Nothing here answers HTTP, so no spec goes through a client.
      httpTest: { kind: '', client: '' },
    },
  }),
  {
    /*
     * The linter the ESLint documentation points a plugin author at. `require-meta-docs-description` wants every
     * description to open with a verb of its own list; the descriptions here answer to the controlled language
     * instead, which is one sentence stating what holds.
     */
    files: ['src/plugins/**/rules/*.rule.ts', 'src/plugins/shared/utils/file-rule.util.ts'],
    ...eslintPlugin.configs['rules-recommended'],
    rules: {
      ...eslintPlugin.configs['rules-recommended'].rules,
      'eslint-plugin/require-meta-docs-description': 'off',
    },
  },
  {
    /*
     * The other half of the same net. The plugin reads a suite by the call that builds its tester, so the setting
     * names the factories this repository writes: every one of them closes with `RuleTester`.
     */
    files: ['src/plugins/**/__tests__/unit/rules/*.spec.ts'],
    ...eslintPlugin.configs['tests-recommended'],
    settings: { 'eslint-plugin': { ruleTesterConstructors: ['RuleTester', /RuleTester$/] } },
  },
  {
    files: ['eslint.config.mts'],
    rules: {
      'import-x/no-relative-parent-imports': 'off',
      'leandromatos/architecture-import-boundaries': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    /*
     * The one rule this package cannot take from itself: its own sources reach each other by relative path, because
     * ESLint loads this file through a loader that resolves no path alias, and an alias would leave the repository
     * unlintable until `dist/` existed.
     */
    files: ['src/**/*.ts'],
    rules: {
      'import-x/no-relative-parent-imports': 'off',
      'leandromatos/architecture-import-boundaries': 'off',
      'no-restricted-imports': 'off',
    },
  },
]

export default eslintConfig
