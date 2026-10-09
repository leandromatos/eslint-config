import {
  buildPackageSourcePath,
  buildSourcePath,
  createSyntaxRuleTester,
  extendRuleOptions,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { effectInHook } from '../../../rules/effect-in-hook.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    suffixToFolder: { component: 'components', hook: 'hooks', screen: 'screens' },
    effectHooks: ['useEffect', 'useLayoutEffect'],
  },
]

ruleTester.run('effect-in-hook', effectInHook, {
  valid: [
    // A hook is where an effect is written, and its name says what it synchronizes.
    {
      code: 'export const useSessionTimeout = () => {\n  useEffect(() => undefined, [])\n}',
      filename: buildSourcePath('features', 'auth', 'hooks', 'use-session-timeout.hook.ts'),
      options,
    },

    // A component that calls no effect is none of the rule's business.
    {
      code: 'export const Card = () => null',
      filename: buildSourcePath('components', 'card.component.tsx'),
      options,
    },

    // A call of the same name that is not one of the named effects.
    {
      code: 'export const Card = () => {\n  useMemo(() => 1, [])\n\n  return null\n}',
      filename: buildSourcePath('components', 'card.component.tsx'),
      options,
    },

    // A call of something the source does not name.
    {
      code: 'export const Card = () => {\n  build()()\n\n  return null\n}',
      filename: buildSourcePath('components', 'card.component.tsx'),
      options,
    },

    // With no effect named, the rule judges nothing.
    {
      code: 'export const Card = () => {\n  useEffect(() => undefined, [])\n\n  return null\n}',
      filename: buildSourcePath('components', 'card.component.tsx'),
      options: extendRuleOptions(options, { effectHooks: [] }),
    },
  ],
  invalid: [
    {
      code: 'export const Card = () => {\n  useEffect(() => undefined, [])\n\n  return null\n}',
      filename: buildSourcePath('components', 'card.component.tsx'),
      options,
      errors: [{ messageId: 'effectOutsideHook' }],
    },
    {
      code: 'export const Screen = () => {\n  React.useLayoutEffect(() => undefined, [])\n\n  return null\n}',
      filename: buildSourcePath('features', 'auth', 'screens', 'sign-in.screen.tsx'),
      options,
      errors: [{ messageId: 'effectOutsideHook' }],
    },
    {
      code: 'export const boot = () => {\n  useEffect(() => undefined, [])\n}',
      filename: buildSourcePath('boot.ts'),
      options,
      errors: [{ messageId: 'effectOutsideHook' }],
    },
  ],
})

ruleTester.run('effect-in-hook, in a repository of several packages', effectInHook, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: 'export const Card = () => {\n  useEffect(() => undefined, [])\n\n  return null\n}',
      filename: 'libs/x/components/card.component.tsx',
      options,
    },
  ],
  invalid: [
    {
      code: 'export const Card = () => {\n  useEffect(() => undefined, [])\n\n  return null\n}',
      filename: buildPackageSourcePath('libs/x', 'components', 'card.component.tsx'),
      options,
      errors: [{ messageId: 'effectOutsideHook' }],
    },
  ],
})
