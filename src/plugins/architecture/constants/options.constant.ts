import { STRING_LIST_SCHEMA, STRING_MAP_SCHEMA, STRING_SCHEMA } from '../../shared/constants/index.js'
import { buildListSchema, buildMapSchema, buildObjectSchema } from '../../shared/utils/index.js'

/**
 * What a configuration of the `architecture` rules has to hand them.
 *
 * Every rule of this plugin takes the same object, so the schema is declared once and each rule points at it.
 */
export const OPTIONS_SCHEMA = buildObjectSchema({
  alias: STRING_SCHEMA,
  suffixFreeFolders: STRING_LIST_SCHEMA,
  coLocatedTypeSuffixes: STRING_LIST_SCHEMA,
  suffixToFolder: STRING_MAP_SCHEMA,
  folderlessSuffixes: STRING_LIST_SCHEMA,
  effectHooks: STRING_LIST_SCHEMA,
  definitionTimeDirectives: STRING_LIST_SCHEMA,
  baseFolders: STRING_LIST_SCHEMA,
  moduleContainers: STRING_LIST_SCHEMA,
  barrelledContainers: STRING_LIST_SCHEMA,
  mirrorFolders: STRING_LIST_SCHEMA,
  rootContexts: STRING_LIST_SCHEMA,
  executedFolders: STRING_LIST_SCHEMA,
  typeSuffixes: buildMapSchema(STRING_LIST_SCHEMA),
  orderedSuffixes: STRING_LIST_SCHEMA,
  wholeArguments: buildListSchema(buildObjectSchema({ suffix: STRING_SCHEMA, objects: STRING_LIST_SCHEMA })),
  testFolder: STRING_SCHEMA,
  testingFolder: STRING_SCHEMA,
  mockFolder: STRING_SCHEMA,
  developmentSuffixes: STRING_LIST_SCHEMA,
  testKinds: STRING_LIST_SCHEMA,
  mirroringTestKinds: STRING_LIST_SCHEMA,
})
