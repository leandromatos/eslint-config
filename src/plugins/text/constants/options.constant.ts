import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * What a configuration of the `text` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 * `additionalProperties` is false on purpose: a field the plugin does not read is a field somebody meant to
 * spell differently.
 */
export const OPTIONS_SCHEMA: JSONSchema4 = {
  type: 'object',
  properties: {
    stringPatterns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          callee: { type: 'string' },
          property: { type: 'string' },
          target: { type: 'string' },
          must: { type: 'string' },
          mustNot: { type: 'string' },
          because: { type: 'string' },
        },
        required: ['callee', 'because'],
        additionalProperties: false,
      },
    },
  },
  required: ['stringPatterns'],
  additionalProperties: false,
}
