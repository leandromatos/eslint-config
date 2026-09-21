import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * What a configuration of the `tsdoc` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 * `additionalProperties` is false on purpose: a field the plugin does not read is a field somebody meant to
 * spell differently.
 */
export const OPTIONS_SCHEMA: JSONSchema4 = {
  type: 'object',
  properties: {
    commentWidth: { type: 'integer', minimum: 1 },
    testFolder: { type: 'string' },
    frameworkSymbols: { type: 'array', items: { type: 'string' } },
  },
  required: ['commentWidth', 'testFolder', 'frameworkSymbols'],
  additionalProperties: false,
}
