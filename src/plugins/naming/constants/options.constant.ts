import { BOOLEAN_SCHEMA, STRING_LIST_SCHEMA, STRING_MAP_SCHEMA, STRING_SCHEMA } from '../../shared/constants/index.js'
import { buildListSchema, buildObjectSchema } from '../../shared/utils/index.js'

/**
 * What a configuration of the `naming` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 */
export const OPTIONS_SCHEMA = buildObjectSchema({
  roleNames: STRING_LIST_SCHEMA,
  forbiddenNames: buildListSchema(buildObjectSchema({ name: STRING_SCHEMA, because: STRING_SCHEMA })),
  forbiddenWords: buildListSchema(
    buildObjectSchema(
      { word: STRING_SCHEMA, because: STRING_SCHEMA, position: { ...STRING_SCHEMA, enum: ['anywhere', 'last'] } },
      ['position'],
    ),
  ),
  verbParticiples: STRING_MAP_SCHEMA,
  valueCases: buildListSchema(
    buildObjectSchema({
      endsWith: STRING_SCHEMA,
      casing: { ...STRING_SCHEMA, enum: ['camelCase', 'kebab-case'] },
      deep: BOOLEAN_SCHEMA,
    }),
  ),
  assertionMatchers: STRING_LIST_SCHEMA,
  resourceSuffixes: STRING_LIST_SCHEMA,
  resourceFreeStems: STRING_LIST_SCHEMA,
  resourceFreeMethods: STRING_LIST_SCHEMA,
  testFolder: STRING_SCHEMA,
})
