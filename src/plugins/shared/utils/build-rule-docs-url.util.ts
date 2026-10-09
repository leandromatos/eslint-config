/** Where the documentation of every rule is published: the docs folder of its plugin, on the default branch. */
const DOCS_ROOT = 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins'

/**
 * Builds the address of the page that documents a rule, which ESLint shows beside every report of it.
 *
 * @param group - The subject the rule belongs to, which is the folder of its plugin.
 * @param rule - The name of the rule, without its subject.
 * @returns The address.
 */
export const buildRuleDocsUrl = (group: string, rule: string): string => `${DOCS_ROOT}/${group}/docs/rules/${rule}.md`
