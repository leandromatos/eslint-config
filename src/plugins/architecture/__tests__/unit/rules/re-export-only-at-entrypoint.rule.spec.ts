import path from 'node:path'

import { buildFixturePath } from '../../../../../__tests__/utils/build-fixture-path.util.js'
import { buildPackageSourcePath } from '../../../../../__tests__/utils/build-package-source-path.util.js'
import { buildSourcePath } from '../../../../../__tests__/utils/build-source-path.util.js'
import { createFileRuleTester } from '../../../../../__tests__/utils/create-file-rule-tester.util.js'
import { EMPTY_OPTIONS } from '../../../constants/architecture.constant.js'
import { reExportOnlyAtEntrypoint } from '../../../rules/re-export-only-at-entrypoint.rule.js'
import type { ArchitectureOptions } from '../../../types/architecture.type.js'

const root = buildFixturePath(import.meta.url, 're-export-only-at-entrypoint')
const ruleTester = createFileRuleTester(root)
const options: [ArchitectureOptions] = [EMPTY_OPTIONS]
const indexFile = buildSourcePath('users', 'services', 'index.ts')
const sourceFile = buildSourcePath('users', 'services', 'users.util.ts')
const reExport = [{ messageId: 'reExport' as const }]

ruleTester.run('re-export-only-at-entrypoint', reExportOnlyAtEntrypoint, {
  valid: [
    // Code that declares what it exports, in an index file or in any other file.
    { code: 'export class UserService {}', filename: buildSourcePath('users', 'services', 'user.service.ts'), options },
    { code: 'export const read = 1', filename: indexFile, options },
    { code: 'const read = 1\n\nexport { read }\nexport default read', filename: indexFile, options },
    { code: 'export default 1', filename: indexFile, options },

    // A type passes on no value, whichever way it is written.
    { code: 'export type * from "./user.type.js"', filename: indexFile, options },
    { code: 'export type { User } from "./user.type.js"', filename: indexFile, options },
    { code: 'export { type User } from "./user.type.js"', filename: indexFile, options },
    { code: 'import type { User } from "./user.type.js"\n\nexport { User }', filename: indexFile, options },
    { code: 'import { type User } from "./user.type.js"\n\nexport { User }', filename: indexFile, options },
    { code: 'import type User from "./user.type.js"\n\nexport default User', filename: indexFile, options },

    // An `export =` of a local value, and of a name an alias import binds, passes on no other file.
    { code: 'const read = 1\n\nexport = read', filename: indexFile, options },
    { code: 'import Users = Accounts.Users\n\nexport { Users }', filename: indexFile, options },
    { code: 'export import Users = Accounts.Users', filename: indexFile, options },

    // A new declaration built from an import is the file's own, not a re-export.
    { code: 'import { read } from "./read.js"\n\nexport const readAgain = read', filename: indexFile, options },

    // A side-effect import passes nothing on.
    { code: 'import "./polyfill.js"', filename: indexFile, options },

    // The source root and a declaration file are left alone, and so is a file outside every `src`.
    { code: 'export * from "./main.js"', filename: buildSourcePath('index.ts'), options },
    { code: 'export * from "./user.js"', filename: buildSourcePath('users', 'types', 'index.d.ts'), options },
    { code: 'export * from "./user.service.js"', filename: path.join('scripts', 'users', 'index.ts'), options },
  ],
  invalid: [
    { code: 'export * from "./user.service.js"', filename: indexFile, options, errors: reExport },
    { code: 'export * as users from "./user.service.js"', filename: indexFile, options, errors: reExport },
    // `export {} from` names nothing and still loads the module.
    { code: 'export {} from "./register.js"', filename: indexFile, options, errors: reExport },
    { code: 'export { UserService } from "./user.service.js"', filename: indexFile, options, errors: reExport },
    {
      code: 'export { type User, UserService } from "./user.service.js"',
      filename: indexFile,
      options,
      errors: reExport,
    },

    // A package has no declaring file of the project, so the message asks for an import of the package.
    {
      code: 'export * from "a-package"\nexport { User } from "@/users/user.entity.js"\nexport { Role } from "@"',
      filename: indexFile,
      options,
      errors: [
        { messageId: 'packageReExport', line: 1 },
        { messageId: 'reExport', line: 2 },
        { messageId: 'reExport', line: 3 },
      ],
    },
    // A name an import of a package binds, passed on without `from`, is a re-export of the package as much.
    ...[
      'import { BLANK_PROBLEM_TYPE } from "@graphabits/http-exceptions"\n\nexport { BLANK_PROBLEM_TYPE }',
      'import Users = Accounts.Users\nimport a from "a-package"\n\nexport default a as A',
      'import a = require("a-package")\n\nexport = a',
      'export import a = require("a-package")',
    ].map(code => ({ code, filename: indexFile, options, errors: [{ messageId: 'packageReExport' as const }] })),
    // A type import passes on no value, and a statement that also passes on a file of the project is no package's.
    {
      code: 'import type { T } from "a-package"\nimport { b } from "./b.js"\n\nexport { T, b }',
      filename: indexFile,
      options,
      errors: [{ messageId: 'reExport' }],
    },
    {
      code: 'import { a } from "a-package"\nimport { b } from "./b.js"\n\nexport { a, b }',
      filename: indexFile,
      options,
      errors: [{ messageId: 'reExport' }],
    },
    {
      code: 'import type A from "a-package"\nimport { type B, c } from "a-package"\nimport type D = require("a-package")\n\nexport { c }',
      filename: indexFile,
      options,
      errors: [{ messageId: 'packageReExport' }],
    },
    // Any file re-exports, not only an index file.
    { code: 'export { UserService } from "./user.service.js"', filename: sourceFile, options, errors: reExport },

    // An export of an imported value passes it on, by name or as the default.
    {
      code: 'import { UserService } from "./user.service.js"\n\nexport { UserService }',
      filename: indexFile,
      options,
      errors: [{ messageId: 'reExport', line: 3 }],
    },
    {
      code: 'import * as users from "./user.service.js"\n\nexport { users as default }',
      filename: indexFile,
      options,
      errors: reExport,
    },
    {
      code: 'import UserService from "./user.service.js"\n\nexport default UserService',
      filename: indexFile,
      options,
      errors: reExport,
    },
    // `export =`, `import … = require()` and `export import … = require()` pass on another file the same way.
    {
      code: 'export import users = require("./user.service.js")',
      filename: indexFile,
      options,
      errors: reExport,
    },
    {
      code: 'import UserService from "./user.service.js"\n\nexport = UserService',
      filename: indexFile,
      options,
      errors: reExport,
    },
    {
      code: 'import users = require("./user.service.js")\n\nexport { users }',
      filename: indexFile,
      options,
      errors: reExport,
    },
    {
      code: 'export * from "./user.service.js"\n\nexport const read = 1',
      filename: indexFile,
      options,
      errors: [{ messageId: 'reExport', line: 1 }],
    },
  ],
})

const publishedRoot = buildFixturePath(import.meta.url, 're-export-only-at-entrypoint-published')
const publishedRuleTester = createFileRuleTester(publishedRoot)

publishedRuleTester.run(
  're-export-only-at-entrypoint, in a package that publishes its directories',
  reExportOnlyAtEntrypoint,
  {
    valid: [
      // A target is built from the index file of each of these directories, so each is an entrypoint.
      { code: 'export * from "./user.service.js"', filename: buildSourcePath('users', 'index.ts'), options },
      {
        code: 'export * from "./http.instrumentation.js"',
        filename: buildSourcePath('observability', 'instrumentations', 'index.ts'),
        options,
      },
      // A target may differ from its key.
      {
        code: 'export * from "./build-cache.util.js"',
        filename: buildSourcePath('cache', 'keyv', 'testing', 'index.ts'),
        options,
      },
      /*
       * A target publishes the source file it is built from, whatever its name, and a target may name the source
       * itself.
       */
      { code: 'export * from "./build-record.util.js"', filename: buildSourcePath('testing.ts'), options },
      { code: 'export * from "./button.component.js"', filename: buildSourcePath('ui', 'index.tsx'), options },
      // A wildcard stands for any text, so it publishes every directory under it that holds an index file.
      {
        code: 'export * from "./user.schema.js"',
        filename: buildSourcePath('schemas', 'users', 'v2', 'index.ts'),
        options,
      },
    ],
    invalid: [
      // Only the index file of the directory an entrypoint names, never one above it or below it, or another file.
      {
        code: 'export * from "./instrumentations/index.js"',
        filename: buildSourcePath('observability', 'index.ts'),
        options,
        errors: reExport,
      },
      {
        code: 'export * from "./user.service.js"',
        filename: buildSourcePath('users', 'services', 'index.ts'),
        options,
        errors: reExport,
      },
      {
        code: 'export * from "./user.service.js"',
        filename: buildSourcePath('users', 'users.util.ts'),
        options,
        errors: reExport,
      },
      // A target that names no source file publishes nothing.
      {
        code: 'export * from "./tokens.js"',
        filename: buildSourcePath('tokens', 'index.ts'),
        options,
        errors: reExport,
      },
      /*
       * Only targets name files, so the key `./legacy`, whose target is the build of `src/users`, publishes no
       * `src/legacy`.
       */
      {
        code: 'export * from "./user.service.js"',
        filename: buildSourcePath('legacy', 'index.ts'),
        options,
        errors: reExport,
      },
    ],
  },
)

const monorepoRoot = buildFixturePath(import.meta.url, 're-export-only-at-entrypoint-monorepo')
const monorepoRuleTester = createFileRuleTester(monorepoRoot)

monorepoRuleTester.run('re-export-only-at-entrypoint, in a repository of several packages', reExportOnlyAtEntrypoint, {
  valid: [
    // Each package reads its own manifest, which is where the directories it publishes are named.
    {
      code: 'export * from "./services/user.service.js"',
      filename: buildPackageSourcePath('libs/core', 'users', 'index.ts'),
      options,
    },
  ],
  invalid: [
    // The manifest at the root of the workspace publishes `users`, and it speaks for no package under it.
    {
      code: 'export * from "./services/user.service.js"',
      filename: buildPackageSourcePath('packages/web', 'users', 'index.ts'),
      options,
      errors: reExport,
    },
    // A module named `src` inside the sources is a module, so the outermost `src` stays the root.
    {
      code: 'export * from "./user.service.js"',
      filename: buildSourcePath('a', 'src', 'services', 'index.ts'),
      options,
      errors: reExport,
    },
  ],
})
