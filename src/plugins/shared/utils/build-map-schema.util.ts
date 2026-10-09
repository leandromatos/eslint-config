import type { JSONSchema4, JSONSchema4ObjectSchema } from '@typescript-eslint/utils/json-schema'

/**
 * Builds the schema of a map whose keys a project chooses and whose every value answers to one schema.
 *
 * @param additionalProperties - The schema each value answers to.
 * @returns The schema.
 */
export const buildMapSchema = (additionalProperties: JSONSchema4): JSONSchema4ObjectSchema => ({
  type: 'object',
  additionalProperties,
})
