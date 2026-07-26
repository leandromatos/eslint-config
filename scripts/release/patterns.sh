# shellcheck shell=bash
# shellcheck disable=SC2034
#
# Single source of truth for the release regexes, sourced by guards.sh and
# resolve-base-version.sh. Keeping them here means the release commit subject,
# the tag scan, and the prerelease filter can never drift apart.
#
# Shapes (capture group 1 of RELEASE_PATTERN is the tag):
#   RELEASE_PATTERN     release commit subject, 'chore(release): vX.Y.Z'
#   TAG_PATTERN         bare production tag, 'vX.Y.Z'
#   PRERELEASE_PATTERN  prerelease identifier fragment in a tag name
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
