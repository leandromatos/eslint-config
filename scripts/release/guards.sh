# shellcheck shell=bash
# shellcheck disable=SC2034
#
# Shared release guard rails and helpers, sourced by snapshot.sh and
# production.sh. SC2034 is disabled because the globals set below
# (RESOLVED_*, DETECTION_NOTE) are consumed by the sourcing scripts.
#
# Release regexes come from patterns.sh, the single source.
#
# Provides:
#   - Guards:  require_clean_working_tree, require_on_default_branch,
#              require_default_branch_in_sync_with_origin,
#              require_latest_commit_is_not_release, require_tag_does_not_exist
#   - Helpers: default_branch, last_production_tag, current_package_version,
#              confirm_or_abort, cleanup_tag_on_abort, bump_from_commits,
#              resolve_target_version_from_bump, write_package_version
#
# Globals set by resolve_target_version_from_bump (call it WITHOUT command
# substitution so the assignments survive):
#   RESOLVED_VERSION, RESOLVED_BUMP, DETECTION_NOTE

GUARDS_SH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./patterns.sh
source "$GUARDS_SH_DIR/patterns.sh"

# Resolved from the remote's HEAD symref, falling back to 'main'. Deliberately
# git-only: reading it from the GitHub API would make 'gh' a hard requirement of
# every release, and these repositories are trunk-based on a branch git already
# knows about.
default_branch() {
  if [ -z "${DEFAULT_BRANCH_CACHE:-}" ]; then
    DEFAULT_BRANCH_CACHE=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
    [ -z "$DEFAULT_BRANCH_CACHE" ] && DEFAULT_BRANCH_CACHE="main"
  fi
  echo "$DEFAULT_BRANCH_CACHE"
}

require_clean_working_tree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    printf "Error: Working tree is not clean. Commit or stash changes first.\n" >&2
    exit 1
  fi
}

require_on_default_branch() {
  local default current
  default=$(default_branch)
  current=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$current" != "$default" ]]; then
    printf "Error: Releases must be cut from '%s' (currently on '%s').\n" "$default" "$current" >&2
    exit 1
  fi
}

require_default_branch_in_sync_with_origin() {
  local default local_head remote_head
  default=$(default_branch)
  git fetch origin "$default" --quiet --tags --force
  local_head=$(git rev-parse "$default")
  remote_head=$(git rev-parse "origin/$default")
  if [[ "$local_head" != "$remote_head" ]]; then
    printf "Error: Local '%s' is not in sync with 'origin/%s'.\n" "$default" "$default" >&2
    printf "Push or pull first, so the tag lands on the commit the registry will see.\n" >&2
    exit 1
  fi
}

require_latest_commit_is_not_release() {
  local default message
  default=$(default_branch)
  message=$(git log -1 --pretty=format:"%s" "$default")
  if [[ "$message" =~ $RELEASE_PATTERN ]]; then
    printf "Error: Latest commit on '%s' is already a release: '%s'.\n" "$default" "$message" >&2
    printf "There must be at least one non-release commit between two releases.\n" >&2
    exit 1
  fi
}

require_tag_does_not_exist() {
  local tag="$1"
  if git rev-parse --verify --quiet "refs/tags/$tag" >/dev/null; then
    printf "Error: Tag '%s' already exists.\n" "$tag" >&2
    exit 1
  fi
}

# Highest production tag, prereleases excluded. Empty when none exists.
last_production_tag() {
  git tag --list 'v*' --sort=-v:refname \
    | grep -vE -- "$PRERELEASE_PATTERN" \
    | grep -E "$TAG_PATTERN" \
    | head -n 1 || true
}

current_package_version() {
  node -p "require('./package.json').version"
}

confirm_or_abort() {
  printf "Continue? [y/N] "
  local answer
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    printf "Aborted.\n"
    exit 0
  fi
}

cleanup_tag_on_abort() {
  # Capture $? before any 'local': a 'local' assignment resets it to 0, which
  # would mask the abort status this EXIT trap has to act on.
  local exit_code=$?
  local tag="$1"
  if [ "$exit_code" -ne 0 ]; then
    if git rev-parse --verify --quiet "refs/tags/$tag" >/dev/null 2>&1; then
      git tag -d "$tag" 2>/dev/null || true
      printf "Cleaned up local tag '%s'.\n" "$tag" >&2
    fi
  fi
}

# Infers the bump from the Conventional Commits landed since the last production
# tag. These repositories are trunk-based with no pull requests, so the commit
# log is the only record of intent — and commitlint already guarantees its shape,
# which makes it a more reliable signal than labels applied by hand.
#
# '!' after the type or a 'BREAKING CHANGE:' footer means major, a 'feat' means
# minor, anything else is a patch.
bump_from_commits() {
  local last_tag="$1"
  local range log
  if [ -n "$last_tag" ]; then range="$last_tag..HEAD"; else range="HEAD"; fi
  log=$(git log "$range" --pretty=format:'%s%n%b')

  if printf '%s\n' "$log" | grep -qE '^[a-z]+(\([^)]*\))?!:'; then
    echo "major"
  elif printf '%s\n' "$log" | grep -qE '^BREAKING[ -]CHANGE:'; then
    echo "major"
  elif printf '%s\n' "$log" | grep -qE '^feat(\([^)]*\))?!?:'; then
    echo "minor"
  else
    echo "patch"
  fi
}

# Resolves the target version from a bump argument.
# Args: <bump_input> <base_version>
#   bump_input    'auto' (default), 'patch', 'minor', 'major', or 'X.Y.Z'
#   base_version  the version to bump from; pass the cascade-resolved base from
#                 resolve_base_version, never package.json '.version'
# Sets RESOLVED_VERSION, RESOLVED_BUMP, DETECTION_NOTE. Call WITHOUT command
# substitution, or a subshell swallows the assignments.
resolve_target_version_from_bump() {
  local bump_input="${1:-auto}"
  local base="$2"

  if ! [[ "$base" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    printf "Error: base version is not semver: %s\n" "$base" >&2
    exit 1
  fi

  local base_major="${BASH_REMATCH[1]}"
  local base_minor="${BASH_REMATCH[2]}"
  local base_patch="${BASH_REMATCH[3]}"

  DETECTION_NOTE=""
  RESOLVED_BUMP="$bump_input"
  RESOLVED_VERSION=""

  if [ "$bump_input" = "auto" ]; then
    RESOLVED_BUMP=$(bump_from_commits "$(last_production_tag)")
    DETECTION_NOTE=" (detected from commits)"
    # On 0.x a caret locks the minor, so a major bump there would strand every
    # consumer's range. Graduating to 1.0.0 stays an explicit decision.
    if [ "$base_major" = "0" ] && [ "$RESOLVED_BUMP" = "major" ]; then
      RESOLVED_BUMP="minor"
      DETECTION_NOTE=" (detected from commits; major capped to minor in 0.x — graduate with an explicit 'major')"
    fi
  fi

  case "$RESOLVED_BUMP" in
    patch) RESOLVED_VERSION="${base_major}.${base_minor}.$((base_patch + 1))" ;;
    minor) RESOLVED_VERSION="${base_major}.$((base_minor + 1)).0" ;;
    major) RESOLVED_VERSION="$((base_major + 1)).0.0" ;;
    *)
      if [[ "$RESOLVED_BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        RESOLVED_VERSION="$RESOLVED_BUMP"
      else
        printf "Error: bump must be 'auto', 'patch', 'minor', 'major', or 'X.Y.Z' (got '%s').\n" "$RESOLVED_BUMP" >&2
        exit 1
      fi
      ;;
  esac
}

# Rewrites package.json's '.version' in place, touching nothing else.
# 'sed -i' is deliberately avoided: BSD sed (macOS) demands a backup-suffix
# argument and GNU sed (Linux) rejects one. The round-trip writes back through
# the original path, so the file keeps its inode and mode.
write_package_version() {
  local new_version="$1"
  local rewritten
  rewritten=$(mktemp)
  sed "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" package.json >"$rewritten"
  cat "$rewritten" >package.json
  rm -f "$rewritten"
}
