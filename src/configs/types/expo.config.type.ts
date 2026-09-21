import type { StrictOptions } from './strict.config.type.js'

/**
 * What a React Native project says to the `expo` tier on top of the defaults.
 *
 * The same shape the strict tier takes: the tier carries a vocabulary of its own over that one, and a project
 * states only where it differs from both.
 */
export type ExpoOptions = StrictOptions
