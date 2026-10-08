import {
  NEXTJS_ARCHITECTURE,
  NEXTJS_FILES,
  NEXTJS_IGNORED,
  NEXTJS_TESTING,
  SOURCE_ROOTS,
  STORY_SUFFIX,
  STORYBOOK_FOLDER,
} from './constants/index.js'
import { strict } from './strict.config.js'
import type { Config, NextjsOptions } from './types/index.js'
import { inPackage } from './utils/index.js'

/**
 * All of {@link strict}, with the tree a React project writes.
 *
 * What the tier changes is the vocabulary, never the rules: a module sits under a container, a component is named
 * after the function in it, what a component takes is declared beside it, and the files the router names are read
 * by the folder that holds them. A project states only where it differs from that, and a suffix it adds joins the
 * tier's map rather than replacing it.
 *
 * @param nextjsOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const nextjs = (nextjsOptions: NextjsOptions = {}): Config[] => [
  ...strict({
    ...nextjsOptions,
    files: nextjsOptions.files ?? NEXTJS_FILES,
    ignores: [...NEXTJS_IGNORED, ...(nextjsOptions.ignores ?? [])],
    architecture: {
      ...NEXTJS_ARCHITECTURE,
      ...nextjsOptions.architecture,
      suffixToFolder: { ...NEXTJS_ARCHITECTURE.suffixToFolder, ...nextjsOptions.architecture?.suffixToFolder },
    },
    testing: { ...NEXTJS_TESTING, ...nextjsOptions.testing },
  }),
  ...inPackage([catalog(nextjsOptions.files ?? NEXTJS_FILES)], nextjsOptions.basePath),
]

/**
 * What keeps the catalog out of the application.
 *
 * A story and the catalog around it are a development tool: nothing the application ships imports either, and
 * a build that did would carry the harness into production. The catalog itself is the one place allowed to, so
 * it is the only thing the entry leaves out.
 *
 * @param files - The files the restriction reaches, which are the files the tier judges.
 * @returns The configuration entry.
 */
const catalog = (files: string[]): Config => ({
  files,
  ignores: SOURCE_ROOTS.flatMap(root => [
    `${root}/${STORYBOOK_FOLDER}/**/*.{ts,tsx}`,
    `${root}/**/*.${STORY_SUFFIX}.tsx`,
  ]),
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [`@/${STORYBOOK_FOLDER}`, `@/${STORYBOOK_FOLDER}/*`],
            message: `The catalog does not ship. Only src/${STORYBOOK_FOLDER} may import it.`,
          },
          {
            group: [`*.${STORY_SUFFIX}`, `*.${STORY_SUFFIX}.tsx`],
            message: 'A story does not ship. Only the catalog may import one.',
          },
        ],
      },
    ],
  },
})
