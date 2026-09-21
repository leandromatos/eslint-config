import {
  NEXTJS_ARCHITECTURE,
  NEXTJS_FILES,
  NEXTJS_IGNORED,
  NEXTJS_TESTING,
  NEXTJS_TSDOC,
  STORY_SUFFIX,
  STORYBOOK_FOLDER,
} from './constants/index.js'
import { strict } from './strict.config.js'
import type { Config, NextjsOptions } from './types/index.js'

/** The files a component is written in, which is where the carve-out below applies. */
const COMPONENT_FILES = ['**/*.tsx']

/**
 * Where `@param` and `@returns` are read from, once a component is left out.
 *
 * A component takes props and returns markup, so both tags restate the signature on every component of the project.
 * A component is written as a `function` declaration and everything else as an arrow, so dropping that one
 * context leaves the tags required wherever they still say something.
 */
const DOCUMENTED_CONTEXTS = ['ArrowFunctionExpression', 'FunctionExpression', 'TSDeclareFunction', 'TSMethodSignature']

/**
 * All of {@link strict}, with the tree a React project writes.
 *
 * What the tier changes is the vocabulary, never the rules: a module sits under a container, a component is named
 * after the function in it, what a component takes is declared beside it, and the files the router names are read
 * by the folder that holds them. A project states only where it differs from that.
 *
 * @param nextjsOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const nextjs = (nextjsOptions: NextjsOptions = {}): Config[] => [
  ...strict({
    ...nextjsOptions,
    files: nextjsOptions.files ?? NEXTJS_FILES,
    ignores: [...NEXTJS_IGNORED, ...(nextjsOptions.ignores ?? [])],
    architecture: { ...NEXTJS_ARCHITECTURE, ...nextjsOptions.architecture },
    testing: { ...NEXTJS_TESTING, ...nextjsOptions.testing },
    tsdoc: { ...NEXTJS_TSDOC, ...nextjsOptions.tsdoc },
  }),
  components(),
  catalogue(),
]

/**
 * What a component's comment is not asked for.
 *
 * @returns The configuration entry.
 */
const components = (): Config => ({
  files: COMPONENT_FILES,
  rules: {
    'jsdoc/require-param': [
      'error',
      {
        checkDestructured: false,
        checkDestructuredRoots: false,
        enableFixer: false,
        contexts: DOCUMENTED_CONTEXTS,
      },
    ],
    'jsdoc/require-returns': ['error', { contexts: DOCUMENTED_CONTEXTS }],
  },
})

/**
 * What keeps the catalogue out of the application.
 *
 * A story and the catalogue around it are a development tool: nothing the application ships imports either, and
 * a build that did would carry the harness into production. The catalogue itself is the one place allowed to, so
 * it is the only thing the entry leaves out.
 *
 * @returns The configuration entry.
 */
const catalogue = (): Config => ({
  files: NEXTJS_FILES,
  ignores: [`src/${STORYBOOK_FOLDER}/**/*.{ts,tsx}`, `src/**/*.${STORY_SUFFIX}.tsx`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [`@/${STORYBOOK_FOLDER}`, `@/${STORYBOOK_FOLDER}/*`],
            message: `The catalogue does not ship. Only src/${STORYBOOK_FOLDER} may import it.`,
          },
          {
            group: [`*.${STORY_SUFFIX}`, `*.${STORY_SUFFIX}.tsx`],
            message: 'A story does not ship. Only the catalogue may import one.',
          },
        ],
      },
    ],
  },
})
