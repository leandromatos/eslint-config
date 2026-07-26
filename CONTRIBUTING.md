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

Changes land through pull requests; the checks run on them. A release is a separate, explicit step:

1. Cut the release. Run `yarn release:snapshot` for a pre-release (`X.Y.Z-snapshot.YYYYMMDD.N`) or `yarn release:production` for a stable one (`X.Y.Z`). Both accept an optional `auto|patch|minor|major|X.Y.Z`; `auto` is the default and infers the bump from the commits since the last tag. Each prints a plan and waits for confirmation, then tags and pushes — pushing the tag is what publishes.
2. The publish workflow (`deploy.yaml`) picks the dist-tag from the version in the tag: snapshots go to `snapshot`, clean `X.Y.Z` goes to `latest`.

The tag carries the version, not `package.json`. A snapshot leaves no commit behind and does not touch `package.json`; a production release commits `chore(release): vX.Y.Z` before tagging. The bump is computed from the real published state — the greater of the latest tag and the version on npm — never from `package.json`.
