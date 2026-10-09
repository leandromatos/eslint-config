import type { TSESLint } from '@typescript-eslint/utils'

import {
  buildRuleDocsUrl,
  isMethod,
  isPublic,
  listResourceForms,
  locateFile,
  readMemberName,
} from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { MethodResourceMessageId, NamingRule } from '../types/index.js'

/**
 * A public method of a layer class carries the resource in its name: `findOneUser`, not
 * `findOne`. The method is read at the call site, where the file name is not in view. A file
 * the options list as resource-free is the layer whose resource is the verb's own subject, and
 * `loginAuth` would name it twice. A method that overrides a base class, or one the options list
 * as a hook the framework calls, keeps the name its contract gave it.
 */
export const methodResource: NamingRule<MethodResourceMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A public method of a layer class carries the resource of its file in its name.',
      url: buildRuleDocsUrl('naming', 'method-resource'),
      dialects: ['TypeScript'],
    },
    messages: {
      missingResource:
        '"{{method}}" names no resource. The file is "{{stem}}", so the name carries {{forms}}: what the caller gets is read at the call site.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [{ resourceSuffixes, resourceFreeStems, resourceFreeMethods }] = context.options
    if (!where?.suffix || !resourceSuffixes.includes(where.suffix) || resourceFreeStems.includes(where.stem)) return {}
    const forms = listResourceForms(where.stem).map(form => form.toLowerCase())
    const listener: TSESLint.RuleListener = {
      MethodDefinition: node => {
        if (!isMethod(node) || !isPublic(node) || node.override) return
        const method = readMemberName(node)
        if (method === null || resourceFreeMethods.includes(method)) return
        if (forms.some(form => method.toLowerCase().includes(form))) return
        context.report({
          node,
          messageId: 'missingResource',
          data: { method, stem: where.stem, forms: listResourceForms(where.stem).join(' or ') },
        })
      },
    }

    return listener
  },
}
