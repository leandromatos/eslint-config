import type { TSESLint } from '@typescript-eslint/utils'

import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_FILES,
  DEFAULT_NAMING,
  DEFAULT_TEXT,
  DEFAULT_TSDOC,
  DEFAULT_TYPESCRIPT,
} from '../configs/constants/index.js'
import { CONSTANT_RULES, RULES } from './constants/index.js'
import { PACKAGE, VERSION } from './shared/constants/index.js'
import type { PluginOptions } from './types/index.js'

export type * from './types/index.js'

/** What the testing rules read of the default architecture: the test tree, the map and the alias. */
const { testFolder, testKinds, mirroringTestKinds, suffixToFolder, alias } = DEFAULT_ARCHITECTURE

/** The prefix a configuration writes before a rule name, and the key it registers the plugin under. */
export const NAMESPACE = 'leandromatos'

/**
 * Every rule of this package, under one namespace.
 *
 * One plugin rather than one per subject: a namespace is global to a configuration, and ESLint refuses a second
 * plugin registered under a name another already took. A word as common as `testing` is a name another plugin
 * claims, so the subject opens the rule's own name, which carries no slash: ESLint reads the first one as the
 * boundary between the namespace and the rule.
 */
export const plugin: TSESLint.FlatConfig.Plugin = {
  meta: { name: PACKAGE, version: VERSION, namespace: NAMESPACE },
  rules: Object.fromEntries([...RULES, ...CONSTANT_RULES].map(({ name, rule, group }) => [`${group}-${name}`, rule])),
}

/**
 * Every rule of this package, on, each reading the vocabulary of its own subject.
 *
 * `plugin.configs.recommended` is the same rules with the default vocabulary, for a configuration that reaches them
 * by `extends` rather than by calling this.
 *
 * @param pluginOptions - What the rules judge against, one vocabulary per subject.
 * @param files - The files the rules judge, which defaults to the sources of a project.
 * @returns The configuration.
 */
export const buildPluginConfig = (
  pluginOptions: PluginOptions,
  files: string[] = DEFAULT_FILES,
): TSESLint.FlatConfig.Config => {
  const name = `${NAMESPACE}/rules`
  const plugins = { [NAMESPACE]: plugin }
  const rules: TSESLint.FlatConfig.Rules = Object.fromEntries(
    RULES.map(({ name: rule, group }) => [`${NAMESPACE}/${group}-${rule}`, ['error', pluginOptions[group]]]),
  )

  return { name, files, plugins, rules }
}

/*
 * A plugin's configurations are configurations, which is what `extends: [plugin.configs.recommended]` resolves to.
 * The default vocabulary is what this one carries; a project with another calls `buildPluginConfig` with its own.
 * The configuration names the plugin it turns on, so it is attached once the plugin exists.
 */
Object.assign(plugin, {
  configs: {
    recommended: [
      buildPluginConfig({
        architecture: DEFAULT_ARCHITECTURE,
        naming: { ...DEFAULT_NAMING, testFolder },
        testing: { testFolder, testKinds, mirroringTestKinds, suffixToFolder, alias },
        text: DEFAULT_TEXT,
        tsdoc: DEFAULT_TSDOC,
        typescript: DEFAULT_TYPESCRIPT,
      }),
    ],
  },
})
