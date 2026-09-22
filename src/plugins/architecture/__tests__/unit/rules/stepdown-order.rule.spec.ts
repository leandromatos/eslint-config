import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { stepdownOrder } from '../../../rules/stepdown-order.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [EMPTY_OPTIONS]
const util = sourceFile('users', 'utils', 'read-user.util.ts')

ruleTester.run('stepdown-order', stepdownOrder, {
  valid: [
    // A helper an initializer reaches runs while the module loads, so moving it down puts the call in its dead zone.
    {
      code: 'const dp = (value: string): number => Number(value)\n\nconst SIZES = { small: dp("4") }\n\nconst read = () => dp("8") + SIZES.small',
      filename: util,
      options,
    },

    // A function declaration is read the same way an arrow is.
    {
      code: 'export function readUser() {\n  return nameOf(1)\n}\n\nfunction nameOf(id) {\n  return id\n}',
      filename: util,
      options,
    },
    // An export that declares nothing, and a declaration that is no function, are not part of the walk.
    { code: 'export * from "./other.util.js"\n\nexport const readUser = () => 1', filename: util, options },
    { code: 'export class Reader {}\n\nexport const readUser = () => 1', filename: util, options },
    { code: 'const NAMES = []\n\nexport const readUser = () => NAMES', filename: util, options },
    // Two callers that disagree on the order of the same pair leave it where it is.
    {
      code: 'export const readUser = () => `${nameOf(1)}${ageOf(1)}`\n\nexport const writeUser = () => `${ageOf(1)}${nameOf(1)}`\n\nconst nameOf = (id) => id\n\nconst ageOf = (id) => id',
      filename: util,
      options,
    },

    // Two functions that call each other are left where they are.
    {
      code: 'export const readUser = () => nameOf(1)\n\nconst nameOf = (id) => ageOf(id)\n\nconst ageOf = (id) => nameOf(id)',
      filename: util,
      options,
    },
    // A declaration that is not a function is not part of the walk.

    {
      code: 'export const readUser = () => nameOf(1)\n\nconst nameOf = (id) => id',
      filename: util,
      options,
    },
    {
      code: 'export const readUser = () => `${nameOf(1)}${ageOf(1)}`\n\nconst nameOf = (id) => id\n\nconst ageOf = (id) => id',
      filename: util,
      options,
    },
  ],
  invalid: [
    // A callee reached through a third function is still a callee, and the walk finds it.
    {
      code: 'export const readUser = () => `${nameOf(1)}${ageOf(1)}`\n\nconst ageOf = (id) => `${deepOf(id)}`\n\nconst nameOf = (id) => id\n\nconst deepOf = (id) => nameOf(id)',
      filename: util,
      options,
      errors: [{ messageId: 'calleeBeforeCaller' }],
    },
    // A cycle of three is walked once: the second visit of a name ends the walk.
    {
      code: 'export const readUser = () => nameOf(1)\n\nconst nameOf = (id) => ageOf(id)\n\nconst ageOf = (id) => sizeOf(id)\n\nconst sizeOf = (id) => nameOf(id)',
      filename: util,
      options,
      errors: [{ messageId: 'calleeBeforeCaller' }],
    },

    {
      code: 'const nameOf = (id) => id\n\nexport const readUser = () => nameOf(1)',
      filename: util,
      options,
      errors: [{ messageId: 'calleeBeforeCaller' }],
    },
    {
      code: 'export const readUser = () => `${nameOf(1)}${ageOf(1)}`\n\nconst ageOf = (id) => id\n\nconst nameOf = (id) => id',
      filename: util,
      options,
      errors: [{ messageId: 'siblingsOutOfOrder' }],
    },
  ],
})
