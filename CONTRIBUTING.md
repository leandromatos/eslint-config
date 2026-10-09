# Contributing

This repository follows Conventional Commits, lints itself with the tier it publishes, lints its rules with
[`eslint-plugin-eslint-plugin`](https://github.com/eslint-community/eslint-plugin-eslint-plugin), and formats with
Prettier.

## Local setup

```bash
git clone git@github.com:leandromatos/eslint-config.git
cd eslint-config
pnpm install
```

The repository resolves with pnpm, pinned by `packageManager` in `package.json`. A pnpm run here reads that field and
switches to the version it names, and `pnpm/action-setup` reads it in CI, so a workstation and CI resolve with the
same pnpm.

`pnpm install` sets up [Husky](https://typicode.github.io/husky), which wires two git hooks:

- **`pre-commit`** runs, in order:
  1. [`lint-staged`](https://github.com/lint-staged/lint-staged) on the staged files: ESLint fixes, Prettier formats,
     and `tsc` type-checks the repository.
  2. `pnpm install --frozen-lockfile`, which fails when the lockfile has drifted from `package.json`.
  3. `pnpm run test`: the Vitest suite and the bats suite.
- **`commit-msg`** runs [commitlint](https://commitlint.js.org) on the message.

A failure aborts the commit. The publish workflow runs the same lint and tests again, since a hook can be skipped and
the workflow cannot.

## Writing a rule

A rule lives in `src/plugins/<subject>/rules/<rule>.rule.ts`, is listed under its subject in
`src/plugins/constants/rules.constant.ts`, and is documented in `src/plugins/<subject>/docs/rules/<rule>.md`, which
`meta.docs.url` points at. It reads the options of its subject and nothing else, so a project states one vocabulary per
subject. A rule a configuration turns on for some files alone, as the two of a file of constants are, reads no group: it
is listed in `CONSTANT_RULES` and takes options of its own, or none.

A spec sits in the `__tests__` tree of its own subject: `src/plugins/<subject>/__tests__/unit/rules/<rule>.spec.ts`,
with the files it reads from disk under `src/plugins/<subject>/__tests__/fixtures/<rule>/`. It builds its tester with
one of the factories in `src/__tests__/utils/`:

| Factory                       | For a rule that reads                    |
| ----------------------------- | ---------------------------------------- |
| `createSyntaxRuleTester()`    | the syntax alone                         |
| `createTypedRuleTester(root)` | the type-checker, over a fixture project |
| `createFileRuleTester(root)`  | the tree around the file                 |

They are factories rather than shared instances because `eslint-plugin-eslint-plugin` reads a suite by the call that
builds its tester, and the `ruleTesterConstructors` setting names them by the `RuleTester` each one closes with.

The broken files the base configuration is tested against sit in `src/configs/__tests__/fixtures/invalid/`. The root
holds one tree of its own, `fixtures/`, with one valid file per file type the configuration reads, which this
repository lints along with its sources.

Coverage is a gate: `test:cov` fails under 100% of statements, branches, functions and lines. A branch the suite
cannot reach is a branch the code does not need, so it is written out rather than ignored.

## Scripts

`lint` and `test` run every script of their kind.

| Script                 | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm run build`       | compiles `src/` into `dist/`, which is what the package ships |
| `pnpm run lint`        | runs every lint below                                         |
| `pnpm run lint:ts`     | type-checks with `tsc`, then lints with ESLint                |
| `pnpm run lint:format` | checks the formatting with Prettier                           |
| `pnpm run lint:md`     | lints the Markdown with markdownlint                          |
| `pnpm run lint:dead`   | finds unused files, exports and dependencies with knip        |
| `pnpm run lint:fix`    | runs the fixer of every lint that has one                     |
| `pnpm run test`        | runs both suites below                                        |
| `pnpm run test:js`     | runs the Vitest suite                                         |
| `pnpm run test:sh`     | runs the bats suite of the release scripts                    |
| `pnpm run test:cov`    | runs the Vitest suite against the coverage gate               |
| `pnpm run test:watch`  | runs the Vitest suite in watch mode                           |
| `pnpm run test:ui`     | runs the Vitest suite in the browser UI                       |

## Releases

The repository is trunk-based on `main`, with no pull requests; the hooks and the publish workflow gate a change. A
release is a step of its own.

### Cutting one

`pnpm run release:snapshot` cuts a pre-release, and `pnpm run release:production` a stable one. Both take an optional
bump:

| Argument | Behavior                                                           |
| -------- | ------------------------------------------------------------------ |
| `auto`   | the default, read from the Conventional Commits since the last tag |
| `patch`  | `X.Y.Z` → `X.Y.(Z+1)`                                              |
| `minor`  | `X.Y.Z` → `X.(Y+1).0`                                              |
| `major`  | `X.Y.Z` → `(X+1).0.0`                                              |
| `X.Y.Z`  | an explicit target                                                 |

`auto` reads the log, since there are no pull requests to carry labels and commitlint guarantees the shape of the log:
a `!` or a `BREAKING CHANGE:` footer is a major, a `feat` a minor, anything else a patch. On `0.x` an inferred major is
capped to a minor, since a caret there locks the minor; `1.0.0` is an explicit `major`.

Each script prints its plan and waits for a confirmation before it creates anything. Both refuse a dirty working tree,
a branch other than the default, a branch out of step with `origin`, a release commit already at HEAD, and a tag that
exists. On an abort the local tag is removed.

### Where the version comes from

The tag is the source of truth, and `.version` in `package.json` is derived from it: the publish workflow reads the
version out of the tag and writes it with `pnpm version --no-git-tag-version` before it publishes.

A bump is applied to what is published, never to `.version`:

```plaintext
base = max(highest production tag, highest version published to npm)
```

Between releases `.version` holds the last published version, and a prerelease bumped from it sorts below what is
already on `latest`.

### What each path leaves behind

- **A snapshot** creates no commit and leaves `package.json` alone. It tags the HEAD of `main` as
  `vX.Y.Z-snapshot.YYYYMMDD.N` and pushes the tag, so `package.json` reads the last stable version while npm serves a
  newer snapshot.
- **A production release** writes `package.json` through pnpm, commits `chore(release): vX.Y.Z`, tags it, and pushes
  both.

`deploy.yaml` picks the dist-tag from the version in the tag: a version carrying `-snapshot.` publishes with
`--tag snapshot`, a plain `X.Y.Z` with `--tag latest`, so a snapshot never reaches `latest`.

A production tag also gets a GitHub Release, with notes grouped by commit type from the commits since the previous
production tag. GitHub's `--generate-notes` builds its list from merged pull requests, which this repository has none
of. A snapshot gets no GitHub Release; the `snapshot` dist-tag is its record.

The notes of any ref can be previewed without creating anything:

```bash
./scripts/release/create-github-release.sh <ref> --dry-run
```

### First-time setup

Publishing runs over OIDC (trusted publishing), with no npm token. It needs a trusted publisher registered once on
npm, under package settings → Trusted Publisher → GitHub Actions, pointing at `leandromatos` / `eslint-config` /
`deploy.yaml`. Without it the publish fails with a 404.
