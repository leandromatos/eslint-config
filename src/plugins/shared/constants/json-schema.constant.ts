import type {
  JSONSchema4BooleanSchema,
  JSONSchema4NumberSchema,
  JSONSchema4StringSchema,
} from '@typescript-eslint/utils/json-schema'

import { buildListSchema } from '../utils/build-list-schema.util.js'
import { buildMapSchema } from '../utils/build-map-schema.util.js'

/** The schema of a field that holds text. */
export const STRING_SCHEMA: JSONSchema4StringSchema = { type: 'string' }

/** The schema of a field that holds a whole number. */
export const INTEGER_SCHEMA: JSONSchema4NumberSchema = { type: 'integer' }

/** The schema of a field that holds a yes or a no. */
export const BOOLEAN_SCHEMA: JSONSchema4BooleanSchema = { type: 'boolean' }

/** The schema of a list of words, the shape most fields of the plugins take. */
export const STRING_LIST_SCHEMA = buildListSchema(STRING_SCHEMA)

/** The schema of a map from a word to another, such as a suffix to its folder. */
export const STRING_MAP_SCHEMA = buildMapSchema(STRING_SCHEMA)
