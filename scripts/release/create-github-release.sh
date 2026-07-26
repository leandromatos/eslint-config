#!/bin/bash
set -euo pipefail

# Create the GitHub Release for a production tag. Thin orchestrator: the notes
# themselves are built in release-notes.sh, which is sourceable and unit-tested.
#
# Usage: create-github-release.sh <tag> [--dry-run]
#   --dry-run prints the notes to stdout and creates nothing.
#
# Snapshots get no GitHub Release. They are throwaway previews and the 'snapshot'
# dist-tag on npm is their record; one pre-release per dogfooding cycle would bury
# the real ones. The workflow skips this step for a snapshot tag.

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./release-notes.sh
source "$SCRIPT_DIR/release-notes.sh"

TAG="${1:-}"
MODE="${2:-}"

if [ -z "$TAG" ]; then
  printf "Error: a tag is required.\n" >&2
  printf "Usage: create-github-release.sh <tag> [--dry-run]\n" >&2
  exit 1
fi

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
