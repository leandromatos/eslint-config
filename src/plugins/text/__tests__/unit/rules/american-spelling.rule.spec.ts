/* eslint-disable leandromatos/text-american-spelling -- the cases spell British words to prove the rule reports them */
import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { americanSpelling } from '../../../rules/american-spelling.rule.js'
import type { TextOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()
const options: [TextOptions] = [EMPTY_OPTIONS]
const exceptions: [TextOptions] = [{ ...EMPTY_OPTIONS, spellingExceptions: ['colour', 'Grey-Colour'] }]

ruleTester.run('american-spelling', americanSpelling, {
  valid: [
    { code: "/** Paints the border in a color. */\nexport const color = 'center'", options },
    // A word both variants write, and a plural the American spelling shares, pass.
    { code: "export const cancellation = 'analyses of the parameters'", options },
    // What a module, an import or another object names is spelled by whoever declares it.
    {
      code: "import { colour } from 'colour-kit'\nexport { behaviour } from './behaviour.js'\nexport const read = () => colour",
      options,
    },
    { code: "export const loaded = import('./colour.js')\nexport const shade = palette.colour", options },
    // A key of an object literal is a field of a payload, which its schema spells.
    { code: 'export const payload = { colour: 1 }', options },
    // A word another system defines is listed by the project, in any case.
    { code: "// The provider names the field 'colour'.\nexport const field = 'COLOUR'", options: exceptions },
    { code: "export const token = 'grey-colour'", options: exceptions },
    { code: 'export const count = 1', options },
  ],
  invalid: [
    {
      code: '// Picks the colour of the badge.\nexport const pick = () => 1',
      options,
      errors: [{ messageId: 'britishSpelling', data: { word: 'colour', american: 'color' } }],
    },
    {
      code: 'export const colourScheme = (favouriteBehaviour) => favouriteBehaviour',
      options,
      errors: [
        { messageId: 'britishSpelling', data: { word: 'colour', american: 'color' } },
        { messageId: 'britishSpelling', data: { word: 'Behaviour', american: 'behavior' } },
        { messageId: 'britishSpelling', data: { word: 'favour', american: 'favor' } },
      ],
    },
    {
      code: "export const label = 'Cancelled by the organiser'",
      options,
      errors: [{ messageId: 'britishSpelling' }, { messageId: 'britishSpelling' }],
    },
    {
      code: 'export const label = `Travelled ${distance} metres`',
      options,
      errors: [{ messageId: 'britishSpelling' }, { messageId: 'britishSpelling' }],
    },
    {
      code: 'class Session {\n  initialised = true\n\n  serialise() {}\n}\ninterface Licence {\n  analysed: boolean\n}',
      options,
      errors: [
        { messageId: 'britishSpelling' },
        { messageId: 'britishSpelling' },
        { messageId: 'britishSpelling' },
        { messageId: 'britishSpelling' },
      ],
    },
  ],
})

ruleTester.run('american-spelling, in markup', americanSpelling, {
  valid: [],
  invalid: [
    {
      code: 'export const Badge = () => <span>Choose a colour</span>',
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      options,
      errors: [{ messageId: 'britishSpelling', data: { word: 'colour', american: 'color' } }],
    },
  ],
})
