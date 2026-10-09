import type { StrictOptions } from './strict.config.type.js'

/**
 * What a NestJS project says to the `nestjs` tier on top of its defaults.
 *
 * The shape the strict tier takes: the tier carries a vocabulary of its own, and a project states only where it
 * differs from it.
 */
export type NestjsOptions = StrictOptions
