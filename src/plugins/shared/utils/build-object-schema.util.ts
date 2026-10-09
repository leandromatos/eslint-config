import type { JSONSchema4, JSONSchema4ObjectSchema } from '@typescript-eslint/utils/json-schema'

/**
 * Builds the schema of an object whose fields are the ones named, and no others.
 *
 * Every field is required unless it is named as optional, so a field is written once rather than once among the
 * properties and again in `required`. `additionalProperties` is false on purpose: a field the plugin does not read is
 * a field somebody meant to spell differently.
 *
 * @param properties - The schema of each field, by its name.
 * @param optionalFields - The fields a configuration may leave out.
 * @returns The schema.
 */
export const buildObjectSchema = (
  properties: Record<string, JSONSchema4>,
  optionalFields: string[] = [],
): JSONSchema4ObjectSchema => {
  const required = Object.keys(properties).filter(field => !optionalFields.includes(field))
  const objectSchema: JSONSchema4ObjectSchema = { type: 'object', properties, required, additionalProperties: false }

  return objectSchema
}
