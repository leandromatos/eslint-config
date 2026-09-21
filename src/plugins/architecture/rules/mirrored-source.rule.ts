import fs from 'node:fs'
import path from 'node:path'

import { fileRule } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureOptions, MirrorShape } from '../types/index.js'

/**
 * A file under a mirror folder mirrors a file in the tree beside that folder, and a mirror
 * folder inside the test folder mirrors the test folder's own tree. Two files mirror nothing
 * by design: a module's own vocabulary, named after the module, and a test of a kind the
 * options leave out of `mirroringTestKinds`.
 */
export const mirroredSource = fileRule(
  'A file under a mirror folder mirrors an existing file.',
  'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/mirrored-source.md',
  { noSource: '"{{file}}" mirrors no source: expected {{expected}}. Create it, or move the file.' },
  ({ file, suffix, segments, module, stem }, architectureOptions, context) => {
    const { suffixToFolder, mirrorFolders, testFolder, testKinds, mirroringTestKinds } = architectureOptions
    if (!suffix) return []
    const mirror = suffixToFolder[suffix]
    if (!mirror || !mirrorFolders.includes(mirror)) return []
    const at = segments.indexOf(mirror)
    if (at < 0) return []
    /*
     * The vocabulary of whatever holds the mirror folder, named after it: `naming.type.ts` under `naming/types/`. The
     * owner is the directory the mirror sits in, which is the module itself when the mirror sits at its root.
     */
    /* v8 ignore next -- the mirror is a segment of the path, so the module is what sits before it */
    const owner = segments[at - 1] ?? module
    const isVocabulary = file === `${owner}.${suffix}.ts` && at === segments.length - 1
    if (isVocabulary) return []
    const inner = segments.slice(at + 1)
    const kind = inner[0]
    if (mirror === testFolder && kind && !mirroringTestKinds.includes(kind)) return []
    const mirrorShape: MirrorShape = {
      base: path.join(context.cwd, 'src', ...segments.slice(0, at)),
      inner,
      stem,
      isTestTree: mirror === testFolder,
      isInsideTestTree: segments[at - 1] === testFolder,
      /* v8 ignore next -- the segment before the mirror is there whenever the one before it is the test folder */
      isInsideTestKind: segments[at - 2] === testFolder && testKinds.includes(segments[at - 1] ?? ''),
    }
    const candidates = resolveCandidates(mirrorShape, architectureOptions)
    if (candidates.some(candidate => fs.existsSync(candidate))) return []
    const expected = candidates.map(candidate => path.relative(context.cwd, candidate)).join(' or ')

    return [{ messageId: 'noSource', data: { file, expected } }]
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)

/**
 * The files the mirror may stand for.
 *
 * A file in the test tree drops its kind and mirrors a source. A file in a mirror folder inside
 * the test tree mirrors the test tree itself: inside a kind the mirrored file carries the test
 * suffix, and a file that names no kind may stand for a plain file or for a test of any kind.
 * A mirror folder inside one kind mirrors that kind's own tree, where a spec and a helper sit
 * side by side. Everywhere else the stem is the file.
 *
 * Every candidate comes in both extensions: a component and a screen are written in `.tsx`, and
 * the type beside one and the spec of one are named after it either way.
 *
 * @param mirrorShape - Where the mirrored file would sit, and what kind of mirror it is.
 * @param architectureOptions - The project's vocabulary.
 * @returns The paths, any one of which satisfies the mirror.
 */
const resolveCandidates = (mirrorShape: MirrorShape, architectureOptions: ArchitectureOptions): string[] => {
  const { testFolder, testKinds, suffixToFolder } = architectureOptions
  const { base, inner, stem } = mirrorShape
  const kind = inner[0]
  const hasKind = kind !== undefined && testKinds.includes(kind)
  if (mirrorShape.isTestTree) return withExtensions(path.join(base, ...dropKind(inner, hasKind), stem))
  /* v8 ignore next -- a project that declares a test folder declares the suffix its specs carry */
  const testSuffix = Object.keys(suffixToFolder).find(key => suffixToFolder[key] === testFolder) ?? ''
  if (mirrorShape.isInsideTestKind)
    return [
      ...withExtensions(path.join(base, ...inner, stem)),
      ...withExtensions(path.join(base, ...inner, `${stem}.${testSuffix}`)),
    ]
  if (!mirrorShape.isInsideTestTree) return withExtensions(path.join(base, ...inner, stem))
  if (hasKind) return withExtensions(path.join(base, ...inner, `${stem}.${testSuffix}`))
  const plain = withExtensions(path.join(base, ...inner, stem))
  const byKind = testKinds.flatMap(each => withExtensions(path.join(base, each, ...inner, `${stem}.${testSuffix}`)))

  return [...plain, ...byKind]
}

/**
 * Closes a path with each extension a source is written in.
 *
 * @param withoutExtension - The path up to the extension.
 * @returns The path as a module and as a component.
 */
const withExtensions = (withoutExtension: string): string[] => [`${withoutExtension}.ts`, `${withoutExtension}.tsx`]

const dropKind = (inner: string[], hasKind: boolean): string[] => {
  if (!hasKind) return inner

  return inner.slice(1)
}
