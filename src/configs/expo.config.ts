import globals from 'globals'

import { EXPO_CATALOG_FILES, EXPO_VOCABULARY, LAYOUT_RULES, REACT_IMAGE_COMPONENTS } from './constants/index.js'
import { buildStrictConfig } from './strict.config.js'
import type { Config, ExpoOptions } from './types/index.js'
import { buildImageEntry, extendList, placeInPackage } from './utils/index.js'

/** The globals Vitest declares and Jest does not, which a spec run under Jest never sees. */
const VITEST_ONLY_GLOBALS = Object.fromEntries(
  Object.keys(globals.vitest)
    .filter(name => !(name in globals.jest))
    .map(name => [name, 'off' as const]),
)

/**
 * All of `strict`, with the tree a React Native project writes.
 *
 * The architecture is the one a Next.js project writes: modules under a container, a component named after the
 * function in it, the router naming its own files. What the tier changes is the platform. A project states only where
 * it differs from both, and a list or a map it passes joins the tier's own.
 *
 * @param expoOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const expo = (expoOptions: ExpoOptions = {}): Config[] => {
  const { catalog = true, runner = 'jest', ...strictOptions } = expoOptions
  const catalogFiles = selectCatalogFiles(catalog)
  const files = [...extendList(EXPO_VOCABULARY.files, strictOptions.files), ...catalogFiles]
  const layers = buildStrictConfig(EXPO_VOCABULARY, { ...strictOptions, files: () => files })
  const ownLayers = [
    buildImageEntry(files, REACT_IMAGE_COMPONENTS),
    ...selectRunnerEntries(runner, files),
    ...selectCatalogEntries(catalogFiles),
  ]

  return [...layers, ...placeInPackage(ownLayers, strictOptions.basePath)]
}

/**
 * Selects the files of the on-device catalog, when the project keeps one.
 *
 * @param catalog - Whether the project keeps a catalog under `.rnstorybook/`.
 * @returns The globs of the catalog, and none without one.
 */
const selectCatalogFiles = (catalog: boolean): string[] => {
  if (!catalog) return []

  return EXPO_CATALOG_FILES
}

/**
 * Selects the entry that declares the globals of the test runner.
 *
 * Expo ships a Jest preset that mocks the native half of its SDK and documents no other runner, so a project on it
 * reads Jest's globals, and the ones only Vitest declares are turned off so a spec cannot reach `vi`. One on Vitest
 * keeps the globals `recommended` already declares.
 *
 * @param runner - The runner the unit tests run under.
 * @param files - The files the globals reach.
 * @returns The entry for Jest, and none for Vitest.
 */
const selectRunnerEntries = (runner: ExpoOptions['runner'], files: string[]): Config[] => {
  if (runner === 'vitest') return []
  const runnerEntry: Config = {
    name: 'leandromatos/expo-runner',
    files,
    languageOptions: { globals: { ...VITEST_ONLY_GLOBALS, ...globals.jest } },
  }

  return [runnerEntry]
}

/**
 * Selects the entry that spares the catalog the rules of the layout, since Storybook names its entry files. Every
 * other rule reads it, the documentation rules first.
 *
 * @param catalogFiles - The files of the catalog, and none when the project keeps no catalog.
 * @returns The entry, and none without a catalog.
 */
const selectCatalogEntries = (catalogFiles: string[]): Config[] => {
  if (catalogFiles.length === 0) return []
  const catalogEntry: Config = {
    name: 'leandromatos/expo-catalog',
    files: catalogFiles,
    rules: Object.fromEntries(LAYOUT_RULES.map(rule => [`leandromatos/${rule}`, 'off'])),
  }

  return [catalogEntry]
}
