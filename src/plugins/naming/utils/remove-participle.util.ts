import { toLowerFirst } from '../../shared/utils/index.js'

/**
 * Removes the participle a name opens with: `activity` for `builtActivity`. A participle of another verb is replaced
 * rather than stacked under, and a name that opens with none is left alone.
 *
 * @param name - The name as it is declared.
 * @param participles - The participles a producing verb gives its result.
 * @returns The name without the participle.
 */
export const removeParticiple = (name: string, participles: string[]): string => {
  const participle = participles.find(each => name.startsWith(each) && /[A-Z]/.test(name.charAt(each.length)))
  if (!participle) return name

  return toLowerFirst(name.slice(participle.length))
}
