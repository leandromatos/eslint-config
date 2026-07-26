#!/bin/bash
set -euo pipefail

# Tag the default branch HEAD as a snapshot of the next planned release and push
# the tag, which triggers the publish workflow.
#
# Usage: release:snapshot [auto|patch|minor|major|X.Y.Z]
#   auto (the default) infers the bump from the Conventional Commits landed since
#   the last production tag: '!' or a 'BREAKING CHANGE:' footer means major, a
#   'feat' means minor, anything else is a patch. On 0.x an inferred major is
#   capped to minor; graduate to 1.0.0 with an explicit 'major'.
#
# Tag format: vMAJOR.MINOR.PATCH-snapshot.YYYYMMDD.N
#   MAJOR.MINOR.PATCH  next planned production version (base + bump)
#   YYYYMMDD           today
#   N                  next counter for the same target on the same day
#
# No commit is created and package.json is not touched. A snapshot is a
# throwaway preview, so it leaves no trace in the history; the version travels in
# the tag and the workflow writes it into package.json at publish time.

BUMP_INPUT="${1:-auto}"

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./guards.sh
source "$SCRIPT_DIR/guards.sh"
# shellcheck source=./resolve-base-version.sh
source "$SCRIPT_DIR/resolve-base-version.sh"

TODAY=$(date +%Y%m%d)

require_clean_working_tree
require_on_default_branch
require_default_branch_in_sync_with_origin
require_latest_commit_is_not_release

DEFAULT_BRANCH=$(default_branch)
PACKAGE_NAME=$(node -p "require('./package.json').name")

# A snapshot previews the next production release, so it bumps from the same base
# that release will: the real published state, not package.json '.version'.
resolve_base_version "$PACKAGE_NAME"
resolve_target_version_from_bump "$BUMP_INPUT" "$BASE_VERSION"
TARGET_VERSION="$RESOLVED_VERSION"

LATEST_SNAPSHOT=$(git tag --list "v${TARGET_VERSION}-snapshot.${TODAY}.*" --sort=-v:refname | head -n 1 || true)
if [ -n "$LATEST_SNAPSHOT" ]; then
  LAST_COUNTER=$(echo "$LATEST_SNAPSHOT" | awk -F '.' '{print $NF}')
  NEXT_COUNTER=$((LAST_COUNTER + 1))
else
  NEXT_COUNTER=1
fi

TAG_NAME="v${TARGET_VERSION}-snapshot.${TODAY}.${NEXT_COUNTER}"

require_tag_does_not_exist "$TAG_NAME"

printf "\n"
printf "  Package:           %s\n" "$PACKAGE_NAME"
printf "  Base version:      %s (from %s)\n" "$BASE_VERSION" "$BASE_SOURCE"
printf "  Target version:    %s\n" "$TARGET_VERSION"
printf "  Snapshot tag:      %s\n" "$TAG_NAME"
printf "  Bump:              %s%s\n" "$RESOLVED_BUMP" "$DETECTION_NOTE"
printf "  Will tag commit:   %s\n" "$(git log -1 --pretty=format:'%h %s' "$DEFAULT_BRANCH")"
printf "\n"

confirm_or_abort

trap 'cleanup_tag_on_abort "$TAG_NAME"' EXIT

git tag "$TAG_NAME"
git push origin "$TAG_NAME"

printf "\nTag '%s' pushed. The snapshot publish will start shortly.\n" "$TAG_NAME"
