import { BOOLEAN_SCHEMA, STRING_LIST_SCHEMA, STRING_SCHEMA } from '../../shared/constants/json-schema.constant.js'
import { buildListSchema } from '../../shared/utils/build-list-schema.util.js'
import { buildObjectSchema } from '../../shared/utils/build-object-schema.util.js'

/**
 * What a configuration of the `tsdoc` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 */
export const OPTIONS_SCHEMA = buildObjectSchema({
  commentWidth: { type: 'integer', minimum: 1 },
  readsReleaseTags: BOOLEAN_SCHEMA,
  throwsConditions: buildListSchema(buildObjectSchema({ title: STRING_SCHEMA, condition: STRING_SCHEMA })),
  throwsTitleProperties: STRING_LIST_SCHEMA,
})
