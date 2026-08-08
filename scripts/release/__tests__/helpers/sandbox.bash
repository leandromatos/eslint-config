# shellcheck shell=bash
#
# A throwaway git repository for the release specs, so the functions that read
# real git state (tag scans, commit ranges, bump detection) can be exercised
# against a history the test controls instead of the repository's own.
#
# 'npm' is stubbed on PATH rather than mocked in bash: base_version_registry
# shells out to it, and a stub is the only way to pin what the registry "has"
# without network access. Set NPM_VIEW_VERSIONS to the JSON the stub should echo,
# or leave it empty to simulate an unpublished package (npm exits non-zero).
#
# Surface:
#   setup_sandbox            create and enter the sandbox
#   teardown_sandbox         leave and delete it
#   commit <subject> [body]  empty commit with the given message
#   tag <name>               tag HEAD

setup_sandbox() {
  # git exports these while a hook is running, and they point at the repository the
  # hook fires in. Inherited here they would aim every sandbox command at that index
  # instead of the sandbox's own, so `yarn test` passed on its own and failed from
  # `pre-commit` with "invalid object" for files the sandbox has never seen.
  unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_PREFIX

  SANDBOX_DIR=$(mktemp -d)
  SANDBOX_BIN="$SANDBOX_DIR/bin"
  mkdir -p "$SANDBOX_BIN"

  cat >"$SANDBOX_BIN/npm" <<'STUB'
#!/bin/bash
# Only 'npm view <pkg> versions --json' is used by the code under test.
if [ -z "${NPM_VIEW_VERSIONS:-}" ]; then
  exit 1
fi
printf '%s' "$NPM_VIEW_VERSIONS"
STUB
  chmod +x "$SANDBOX_BIN/npm"
  PATH="$SANDBOX_BIN:$PATH"
  export PATH

  SANDBOX_ORIGIN_CWD="$PWD"
  cd "$SANDBOX_DIR"
  git init --quiet --initial-branch=main
  git config user.email "spec@example.com"
  git config user.name "Spec"
  printf '{ "name": "@scope/pkg", "version": "0.0.0" }\n' >package.json
  git add package.json
  git commit --quiet -m "chore: Seed the sandbox"
}

teardown_sandbox() {
  cd "$SANDBOX_ORIGIN_CWD"
  rm -rf "$SANDBOX_DIR"
}

commit() {
  local subject="$1" body="${2:-}"
  if [ -n "$body" ]; then
    git commit --quiet --allow-empty -m "$subject" -m "$body"
  else
    git commit --quiet --allow-empty -m "$subject"
  fi
}

tag() {
  git tag "$1"
}
