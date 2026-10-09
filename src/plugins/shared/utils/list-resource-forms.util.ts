import { toPascalCase } from './letter-case.util.js'

/**
 * The forms a resource takes in a name: `User` and `Users` for `users`; `CredentialToken`, `CredentialTokens`, `Token`
 * and `Tokens` for `credential-tokens`.
 *
 * The plural here is guessed, where the dictionary of folders refuses to guess one. The two differ in what a wrong
 * guess costs: a folder guessed wrong is a folder the rules then demand, while a form guessed wrong is one more name a
 * method may carry, and the forms the file name spells are always among them.
 *
 * @param stem - The file name before its suffix.
 * @returns The forms, each of them once.
 */
export const listResourceForms = (stem: string): string[] => {
  const lastDash = stem.lastIndexOf('-')
  const last = stem.slice(lastDash + 1)
  const head = toPascalCase(stem.slice(0, Math.max(lastDash, 0)))
  const forms = [toPascalCase(toSingular(last)), toPascalCase(toPlural(last))]

  return [...new Set([...forms.map(form => `${head}${form}`), ...forms])]
}

/**
 * `policy` for `policies`, `box` for `boxes`, `user` for `users`.
 *
 * @param word - The word as the file name spells it.
 * @returns The word in the singular.
 */
const toSingular = (word: string): string => {
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
const toPlural = (word: string): string => {
  if (word.endsWith('s')) return word
  if (word.endsWith('y')) return `${word.slice(0, -1)}ies`

  return `${word}s`
}
