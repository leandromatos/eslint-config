/** The names a barrel takes: the index of a directory, written as a module or as a component file. */
export const INDEX_FILES = ['index.ts', 'index.tsx']

/** What a source file the rules read is written in: TypeScript, as a module or as a component, never a declaration. */
export const SOURCE_FILE_REG_EXP = /(?<!\.d)\.tsx?$/

/** The prefix an import names the source root with, when a configuration names none. */
export const DEFAULT_IMPORT_ALIAS = '@'
