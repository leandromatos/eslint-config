import { INTEGER_SCHEMA, STRING_SCHEMA } from '../../shared/constants/index.js'
import { buildObjectSchema } from '../../shared/utils/index.js'

/**
 * What a configuration of the `typescript` rules has to hand them.
 *
 * Every rule of this plugin that reads the group takes the same object, so the schema is declared once and each rule
 * points at it.
 */
export const OPTIONS_SCHEMA = buildObjectSchema({ typeSuffix: STRING_SCHEMA })

/** What `repeated-literal` takes, the options of `sonarjs/no-duplicate-string`. */
export const REPEATED_LITERAL_SCHEMA = buildObjectSchema({ threshold: INTEGER_SCHEMA, ignoreStrings: STRING_SCHEMA })
