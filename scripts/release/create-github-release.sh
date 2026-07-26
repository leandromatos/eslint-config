#!/bin/bash
set -euo pipefail

# Create the GitHub Release for a production tag, with notes built from the
# Conventional Commits since the previous production tag.
#
# Usage: create-github-release.sh <tag> [--dry-run]
#   --dry-run prints the notes to stdout and creates nothing.
#
# GitHub's own '--generate-notes' is not used here. It builds its list from merged
# pull requests, and these repositories are trunk-based with direct commits, so it
# would produce an empty release. The commit log is the record instead — the same
# signal the bump resolution reads, and commitlint already guarantees its shape.
#
# Snapshots get no GitHub Release. They are throwaway previews and the 'snapshot'
# dist-tag on npm is their record; one pre-release per dogfooding cycle would bury
# the real ones.

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./patterns.sh
source "$SCRIPT_DIR/patterns.sh"

TAG="${1:-}"
MODE="${2:-}"

if [ -z "$TAG" ]; then
  printf "Error: a tag is required.\n" >&2
  printf "Usage: create-github-release.sh <tag> [--dry-run]\n" >&2
  exit 1
fi

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

# Writes the release body to stdout. Commits are grouped by category in the order
# below, which puts what a consumer cares about first. The release commit itself
# is skipped: it records the version, it is not a change.
release_notes_body() {
  local tag="$1" baseline="$2"
  local range sha subject body category
  local order="breaking feat fix perf refactor revert docs test build ci style chore other"
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

  local first=true
  for category in $order; do
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

BASELINE=$(release_notes_baseline "$TAG")

if [ -z "$BASELINE" ]; then
  NOTES="First release tracked through the release scripts. Notes are generated from the commit log from this version onward."
else
  NOTES=$(release_notes_body "$TAG" "$BASELINE")
fi

if [ "$MODE" = "--dry-run" ]; then
  printf 'Tag:      %s\n' "$TAG"
  printf 'Baseline: %s\n\n' "${BASELINE:-(none, first release)}"
  printf '%s\n' "$NOTES"
  exit 0
fi

printf '%s' "$NOTES" | gh release create "$TAG" --title "$TAG" --latest --notes-file -

printf "\nGitHub Release created for '%s'.\n" "$TAG"
