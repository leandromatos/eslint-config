#!/bin/bash
set -euo pipefail

# Cut a production release: commit the version bump on the default branch, tag
# it, and push both. The tag triggers the publish workflow, which publishes to
# the 'latest' dist-tag.
#
# Usage: release:production [auto|patch|minor|major|X.Y.Z] [--dry-run]
#   --dry-run prints the plan and exits without committing, tagging or pushing.
#   Use it to see the plan when running somewhere the confirmation prompt cannot
#   reach a terminal, then re-run with RELEASE_ASSUME_YES=1.
#
#   auto (the default) infers the bump from the Conventional Commits landed since
#   the last production tag: '!' or a 'BREAKING CHANGE:' footer means major, a
#   'feat' means minor, anything else is a patch. On 0.x an inferred major is
#   capped to minor; graduate to 1.0.0 with an explicit 'major'.
#
# Unlike a snapshot, a production release does write package.json and does leave
# a 'chore(release): vX.Y.Z' commit: it is a reviewable event, and the commit is
# what records which tree a tag points at.

BUMP_INPUT="auto"
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) BUMP_INPUT="$arg" ;;
  esac
done

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./guards.sh
source "$SCRIPT_DIR/guards.sh"
# shellcheck source=./resolve-base-version.sh
source "$SCRIPT_DIR/resolve-base-version.sh"

require_clean_working_tree
require_on_default_branch
require_default_branch_in_sync_with_origin
require_latest_commit_is_not_release

DEFAULT_BRANCH=$(default_branch)
CURRENT_VERSION=$(current_package_version)
PACKAGE_NAME=$(node -p "require('./package.json').name")

# The base is the real published state, not the local '.version' cache.
resolve_base_version "$PACKAGE_NAME"
resolve_target_version_from_bump "$BUMP_INPUT" "$BASE_VERSION"
NEW_VERSION="$RESOLVED_VERSION"

if [ "$NEW_VERSION" = "$BASE_VERSION" ]; then
  printf "Error: target version equals the base version (%s). Pick a different bump.\n" "$BASE_VERSION" >&2
  exit 1
fi

TAG_NAME="v$NEW_VERSION"

require_tag_does_not_exist "$TAG_NAME"

printf "\n"
printf "  Package:           %s\n" "$PACKAGE_NAME"
printf "  package.json says: %s\n" "$CURRENT_VERSION"
printf "  Base version:      %s (from %s)\n" "$BASE_VERSION" "$BASE_SOURCE"
printf "  Release version:   %s\n" "$NEW_VERSION"
printf "  Release tag:       %s\n" "$TAG_NAME"
printf "  Bump:              %s%s\n" "$RESOLVED_BUMP" "$DETECTION_NOTE"
printf "  Will commit:       chore(release): %s\n" "$TAG_NAME"
printf "  On top of:         %s\n" "$(git log -1 --pretty=format:'%h %s' "$DEFAULT_BRANCH")"
printf "\n"

if [ "$DRY_RUN" = true ]; then
  printf "Dry run: nothing was committed, tagged or pushed.\n"
  exit 0
fi

confirm_or_abort

trap 'cleanup_tag_on_abort "$TAG_NAME"' EXIT

write_package_version "$NEW_VERSION"
git add package.json
git commit -m "chore(release): $TAG_NAME"
git tag "$TAG_NAME"
git push origin "$DEFAULT_BRANCH"
git push origin "$TAG_NAME"

printf "\nTag '%s' pushed. The production publish will start shortly.\n" "$TAG_NAME"
