import fs from 'node:fs'
import path from 'node:path'

import { buildFinding, buildRuleDocsUrl, createFileRule, findTestSuffix } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureOptions, MirrorShape } from '../types/index.js'

/**
 * The platforms React Native resolves a module for, each a file of its own beside the shared one: `toggle.ios.tsx`,
 * `toggle.android.tsx`, `toggle.native.tsx`, `toggle.web.tsx`.
 */
const PLATFORMS = ['ios', 'android', 'native', 'web']

/** A source written for one platform, which the report leaves out: the shared name is the one a caller imports. */
const PLATFORM_FILE_REG_EXP = new RegExp(`\\.(?:${PLATFORMS.join('|')})\\.tsx?$`)

/**
 * A file under a mirror folder mirrors a file in the tree beside that folder, and a mirror
 * folder inside the test folder mirrors the test folder's own tree. Three files mirror nothing
 * by design: a module's own vocabulary, named after the module, a test of a kind the options
 * leave out of `mirroringTestKinds`, and a stand-in in the mock folder, which the test runner
 * pairs with its module by name.
 */
export const mirroredSource = createFileRule(
  'A file under a mirror folder mirrors an existing file.',
  buildRuleDocsUrl('architecture', 'mirrored-source'),
  { noSource: '"{{file}}" mirrors no source: expected {{expected}}. Create it, or move the file.' },
  ({ sourceRoot, file, suffix, segments, stem }, architectureOptions, context) => {
    const { suffixToFolder, mirrorFolders, testFolder, testKinds, mirroringTestKinds, mockFolder } = architectureOptions
    if (!suffix || segments.includes(mockFolder)) return []
    const mirror = suffixToFolder[suffix]
    if (!mirror || !mirrorFolders.includes(mirror)) return []
    const at = segments.indexOf(mirror)
    if (at < 0) return []
    /*
     * The vocabulary of whatever holds the mirror folder, named after it: `naming.type.ts` under `naming/types/`. The
     * owner is the directory the mirror sits in, which is the module itself when the mirror sits at its root, and the
     * module whose tests they are when it sits in the test tree.
     */
    const owner = findMirrorOwner(segments, at, testFolder)
    const isVocabulary =
      owner !== undefined &&
      at === segments.length - 1 &&
      [`${owner}.${suffix}.ts`, `${owner}.${suffix}.tsx`].includes(file)
    if (isVocabulary) return []
    const inner = segments.slice(at + 1)
    const kind = inner[0]
    if (mirror === testFolder && kind && !mirroringTestKinds.includes(kind)) return []
    const mirrorShape: MirrorShape = {
      base: path.join(sourceRoot, ...segments.slice(0, at)),
      inner,
      stem,
      isTestTree: mirror === testFolder,
      isInsideTestTree: segments[at - 1] === testFolder,
      isInsideTestKind: segments[at - 2] === testFolder && testKinds.some(testKind => testKind === segments[at - 1]),
    }
    const candidates = resolveCandidates(mirrorShape, architectureOptions)
    if (candidates.some(candidate => fs.existsSync(candidate))) return []
    const expected = candidates
      .filter(candidate => !PLATFORM_FILE_REG_EXP.test(candidate))
      .map(candidate => path.relative(context.cwd, candidate))
      .join(' or ')

    return [buildFinding('noSource', { file, expected })]
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
  if (mirrorShape.isTestTree) return addSourceExtensions(path.join(base, ...dropTestKind(inner, hasKind), stem))
  const specStem = [stem, findTestSuffix(suffixToFolder, testFolder)].filter(Boolean).join('.')
  if (mirrorShape.isInsideTestKind)
    return [
      ...addSourceExtensions(path.join(base, ...inner, stem)),
      ...addSourceExtensions(path.join(base, ...inner, specStem)),
    ]
  if (!mirrorShape.isInsideTestTree) return addSourceExtensions(path.join(base, ...inner, stem))
  if (hasKind) return addSourceExtensions(path.join(base, ...inner, specStem))
  const plain = addSourceExtensions(path.join(base, ...inner, stem))
  const byKind = testKinds.flatMap(each => addSourceExtensions(path.join(base, each, ...inner, specStem)))

  return [...plain, ...byKind]
}

/**
 * Closes a path with each extension a source is written in.
 *
 * A module split by platform is a file per platform, `toggle.ios.tsx` and `toggle.android.tsx`, that callers import
 * as `./toggle`, so any one of them stands for the source a mirror names.
 *
 * @param withoutExtension - The path up to the extension.
 * @returns The path as a module and as a component, shared or written for one platform.
 */
const addSourceExtensions = (withoutExtension: string): string[] =>
  ['', ...PLATFORMS.map(platform => `.${platform}`)].flatMap(platform => [
    `${withoutExtension}${platform}.ts`,
    `${withoutExtension}${platform}.tsx`,
  ])

/**
 * The folders inside the test directory, without the one that names the kind of test.
 *
 * @param inner - The folders between the test directory and the spec.
 * @param hasKind - Whether the first folder names the kind, as `unit` or `e2e`.
 * @returns The folders the spec mirrors.
 */
const dropTestKind = (inner: string[], hasKind: boolean): string[] => {
  if (!hasKind) return inner

  return inner.slice(1)
}

/**
 * Whose vocabulary a mirror at the root of its folder holds: the directory the mirror sits in, and, for the mirror of
 * a test tree, the module the test tree belongs to, so `users/__tests__/types/users.type.ts` is the vocabulary of the
 * tests of `users`.
 *
 * @param segments - The directories between the source root and the file.
 * @param at - Where the mirror folder sits among them.
 * @param testFolder - The folder that holds the tests.
 * @returns The name of the owner, and nothing when the mirror sits at the source root.
 */
const findMirrorOwner = (segments: string[], at: number, testFolder: string): string | undefined => {
  const holder = segments[at - 1]
  if (holder === testFolder) return segments[at - 2]

  return holder
}
