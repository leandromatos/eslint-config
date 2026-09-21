import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * What a configuration of the `naming` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 * `additionalProperties` is false on purpose: a field the plugin does not read is a field somebody meant to
 * spell differently.
 */
export const OPTIONS_SCHEMA: JSONSchema4 = {
  type: 'object',
  properties: {
    roleNames: { type: 'array', items: { type: 'string' } },
    forbiddenNames: { type: 'array', items: { type: 'string' } },
    verbParticiples: { type: 'object', additionalProperties: { type: 'string' } },
    valueCases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          endsWith: { type: 'string' },
          casing: { type: 'string', enum: ['camelCase', 'kebab-case'] },
          deep: { type: 'boolean' },
        },
        required: ['endsWith', 'casing', 'deep'],
        additionalProperties: false,
      },
    },
    assertionMatchers: { type: 'array', items: { type: 'string' } },
    resourceSuffixes: { type: 'array', items: { type: 'string' } },
    resourceFreeStems: { type: 'array', items: { type: 'string' } },
    resourceFreeMethods: { type: 'array', items: { type: 'string' } },
    testFolder: { type: 'string' },
  },
  required: [
    'roleNames',
    'forbiddenNames',
    'verbParticiples',
    'valueCases',
    'assertionMatchers',
    'resourceSuffixes',
    'resourceFreeStems',
    'resourceFreeMethods',
    'testFolder',
  ],
  additionalProperties: false,
}
