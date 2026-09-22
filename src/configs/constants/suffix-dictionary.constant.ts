import type { DictionarySuffix } from '../types/constants/index.js'

/**
 * Every suffix these conventions know, and the folder that holds it.
 *
 * A file is named in the singular and the folder that holds it is the plural, so the folder is never a judgement
 * call. The dictionary is the one place that pairing is written: a tier's vocabulary is cut from it, and a
 * project's own map is checked against it, so no two maps can spell the same folder differently.
 *
 * It is a dictionary rather than a rule because every word here is jargon. A pluralizer that knows English answers
 * `schemata` for `schema` and `indices` for `index`, with the same confidence it answers `configs`, and a wrong
 * folder spelled confidently is worse than one the configuration refuses to guess. A word this map does not carry
 * fails where the configuration is written, and the fix is the one line that adds it.
 *
 * `spec` is the single entry whose folder is not the plural of the word: a test sits in `__tests__`, which is the
 * name the ecosystem uses.
 */
export const SUFFIX_DICTIONARY = {
  action: 'actions',
  adapter: 'adapters',
  builder: 'builders',
  cache: 'caches',
  channel: 'channels',
  client: 'clients',
  column: 'columns',
  component: 'components',
  config: 'configs',
  constant: 'constants',
  context: 'contexts',
  controller: 'controllers',
  cookie: 'cookies',
  decorator: 'decorators',
  dictionary: 'dictionaries',
  doc: 'docs',
  dto: 'dtos',
  entity: 'entities',
  error: 'errors',
  example: 'examples',
  exception: 'exceptions',
  factory: 'factories',
  filter: 'filters',
  fixture: 'fixtures',
  guard: 'guards',
  hook: 'hooks',
  indicator: 'indicators',
  interceptor: 'interceptors',
  key: 'keys',
  locale: 'locales',
  logger: 'loggers',
  middleware: 'middlewares',
  mock: 'mocks',
  notification: 'notifications',
  parser: 'parsers',
  pipe: 'pipes',
  plugin: 'plugins',
  processor: 'processors',
  provider: 'providers',
  query: 'queries',
  refinement: 'refinements',
  registry: 'registries',
  repository: 'repositories',
  rule: 'rules',
  schema: 'schemas',
  screen: 'screens',
  script: 'scripts',
  service: 'services',
  spec: '__tests__',
  specification: 'specifications',
  storage: 'storages',
  store: 'stores',
  style: 'styles',
  strategy: 'strategies',
  table: 'tables',
  template: 'templates',
  transformer: 'transformers',
  transport: 'transports',
  type: 'types',
  util: 'utils',
  worker: 'workers',
} as const

/**
 * Cuts a vocabulary out of the dictionary, keeping what each folder is spelled as.
 *
 * A tier names the suffixes its stack writes and reads the folders from one place, so a default that names a folder
 * cannot drift from the map every rule judges against.
 *
 * @param suffixes - The suffixes this vocabulary admits.
 * @returns The suffixes paired with the folder the dictionary gives each one.
 */
export const readFolders = <const TSuffixes extends readonly DictionarySuffix[]>(
  suffixes: TSuffixes,
): { [TSuffix in TSuffixes[number]]: (typeof SUFFIX_DICTIONARY)[TSuffix] } =>
  Object.fromEntries(suffixes.map(suffix => [suffix, SUFFIX_DICTIONARY[suffix]])) as {
    [TSuffix in TSuffixes[number]]: (typeof SUFFIX_DICTIONARY)[TSuffix]
  }
