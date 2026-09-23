import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * What a configuration of the `architecture` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 * `additionalProperties` is false on purpose: a field the plugin does not read is a field somebody meant to
 * spell differently.
 */
export const OPTIONS_SCHEMA: JSONSchema4 = {
  type: 'object',
  properties: {
    alias: { type: 'string' },
    suffixFreeFolders: { type: 'array', items: { type: 'string' } },
    coLocatedTypeSuffixes: { type: 'array', items: { type: 'string' } },
    suffixToFolder: { type: 'object', additionalProperties: { type: 'string' } },
    folderlessSuffixes: { type: 'array', items: { type: 'string' } },
    effectHooks: { type: 'array', items: { type: 'string' } },
    definitionTimeDirectives: { type: 'array', items: { type: 'string' } },
    moduleContainers: { type: 'array', items: { type: 'string' } },
    barrelledContainers: { type: 'array', items: { type: 'string' } },
    mirrorFolders: { type: 'array', items: { type: 'string' } },
    rootContexts: { type: 'array', items: { type: 'string' } },
    executedFolders: { type: 'array', items: { type: 'string' } },
    typeSuffixes: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
    orderedSuffixes: { type: 'array', items: { type: 'string' } },
    wholeArguments: {
      type: 'array',
      items: {
        type: 'object',
        properties: { suffix: { type: 'string' }, objects: { type: 'array', items: { type: 'string' } } },
        required: ['suffix', 'objects'],
        additionalProperties: false,
      },
    },
    testFolder: { type: 'string' },
    testKinds: { type: 'array', items: { type: 'string' } },
    mirroringTestKinds: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'alias',
    'suffixFreeFolders',
    'coLocatedTypeSuffixes',
    'suffixToFolder',
    'folderlessSuffixes',
    'effectHooks',
    'definitionTimeDirectives',
    'moduleContainers',
    'barrelledContainers',
    'mirrorFolders',
    'rootContexts',
    'executedFolders',
    'typeSuffixes',
    'orderedSuffixes',
    'wholeArguments',
    'testFolder',
    'testKinds',
    'mirroringTestKinds',
  ],
  additionalProperties: false,
}
