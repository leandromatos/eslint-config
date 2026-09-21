import globals from 'globals'

import { EXPO_ARCHITECTURE, EXPO_FILES, EXPO_IGNORED, EXPO_TESTING, EXPO_TSDOC } from './constants/index.js'
import { strict } from './strict.config.js'
import type { Config, ExpoOptions } from './types/index.js'

/**
 * All of {@link strict}, with the tree a React Native project writes.
 *
 * The architecture is the one a Next project writes: modules under a container, a component named after the
 * function in it, the router naming its own files. What the tier changes is the platform, and a project states
 * only where it differs from both.
 *
 * @param expoOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const expo = (expoOptions: ExpoOptions = {}): Config[] => [
  ...strict({
    ...expoOptions,
    files: expoOptions.files ?? EXPO_FILES,
    ignores: [...EXPO_IGNORED, ...(expoOptions.ignores ?? [])],
    architecture: { ...EXPO_ARCHITECTURE, ...expoOptions.architecture },
    testing: { ...EXPO_TESTING, ...expoOptions.testing },
    tsdoc: { ...EXPO_TSDOC, ...expoOptions.tsdoc },
  }),
  runner(expoOptions.files ?? EXPO_FILES),
]

/**
 * The runner a React Native project tests under.
 *
 * Expo ships a Jest preset that mocks the native half of its SDK, and documents no other runner: a test here runs
 * under Jest rather than under the Vitest the rest of this package uses, so the globals in scope are Jest's.
 *
 * @param files - The files the globals reach.
 * @returns The configuration entry.
 */
const runner = (files: string[]): Config => ({
  name: 'leandromatos/expo-runner',
  files,
  languageOptions: { globals: { ...globals.jest } },
})
