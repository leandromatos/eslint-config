import type { TSESLint } from '@typescript-eslint/utils'

import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_NAMING,
  DEFAULT_TESTING,
  DEFAULT_TEXT,
  DEFAULT_TSDOC,
  DEFAULT_TYPESCRIPT,
} from '../configs/constants/index.js'
import { RULES } from './constants/index.js'
import { PACKAGE, VERSION } from './shared/constants/index.js'
import type { PluginOptions } from './types/index.js'

export type * from './types/index.js'

/** The files a project's rules judge when a configuration names none. */
const DEFAULT_FILES = ['src/**/*.ts']

/** The prefix a configuration writes before a rule name, and the key it registers the plugin under. */
const NAMESPACE = 'leandromatos'

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
  rules: Object.fromEntries(Object.entries(RULES).map(([name, { rule, group }]) => [`${group}-${name}`, rule])),
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
export const leandromatos = (
  pluginOptions: PluginOptions,
  files: string[] = DEFAULT_FILES,
): TSESLint.FlatConfig.Config => {
  const name = `${NAMESPACE}/recommended`
  const plugins = { [NAMESPACE]: plugin }
  const rules: TSESLint.FlatConfig.Rules = Object.fromEntries(
    Object.entries(RULES).map(([rule, { group }]) => [
      `${NAMESPACE}/${group}-${rule}`,
      ['error', pluginOptions[group]],
    ]),
  )

  return { name, files, plugins, rules }
}

/*
 * A plugin's configurations are configurations, which is what `extends: ['leandromatos/recommended']` resolves to.
 * The default vocabulary is what this one carries; a project with another calls {@link leandromatos} with its own.
 */
Object.assign(plugin, {
  configs: {
    recommended: [
      leandromatos({
        architecture: DEFAULT_ARCHITECTURE,
        naming: DEFAULT_NAMING,
        testing: DEFAULT_TESTING,
        text: DEFAULT_TEXT,
        tsdoc: DEFAULT_TSDOC,
        typescript: DEFAULT_TYPESCRIPT,
      }),
    ],
  },
})
