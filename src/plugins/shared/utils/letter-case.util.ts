/**
 * Splits a name into its lowercase words: at each capital that opens a word, at each underscore and each dash. A run
 * of capitals is one word, an acronym, until a capital opens a lowercase word after it.
 *
 * `userData` and `UserData` hold `data`; `metadata` holds none; `OAuthClient` holds `o`, `auth` and `client`.
 *
 * @param name - The name as it is declared, or a sentence.
 * @returns The words, in order.
 */
export const splitIntoWords = (name: string): string[] =>
  (name.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/g) ?? []).map(word => word.toLowerCase())

/**
 * `REG_EXP` for `RegExp`, `USER_ENTITY` for `UserEntity`, `OAUTH_CLIENT` for `OAuthClient`.
 *
 * @param name - The name as it is declared.
 * @returns The name in screaming case.
 */
export const toScreamingCase = (name: string): string =>
  toCamelCase(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase()

/**
 * `userEntity` for `UserEntity`, `oauthClient` for `OAuthClient`, `httpError` for `HTTPError`, `id` for `ID`. A
 * leading run of capitals is an acronym; two letters fold whole, and a longer run keeps its last capital, which opens
 * the next word.
 *
 * @param name - The name as it is declared.
 * @returns The name in camel case.
 */
export const toCamelCase = (name: string): string => {
  const run = /^[A-Z]+/.exec(name)?.[0] ?? ''
  if (run.length === name.length) return name.toLowerCase()
  if (run.length <= 2) return `${run.toLowerCase()}${name.slice(run.length)}`

  return `${run.slice(0, -1).toLowerCase()}${name.slice(run.length - 1)}`
}

/**
 * `remove-extension` for `removeExtension`: a camel-case name the way a file name spells it.
 *
 * @param name - The name in camel case.
 * @returns The name in kebab case.
 */
export const toKebabCase = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * `UsersService` for `users.service`, `ToStoredTimestampUtil` for `to-stored-timestamp.util`.
 *
 * @param words - The words, separated by dashes or dots.
 * @returns The name in Pascal case.
 */
export const toPascalCase = (words: string): string =>
  words
    .split(/[-.]/)
    .map(part => toUpperFirst(part))
    .join('')

/**
 * The text with its first letter in upper case, so it reads as the next word of a camel-case name.
 *
 * @param text - The text.
 * @returns The text, its first letter raised.
 */
export const toUpperFirst = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/**
 * The text with its first letter in lower case, so it reads as the first word of a camel-case name.
 *
 * @param text - The text.
 * @returns The text, its first letter lowered.
 */
export const toLowerFirst = (text: string): string => `${text.charAt(0).toLowerCase()}${text.slice(1)}`
