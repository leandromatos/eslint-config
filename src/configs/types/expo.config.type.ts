import type { StrictOptions } from './strict.config.type.js'

/** The runner a React Native project's unit tests run under, which decides the globals in scope. */
export type TestRunner = 'jest' | 'vitest'

/** What a React Native project says to the `expo` tier on top of its defaults. */
export interface ExpoOptions extends StrictOptions {
  /**
   * Whether the project keeps an on-device Storybook catalog under `.rnstorybook/`. Defaults to true; false leaves
   * the folder out of the files the tier judges.
   */
  catalog?: boolean
  /**
   * The runner the unit tests run under. Defaults to `jest`, the one Expo ships a preset for; `vitest` keeps the
   * globals `recommended` declares.
   */
  runner?: TestRunner
}
