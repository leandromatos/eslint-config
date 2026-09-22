import { expo, nestjs, nextjs, recommended, strict } from './configs/index.js'

/**
 * The five tiers, the way the ecosystem names them.
 *
 * {@link recommended} is the rules the ecosystem already wrote, by file type, and every repository takes it.
 * {@link strict} is all of that plus the import boundaries, this package's own rules and the documentation rules.
 * {@link nestjs}, {@link nextjs} and {@link expo} are all of strict plus the tree each framework writes.
 *
 * Each one is a function, and each takes what the one below it takes: a project states where it differs and the tier
 * carries it down, so the same field is written the same way whichever tier a project is on.
 */
export const configs = {
  recommended,
  strict,
  nestjs,
  nextjs,
  expo,
}

/*
 * Re-exported so a project needs one import, not two. Nothing runs at import time: the filesystem walk happens when the
 * factory is called.
 */

/* The default vocabulary, to spread and extend rather than retype, and the dictionary that spells its folders. */
export {
  DEFAULT_ARCHITECTURE,
  DEFAULT_NAMING,
  DEFAULT_TESTING,
  DEFAULT_TEXT,
  DEFAULT_TSDOC,
  DEFAULT_TYPESCRIPT,
  NO_PERIOD,
  PERIOD,
  SUFFIX_DICTIONARY,
  SUFFIX_TO_FOLDER,
} from './configs/index.js'

/* The rules themselves, for a project that reaches them by `extends` rather than by taking a tier. */
export { plugin } from './plugins/index.js'
export type * from './plugins/types/index.js'

/*
 * The vocabularies the rules judge against. A project annotates its own configuration with these, so a value written
 * in the wrong shape fails where it is written rather than where it is read.
 */
export type * from './configs/types/index.js'
export type * from './plugins/architecture/types/index.js'
export type * from './plugins/naming/types/index.js'
export type * from './plugins/testing/types/index.js'
export type * from './plugins/text/types/index.js'
export type * from './plugins/tsdoc/types/index.js'
export type * from './plugins/typescript/types/index.js'
