import type { JSONSchema4, JSONSchema4ArraySchema } from '@typescript-eslint/utils/json-schema'

/**
 * Builds the schema of a list whose every item answers to one schema.
 *
 * @param items - The schema each item answers to.
 * @returns The schema.
 */
export const buildListSchema = (items: JSONSchema4): JSONSchema4ArraySchema => ({ type: 'array', items })
