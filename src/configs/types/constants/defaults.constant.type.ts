import type { SUFFIX_TO_FOLDER } from '../../constants/index.js'

/**
 * A layer suffix of the default map: a key of {@link SUFFIX_TO_FOLDER}.
 *
 * A default that names a layer is annotated with this, so a suffix the map loses stops compiling where it is still
 * named rather than going quiet and turning a rule off.
 */
export type DefaultLayerSuffix = keyof typeof SUFFIX_TO_FOLDER
