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
| `yarn lint`       | Run ESLint over the repository.       |
| `yarn lint:fix`   | Run ESLint with `--fix`.              |
| `yarn test`       | Run the Vitest suite once.            |
| `yarn test:watch` | Run the suite in watch mode.          |
| `yarn test:cov`   | Run the suite with a coverage report. |

## Releases

Changes land through pull requests; the checks run on them. A release is a separate, explicit step:

1. Bump the version. For a snapshot, run `./scripts/snapshot-version-bump.sh`, which produces `X.Y.Z-snapshot.YYYYMMDD.N`.
2. Commit as `chore(release): vX.Y.Z…` and create a matching `vX.Y.Z…` tag.
3. Push the branch and the tag. The publish workflow (`deploy.yaml`) sends snapshots to the `snapshot` dist-tag and stable versions to `latest`.
