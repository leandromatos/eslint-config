import { STRING_SCHEMA } from '../../shared/constants/index.js'
import { buildListSchema, buildObjectSchema } from '../../shared/utils/index.js'

/**
 * What a configuration of the `text` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 */
/** A pattern judges a string by what it must match, what it must not, or both, and asks nothing with neither. */
const STRING_PATTERN_SIDES = ['must', 'mustNot']

/** The schema of one pattern, which names at least one of its sides. */
const STRING_PATTERN_SCHEMA = {
  ...buildObjectSchema(
    {
      callee: STRING_SCHEMA,
      property: STRING_SCHEMA,
      target: STRING_SCHEMA,
      must: STRING_SCHEMA,
      mustNot: STRING_SCHEMA,
      because: STRING_SCHEMA,
    },
    ['property', 'target', ...STRING_PATTERN_SIDES],
  ),
  anyOf: STRING_PATTERN_SIDES.map(side => ({ type: 'object' as const, required: [side] })),
}

export const OPTIONS_SCHEMA = buildObjectSchema({ stringPatterns: buildListSchema(STRING_PATTERN_SCHEMA) })
