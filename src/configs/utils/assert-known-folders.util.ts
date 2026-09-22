import { SUFFIX_DICTIONARY } from '../constants/index.js'

/**
 * Refuses a vocabulary that spells a folder the dictionary does not.
 *
 * The check runs where the configuration is written rather than where a file is judged, so a folder spelled twice
 * fails on the next lint instead of on the next file somebody moves. A suffix the dictionary does not carry fails
 * the same way: the configuration never guesses a plural, because every suffix here is jargon and a guess answers
 * `schemata` as confidently as it answers `configs`.
 *
 * @param suffixToFolder - The suffixes this project admits, paired with the folder each sits in.
 * @param suffixDictionary - What this project adds to the shared dictionary.
 * @throws Error When a folder disagrees with the dictionary, or a suffix is in neither.
 */
export const assertKnownFolders = (
  suffixToFolder: Record<string, string>,
  suffixDictionary: Record<string, string> = {},
): void => {
  const dictionary: Record<string, string> = { ...SUFFIX_DICTIONARY, ...suffixDictionary }
  const problems = Object.entries(suffixToFolder).flatMap(([suffix, folder]) => {
    const known = dictionary[suffix]
    if (!known)
      return [
        `".${suffix}.ts" is in no dictionary. Add "${suffix}" to \`architecture.suffixDictionary\` with the folder that holds it, or to the shared dictionary of this package.`,
      ]
    if (known !== folder) return [`".${suffix}.ts" sits in "${known}/", and this project says "${folder}/".`]

    return []
  })
  if (problems.length)
    throw new Error(`The folder vocabulary disagrees with the dictionary:\n- ${problems.join('\n- ')}`)
}
