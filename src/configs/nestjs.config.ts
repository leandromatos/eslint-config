import { NESTJS_ARCHITECTURE, NESTJS_FILES, NESTJS_NAMING, NESTJS_TEXT } from './constants/index.js'
import { strict } from './strict.config.js'
import type { Config, NestjsOptions } from './types/index.js'

/**
 * All of {@link strict}, with the tree a NestJS project writes.
 *
 * What the tier adds is the vocabulary of the framework: the layers a module is cut into, the order a class walks
 * down them, and the request objects a controller takes whole. A project states only where it differs from that.
 *
 * @param nestjsOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const nestjs = (nestjsOptions: NestjsOptions = {}): Config[] =>
  strict({
    ...nestjsOptions,
    files: nestjsOptions.files ?? NESTJS_FILES,
    architecture: { ...NESTJS_ARCHITECTURE, ...nestjsOptions.architecture },
    naming: { ...NESTJS_NAMING, ...nestjsOptions.naming },
    text: { ...NESTJS_TEXT, ...nestjsOptions.text },
  })
