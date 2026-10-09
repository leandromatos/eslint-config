import { STRING_LIST_SCHEMA, STRING_MAP_SCHEMA, STRING_SCHEMA } from '../../shared/constants/index.js'
import { buildObjectSchema } from '../../shared/utils/index.js'

/**
 * What a configuration of the `testing` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 */
export const OPTIONS_SCHEMA = buildObjectSchema(
  {
    testFolder: STRING_SCHEMA,
    testKinds: STRING_LIST_SCHEMA,
    mirroringTestKinds: STRING_LIST_SCHEMA,
    suffixToFolder: STRING_MAP_SCHEMA,
    alias: STRING_SCHEMA,
    httpTest: buildObjectSchema({ kind: STRING_SCHEMA, client: STRING_SCHEMA }),
  },
  ['httpTest'],
)
