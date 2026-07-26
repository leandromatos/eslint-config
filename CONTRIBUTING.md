# Contributing

This repository follows conventional commits, dogfoods its own ESLint config, and formats with Prettier.

## Local setup

```bash
git clone git@github.com:leandromatos/eslint-config.git
cd eslint-config
yarn install
```

`yarn install` sets up [Husky](https://typicode.github.io/husky), which wires two git hooks:

- **`pre-commit`** runs, in order:
  1. [`lint-staged`](https://github.com/lint-staged/lint-staged) — formats with Prettier and fixes with ESLint on the staged files.
  2. `yarn install --check-files` — fails if the lockfile has drifted from `package.json`.
  3. `yarn test` — the Vitest suite.
- **`commit-msg`** runs [commitlint](https://commitlint.js.org) on the message.

Any failure aborts the commit, so nothing lands until all of it passes.

## Available scripts

| Script            | Purpose                               |
| ----------------- | ------------------------------------- |
| `yarn build`      | Emit `index.d.ts` from the JSDoc.     |
| `yarn lint`       | Type-check and run ESLint.            |
| `yarn lint:fix`   | Run ESLint with `--fix`.              |
| `yarn test`       | Run the Vitest suite once.            |
| `yarn test:watch` | Run the suite in watch mode.          |
| `yarn test:cov`   | Run the suite with a coverage report. |

## Releases

This repository is trunk-based on `main` and does not use pull requests; the hooks above are what gate a change. A release is a separate, explicit step.

### Cutting one

Run `yarn release:snapshot` for a pre-release or `yarn release:production` for a stable one. Both take an optional bump:

| Argument | Behavior                                                           |
| -------- | ------------------------------------------------------------------ |
| `auto`   | default; inferred from the Conventional Commits since the last tag |
| `patch`  | `X.Y.Z` → `X.Y.(Z+1)`                                              |
| `minor`  | `X.Y.Z` → `X.(Y+1).0`                                              |
| `major`  | `X.Y.Z` → `(X+1).0.0`                                              |
| `X.Y.Z`  | explicit target                                                    |

`auto` reads the log because there are no pull requests to carry labels, and commitlint already guarantees the log's shape: a `!` or a `BREAKING CHANGE:` footer means major, a `feat` means minor, anything else is a patch. On `0.x` an inferred major is capped to minor, since a caret there locks the minor rather than the major; graduating to `1.0.0` stays an explicit `major`.

Each script prints a plan and waits for confirmation before creating anything. Both refuse to run on a dirty working tree, off the default branch, out of sync with `origin`, with a release commit already at HEAD, or when the tag exists. On abort, the local tag is removed.

### Where the version comes from

The tag is the source of truth. `package.json`'s `.version` is a derived value: the publish workflow reads the version out of the tag and writes it in with `npm version --no-git-tag-version` before `npm publish`.

The bump is applied to the real published state, never to `.version`:

```plaintext
base = max(highest production tag, highest version published to npm)
```

The distinction is not cosmetic. Between releases `.version` holds the _last published_ version, so bumping from it produces `X.Y.Z-snapshot.N` against an already-published `X.Y.Z` — and a prerelease sorts _below_ its own release, which lands the `snapshot` dist-tag behind `latest`.

### What each path leaves behind

- **Snapshot** creates no commit and does not touch `package.json`. It tags `main`'s HEAD as `vX.Y.Z-snapshot.YYYYMMDD.N` and pushes. Mid-cycle `package.json` reads the last stable version while npm serves a newer snapshot; that is the derived-value design working, not drift.
- **Production** writes `package.json`, commits `chore(release): vX.Y.Z`, tags it, and pushes both.

`deploy.yaml` picks the dist-tag from the version in the tag: anything carrying `-snapshot.` publishes with `--tag snapshot`, a clean `X.Y.Z` with `--tag latest`. Both are passed explicitly, so a snapshot can never reach `latest`.

### First-time setup

Publishing runs over OIDC (trusted publishing), with no npm token. It needs a trusted publisher registered once on npm — package settings → Trusted Publisher → GitHub Actions, pointing at `leandromatos` / `eslint-config` / `deploy.yaml`. Without it the publish fails with a 404.
