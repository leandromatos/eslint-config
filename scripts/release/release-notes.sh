# shellcheck shell=bash
#
# Release notes: the body of a GitHub Release, built from the Conventional Commits
# between two tags. Kept sourceable and separate from create-github-release.sh so
# the classification and grouping can be unit-tested without invoking gh.
#
# GitHub's own '--generate-notes' is not used. It builds its list from merged pull
# requests, and these repositories are trunk-based with direct commits, so it
# would produce an empty release. The commit log is the record instead — the same
# signal the bump resolution reads, and commitlint already guarantees its shape.
#
# Public surface:
#   - release_notes_baseline   tag -> previous production tag (empty if first)
#   - release_notes_category   subject + body -> category key
#   - release_notes_title      category key -> section heading
#   - release_notes_body       tag + baseline -> the release body on stdout

RELEASE_NOTES_SH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./patterns.sh
source "$RELEASE_NOTES_SH_DIR/patterns.sh"

# Order matters: it is the order the sections appear in, which puts what a
# consumer cares about first.
RELEASE_NOTES_ORDER="breaking feat fix perf refactor revert docs test build ci style chore other"

# The previous production tag, prereleases excluded and the tag being released
# filtered out. Empty when this is the first production tag.
release_notes_baseline() {
  local tag="$1" candidate
  while IFS= read -r candidate; do
    [ -z "$candidate" ] && continue
    [ "$candidate" = "$tag" ] && continue
    printf '%s' "$candidate"
    return 0
  done < <(git tag --list 'v*' --sort=-v:refname \
    | grep -vE -- "$PRERELEASE_PATTERN" \
    | grep -E "$TAG_PATTERN")
  printf ''
}

# Echoes the category key for a commit. A '!' after the type or a 'BREAKING
# CHANGE:' footer outranks the type itself; an unrecognized subject falls to
# 'other' rather than being dropped, so nothing goes missing from the notes.
release_notes_category() {
  local subject="$1" body="$2" type
  if [[ "$subject" =~ ^[a-z]+(\([^\)]*\))?!: ]] || printf '%s\n' "$body" | grep -qE '^BREAKING[ -]CHANGE:'; then
    printf 'breaking'
    return
  fi
  type="${subject%%[(:]*}"
  case "$type" in
    feat | fix | perf | refactor | revert | docs | test | build | ci | style | chore) printf '%s' "$type" ;;
    *) printf 'other' ;;
  esac
}

release_notes_title() {
  case "$1" in
    breaking) printf '💥 Breaking Changes' ;;
    feat) printf '🚀 Features' ;;
    fix) printf '🐛 Bug Fixes' ;;
    perf) printf '⚡ Performance' ;;
    refactor) printf '♻️ Refactoring' ;;
    revert) printf '⏪ Reverts' ;;
    docs) printf '📚 Documentation' ;;
    test) printf '🧪 Tests' ;;
    build) printf '🏗️ Build' ;;
    ci) printf '🤖 Continuous Integration' ;;
    style) printf '💅 Style' ;;
    chore) printf '🔧 Maintenance' ;;
    *) printf '📦 Other Changes' ;;
  esac
}

# Writes the release body to stdout. The release commit itself is skipped: it
# records the version, it is not a change.
release_notes_body() {
  local tag="$1" baseline="$2"
  local range sha subject body category first
  local bucket_dir
  bucket_dir=$(mktemp -d)
  # shellcheck disable=SC2064
  trap "rm -rf '$bucket_dir'" RETURN

  if [ -n "$baseline" ]; then range="$baseline..$tag"; else range="$tag"; fi

  while IFS= read -r sha; do
    [ -z "$sha" ] && continue
    subject=$(git log -1 --format=%s "$sha")
    [[ "$subject" =~ $RELEASE_PATTERN ]] && continue
    body=$(git log -1 --format=%b "$sha")
    category=$(release_notes_category "$subject" "$body")
    printf -- '- %s (%s)\n' "$subject" "$(git log -1 --format=%h "$sha")" >>"$bucket_dir/$category"
  done < <(git log --no-merges --format=%H "$range")

  first=true
  for category in $RELEASE_NOTES_ORDER; do
    [ -s "$bucket_dir/$category" ] || continue
    [ "$first" = true ] || printf '\n'
    first=false
    printf '## %s\n\n' "$(release_notes_title "$category")"
    cat "$bucket_dir/$category"
  done

  if [ "$first" = true ]; then
    printf 'No changes recorded for this release.\n'
  fi

  if [ -n "$baseline" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
    printf '\n**Full changelog**: https://github.com/%s/compare/%s...%s\n' \
      "$GITHUB_REPOSITORY" "$baseline" "$tag"
  fi
}
