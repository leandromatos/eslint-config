import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { unreadTag } from '../../../rules/unread-tag.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()
const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]
const releaseToolOptions: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: true }]

ruleTester.run('unread-tag', unreadTag, {
  valid: [
    // A comment with tags somebody reads.
    { code: '/**\n * Reads one.\n *\n * @param id - The ID.\n */\nfunction read(id) {}', options },
    // A release tag where the project runs a tool that reads it.
    { code: '/**\n * Reads one.\n *\n * @internal\n */\nfunction read() {}', options: releaseToolOptions },
    // A tag name inside a sentence, a note and a code fence are text.
    { code: '/** Reads the @internal store. */\nfunction read() {}', options },
    { code: '// @override\nfunction read() {}', options },
    { code: '/**\n * Reads one.\n *\n * ```ts\n * @public\n * ```\n */\nfunction read() {}', options },
  ],
  invalid: [
    // `@override` restates the keyword, with or without a tool.
    {
      code: 'class Repository {\n  /**\n   * Reads one.\n   *\n   * @override\n   */\n  override read() {}\n}',
      options: releaseToolOptions,
      errors: [{ messageId: 'overrideTag', line: 5 }],
    },
    // Every release tag, on whatever it documents, when nothing reads them.
    {
      code: '/**\n * The ID.\n *\n * @public\n */\nexport type UserId = string',
      options,
      errors: [{ messageId: 'releaseTag', data: { tag: 'public' }, line: 4 }],
    },
    {
      code: '/**\n * Reads one.\n *\n * @internal\n * @alpha\n * @beta\n */\nconst read = () => 1',
      options,
      errors: [
        { messageId: 'releaseTag', data: { tag: 'internal' } },
        { messageId: 'releaseTag', data: { tag: 'alpha' } },
        { messageId: 'releaseTag', data: { tag: 'beta' } },
      ],
    },
  ],
})
