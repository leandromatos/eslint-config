import { NESTJS_VOCABULARY } from './constants/index.js'
import { buildStrictConfig } from './strict.config.js'
import type { Config, NestjsOptions } from './types/index.js'

/**
 * All of `strict`, with the tree a NestJS project writes.
 *
 * What the tier adds is the vocabulary of the framework: the layers a module is cut into, the order a class walks
 * down them, and the request objects a controller passes on whole. A project states only where it differs from that,
 * and a list or a map it passes joins the tier's own.
 *
 * @param nestjsOptions - What this project says on top of the tier.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const nestjs = (nestjsOptions: NestjsOptions = {}): Config[] =>
  buildStrictConfig(NESTJS_VOCABULARY, nestjsOptions)
