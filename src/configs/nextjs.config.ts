import {
  NEXTJS_VOCABULARY,
  REACT_FOLDER,
  REACT_IMAGE_COMPONENTS,
  SOURCE_ROOTS,
  STORY_SUFFIX,
} from './constants/index.js'
import { buildStrictConfig } from './strict.config.js'
import type { Config, NextjsOptions } from './types/index.js'
import { buildImageEntry, extendList, placeInPackage } from './utils/index.js'

/**
 * All of `strict`, with the tree a React project writes.
 *
 * What the tier changes is the vocabulary, never the rules: a module sits under a container, a component is named
 * after the function in it, what a component takes is declared beside it, and the files the router names are read by
 * the folder that holds them. A project states only where it differs from that, and a list or a map it passes joins
 * the tier's own.
 *
 * @param nextjsOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const nextjs = (nextjsOptions: NextjsOptions = {}): Config[] => {
  const { catalog = true, ...strictOptions } = nextjsOptions
  const files = extendList(NEXTJS_VOCABULARY.files, strictOptions.files)
  const layers = buildStrictConfig(NEXTJS_VOCABULARY, strictOptions)
  const ownLayers = [buildImageEntry(files, REACT_IMAGE_COMPONENTS), ...selectCatalogEntries(catalog, files)]

  return [...layers, ...placeInPackage(ownLayers, strictOptions.basePath)]
}

/**
 * Selects the entry that keeps the catalog out of the application, when the project keeps one.
 *
 * @param catalog - Whether the project keeps a catalog under `storybook/`.
 * @param files - The files the restriction reaches.
 * @returns The entry, and none without a catalog.
 */
const selectCatalogEntries = (catalog: boolean, files: string[]): Config[] => {
  if (!catalog) return []

  return [buildCatalogEntry(files)]
}

/**
 * Builds the entry that keeps the catalog out of the application.
 *
 * A story and the catalog around it are a development tool: nothing the application ships imports either, and a
 * build that did would carry the harness into production. The catalog itself is the one place allowed to, so it is
 * the only thing the entry leaves out.
 *
 * @param files - The files the restriction reaches, which are the files the tier judges.
 * @returns The configuration entry.
 */
const buildCatalogEntry = (files: string[]): Config => {
  const catalogEntry: Config = {
    name: 'leandromatos/nextjs-catalog',
    files,
    ignores: SOURCE_ROOTS.flatMap(root => [
      `${root}/${REACT_FOLDER.storybook}/**/*.{ts,tsx}`,
      `${root}/**/*.${STORY_SUFFIX}.tsx`,
    ]),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [`@/${REACT_FOLDER.storybook}`, `@/${REACT_FOLDER.storybook}/*`],
              message: `The catalog does not ship. Only the ${REACT_FOLDER.storybook} folder of the sources may import it.`,
            },
            {
              group: [`*.${STORY_SUFFIX}`, `*.${STORY_SUFFIX}.tsx`],
              message: 'A story does not ship. Only the catalog may import one.',
            },
          ],
        },
      ],
    },
  }

  return catalogEntry
}
