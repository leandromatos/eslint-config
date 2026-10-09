/**
 * The suffixes any TypeScript project writes, whatever its framework, and the folder each one lives in.
 *
 * A file is named in the singular and the folder that holds it is the plural, so the folder is never a judgment call.
 * A suffix two stacks write, such as the `component` of an email and of a React tree, belongs here as well. The design
 * patterns of the catalog at refactoring.guru belong here too, each under the name of its participant:
 * Chain of Responsibility writes a `handler`, Factory Method and Abstract Factory write a `factory`. `spec` is the one
 * entry whose folder is not the plural of the word: a test sits in `__tests__`, which is the name the ecosystem uses.
 */
export const AGNOSTIC_SUFFIX_DICTIONARY = {
  adapter: 'adapters',
  bridge: 'bridges',
  builder: 'builders',
  client: 'clients',
  command: 'commands',
  component: 'components',
  composite: 'composites',
  config: 'configs',
  constant: 'constants',
  decorator: 'decorators',
  error: 'errors',
  exception: 'exceptions',
  facade: 'facades',
  factory: 'factories',
  fixture: 'fixtures',
  flyweight: 'flyweights',
  handler: 'handlers',
  interceptor: 'interceptors',
  iterator: 'iterators',
  locale: 'locales',
  logger: 'loggers',
  mediator: 'mediators',
  memento: 'mementos',
  middleware: 'middlewares',
  mock: 'mocks',
  observer: 'observers',
  parser: 'parsers',
  plugin: 'plugins',
  prototype: 'prototypes',
  provider: 'providers',
  proxy: 'proxies',
  registry: 'registries',
  rule: 'rules',
  schema: 'schemas',
  script: 'scripts',
  singleton: 'singletons',
  spec: '__tests__',
  state: 'states',
  strategy: 'strategies',
  template: 'templates',
  type: 'types',
  util: 'utils',
  visitor: 'visitors',
  worker: 'workers',
} as const

/** The layers NestJS writes on top of the agnostic ones: what a module is cut into, and what runs beside a request. */
export const NESTJS_SUFFIX_DICTIONARY = {
  cache: 'caches',
  channel: 'channels',
  controller: 'controllers',
  doc: 'docs',
  dto: 'dtos',
  entity: 'entities',
  example: 'examples',
  filter: 'filters',
  guard: 'guards',
  indicator: 'indicators',
  instrumentation: 'instrumentations',
  notification: 'notifications',
  pipe: 'pipes',
  processor: 'processors',
  publisher: 'publishers',
  repository: 'repositories',
  service: 'services',
  specification: 'specifications',
  transformer: 'transformers',
  transport: 'transports',
  workflow: 'workflows',
} as const

/** The layers a React tree writes on top of the agnostic ones, on the web and on React Native alike. */
export const REACT_SUFFIX_DICTIONARY = {
  action: 'actions',
  context: 'contexts',
  hook: 'hooks',
  icon: 'icons',
  key: 'keys',
  part: 'parts',
  query: 'queries',
  screen: 'screens',
  section: 'sections',
  storage: 'storages',
  store: 'stores',
  style: 'styles',
} as const

/**
 * Every suffix these conventions know, and the folder that holds it: the union of the three layers above.
 *
 * It is a dictionary rather than a rule because every word here is jargon. A pluralizer that knows English answers
 * `schemata` for `schema` and `indices` for `index`, with the same confidence it answers `configs`, and a wrong folder
 * spelled confidently is worse than one the configuration refuses to guess. A project that writes a suffix of its own
 * names its folder in `architecture.suffixDictionary`, and a map that spells a known suffix another way fails where
 * the configuration is written.
 */
export const SUFFIX_DICTIONARY = {
  ...AGNOSTIC_SUFFIX_DICTIONARY,
  ...NESTJS_SUFFIX_DICTIONARY,
  ...REACT_SUFFIX_DICTIONARY,
} as const
