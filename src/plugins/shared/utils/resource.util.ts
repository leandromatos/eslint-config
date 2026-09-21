/**
 * The forms a resource takes in a name: `User` and `Users` for `users`; `CredentialToken`, `CredentialTokens`, `Token`
 * and `Tokens` for `credential-tokens`.
 *
 * @param stem - The file name before its suffix.
 * @returns The forms, each of them once.
 */
export const resourceFormsOf = (stem: string): string[] => {
  const words = stem.split('-')
  /* v8 ignore next -- a stem split on its dashes always has a last word */
  const last = words[words.length - 1] ?? ''
  const head = words.slice(0, -1).map(toPascalCase).join('')
  const forms = [toPascalCase(singularOf(last)), toPascalCase(pluralOf(last))]

  return [...new Set([...forms.map(form => `${head}${form}`), ...forms])]
}

/**
 * `users.service` reads as `UsersService`; `to-stored-timestamp.util` as `ToStoredTimestampUtil`.
 *
 * @param word - The words, separated by dashes or dots.
 * @returns The name in Pascal case.
 */
export const toPascalCase = (word: string): string =>
  word
    .split(/[-.]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

/**
 * `policy` for `policies`, `box` for `boxes`, `user` for `users`.
 *
 * @param word - The word as the file name spells it.
 * @returns The word in the singular.
 */
const singularOf = (word: string): string => {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.endsWith('ses') || word.endsWith('xes')) return word.slice(0, -2)
  if (word.endsWith('s')) return word.slice(0, -1)

  return word
}

/**
 * `policies` for `policy`, `users` for `user`; a word already plural is left alone.
 *
 * @param word - The word as the file name spells it.
 * @returns The word in the plural.
 */
const pluralOf = (word: string): string => {
  if (word.endsWith('s')) return word
  if (word.endsWith('y')) return `${word.slice(0, -1)}ies`

  return `${word}s`
}
