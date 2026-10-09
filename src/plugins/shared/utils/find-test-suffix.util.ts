/**
 * Finds the suffix a spec carries: the one the map places in the test folder, `spec` for `__tests__`.
 *
 * @param suffixToFolder - The suffixes the project admits, each paired with its folder.
 * @param testFolder - The folder that holds the tests.
 * @returns The suffix, and nothing for a map that places no suffix in the test folder.
 */
export const findTestSuffix = (suffixToFolder: Record<string, string>, testFolder: string): string | undefined =>
  Object.keys(suffixToFolder).find(suffix => suffixToFolder[suffix] === testFolder)
