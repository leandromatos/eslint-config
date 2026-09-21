import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * What a configuration of the `testing` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 * `additionalProperties` is false on purpose: a field the plugin does not read is a field somebody meant to
 * spell differently.
 */
export const OPTIONS_SCHEMA: JSONSchema4 = {
  type: 'object',
  properties: {
    testFolder: { type: 'string' },
    testKinds: { type: 'array', items: { type: 'string' } },
    mirroringTestKinds: { type: 'array', items: { type: 'string' } },
    suffixToFolder: { type: 'object', additionalProperties: { type: 'string' } },
    httpTest: {
      type: 'object',
      properties: { kind: { type: 'string' }, client: { type: 'string' } },
      required: ['kind', 'client'],
      additionalProperties: false,
    },
  },
  required: ['testFolder', 'testKinds', 'mirroringTestKinds', 'suffixToFolder', 'httpTest'],
  additionalProperties: false,
}
