import { describe, expect, it } from 'vitest'

import { SUFFIX_DICTIONARY } from '../../../constants/index.js'
import { assertKnownFolders } from '../../../utils/index.js'

describe('assertKnownFolders', () => {
  it('accepts a vocabulary the dictionary spells the same way', () => {
    expect(() => assertKnownFolders({ config: 'configs', spec: '__tests__' })).not.toThrow()
  })

  it('refuses a folder that is the suffix itself, which is a plural nobody wrote', () => {
    expect(() => assertKnownFolders({ config: 'config' })).toThrow('".config.ts" sits in "configs/"')
  })

  it('refuses a folder the dictionary spells differently', () => {
    expect(() => assertKnownFolders({ factory: 'factorys' })).toThrow('".factory.ts" sits in "factories/"')
  })

  it('refuses a suffix no dictionary carries, rather than guessing its plural', () => {
    expect(() => assertKnownFolders({ widget: 'widgets' })).toThrow('".widget.ts" is in no dictionary')
  })

  it('accepts what the project adds to the dictionary', () => {
    expect(() => assertKnownFolders({ widget: 'widgets' }, { widget: 'widgets' })).not.toThrow()
  })

  it('checks what the project adds against the project, so one spelling holds there too', () => {
    expect(() => assertKnownFolders({ widget: 'widget' }, { widget: 'widgets' })).toThrow(
      '".widget.ts" sits in "widgets/"',
    )
  })

  it('names every disagreement at once, so one run says everything to fix', () => {
    expect(() => assertKnownFolders({ config: 'config', widget: 'widgets' })).toThrow(/config[\s\S]*widget/)
  })

  it('spells the folder of every suffix it carries as the plural, apart from the test folder', () => {
    const plural = (suffix: string): string[] =>
      /[^aeiou]y$/.test(suffix) ? [`${suffix.slice(0, -1)}ies`] : [`${suffix}s`, `${suffix}es`]
    const irregular = Object.entries(SUFFIX_DICTIONARY).filter(([suffix, folder]) => !plural(suffix).includes(folder))

    expect(irregular).toEqual([['spec', '__tests__']])
  })
})
