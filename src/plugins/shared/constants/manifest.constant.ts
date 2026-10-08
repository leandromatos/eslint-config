import { createRequire } from 'node:module'

import { textFieldOf } from '../utils/text-field-of.util.js'

/** Resolves against this file, so the lookup below finds the package's own manifest and not a consumer's. */
const require = createRequire(import.meta.url)

/** What the manifest says this package is, which ESLint caches and reports the plugin by. */
const manifest: unknown = require('../../../../package.json')

/**
 * The name of this package.
 *
 * The plugin reads it into `meta.name`, which ESLint expects to match the package that ships it. The manifest is
 * the one place it is written, so a rename reaches the plugin without a second edit.
 */
export const PACKAGE = textFieldOf(manifest, 'name')

/**
 * The version of this package, as the manifest carries it.
 *
 * The plugin reads it into `meta.version`. The release writes the version into the manifest from the tag, so the
 * manifest is the one place it is written.
 */
export const VERSION = textFieldOf(manifest, 'version')
