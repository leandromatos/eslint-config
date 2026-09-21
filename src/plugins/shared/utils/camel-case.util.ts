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
 * `userEntity` for `UserEntity`, `oauthClient` for `OAuthClient`, `httpError` for `HTTPError`,
 * `id` for `ID`. A leading run of capitals is an acronym; two letters fold whole, and a longer
 * run keeps its last capital, which opens the next word.
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
