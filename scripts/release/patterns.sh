# shellcheck shell=bash
# shellcheck disable=SC2034
#
# Single source of truth for the release regexes and the tag scan they drive,
# sourced by guards.sh, resolve-base-version.sh and release-notes.sh. Keeping them
# here means the release commit subject, the tag scan, and the prerelease filter
# can never drift apart.
#
# Shapes (capture group 1 of RELEASE_PATTERN is the tag):
#   RELEASE_PATTERN     release commit subject, 'chore(release): vX.Y.Z'
#   TAG_PATTERN         bare production tag, 'vX.Y.Z'
#   PRERELEASE_PATTERN  prerelease identifier fragment in a tag name
#
# And one function:
#   latest_production_tag [exclude-tag]  highest 'vX.Y.Z' tag, prereleases and the
#                                        excluded tag left out; empty when none
#
# Guarded so sourcing twice (a release script pulls in both guards.sh and
# resolve-base-version.sh, and each sources this) does not re-assign readonly
# constants.
if [ -z "${RELEASE_PATTERNS_SH_LOADED:-}" ]; then
  RELEASE_PATTERNS_SH_LOADED=1

  readonly RELEASE_PATTERN='^chore\(release\):\ (v[0-9]+\.[0-9]+\.[0-9]+)$'
  readonly TAG_PATTERN='^v[0-9]+\.[0-9]+\.[0-9]+$'
  readonly PRERELEASE_PATTERN='-(snapshot|rc|beta|alpha|canary)\.'
fi

# git's own version sort keeps this portable: BSD sort has no reliable -V.
latest_production_tag() {
  local exclude_tag="${1:-}" candidate
  while IFS= read -r candidate; do
    [ -z "$candidate" ] && continue
    [ "$candidate" = "$exclude_tag" ] && continue
    printf '%s' "$candidate"
    return 0
  done < <(git tag --list 'v*' --sort=-v:refname 2>/dev/null \
    | grep -vE -- "$PRERELEASE_PATTERN" \
    | grep -E "$TAG_PATTERN")
  printf ''
}
