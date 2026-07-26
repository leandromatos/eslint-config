#!/usr/bin/env bats
#
# The notes replace the changelog that was removed, so they are the only
# human-readable record of what a release contains. These pin the classification
# rules, the section order, and the two things that must never happen: a commit
# silently dropped, and the release commit showing up as a change.

setup() {
  load helpers/sandbox
  setup_sandbox
  source "$BATS_TEST_DIRNAME/../release-notes.sh"
}

teardown() {
  teardown_sandbox
}

@test "categorizes each Conventional Commit type" {
  [ "$(release_notes_category 'feat: A thing' '')" = "feat" ]
  [ "$(release_notes_category 'fix: A thing' '')" = "fix" ]
  [ "$(release_notes_category 'perf: A thing' '')" = "perf" ]
  [ "$(release_notes_category 'refactor: A thing' '')" = "refactor" ]
  [ "$(release_notes_category 'docs: A thing' '')" = "docs" ]
  [ "$(release_notes_category 'chore: A thing' '')" = "chore" ]
}

@test "categorizes a scoped subject by its type" {
  [ "$(release_notes_category 'feat(api): A thing' '')" = "feat" ]
}

@test "a bang outranks the type" {
  [ "$(release_notes_category 'fix!: A thing' '')" = "breaking" ]
  [ "$(release_notes_category 'feat(api)!: A thing' '')" = "breaking" ]
}

@test "a BREAKING CHANGE footer outranks the type" {
  [ "$(release_notes_category 'refactor: A thing' 'BREAKING CHANGE: It moved.')" = "breaking" ]
  [ "$(release_notes_category 'refactor: A thing' 'BREAKING-CHANGE: It moved.')" = "breaking" ]
}

@test "an unrecognized subject falls to other instead of being dropped" {
  [ "$(release_notes_category 'Merge branch main' '')" = "other" ]
  [ "$(release_notes_category 'WIP' '')" = "other" ]
}

@test "every category has a title" {
  local category
  for category in $RELEASE_NOTES_ORDER; do
    [ -n "$(release_notes_title "$category")" ]
  done
}

@test "baseline is the previous production tag" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v1.1.0"
  [ "$(release_notes_baseline v1.1.0)" = "v1.0.0" ]
}

@test "baseline skips prereleases" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v1.1.0-snapshot.20260725.1"
  commit "feat: Another"
  tag "v1.1.0"
  [ "$(release_notes_baseline v1.1.0)" = "v1.0.0" ]
}

@test "baseline is empty for the first production tag" {
  tag "v1.0.0"
  [ -z "$(release_notes_baseline v1.0.0)" ]
}

@test "body groups commits under their sections" {
  tag "v1.0.0"
  commit "feat: Add a thing"
  commit "fix: Correct a thing"
  tag "v1.1.0"

  run release_notes_body v1.1.0 v1.0.0
  [ "$status" -eq 0 ]
  [[ "$output" == *"## 🚀 Features"* ]]
  [[ "$output" == *"- feat: Add a thing"* ]]
  [[ "$output" == *"## 🐛 Bug Fixes"* ]]
  [[ "$output" == *"- fix: Correct a thing"* ]]
}

@test "body puts breaking changes first" {
  tag "v1.0.0"
  commit "docs: A note"
  commit "feat!: Break a contract"
  tag "v2.0.0"

  run release_notes_body v2.0.0 v1.0.0
  [[ "${lines[0]}" == "## 💥 Breaking Changes" ]]
}

@test "body skips the release commit itself" {
  tag "v1.0.0"
  commit "feat: Add a thing"
  commit "chore(release): v1.1.0"
  tag "v1.1.0"

  run release_notes_body v1.1.0 v1.0.0
  [[ "$output" != *"chore(release)"* ]]
  [[ "$output" == *"- feat: Add a thing"* ]]
}

@test "body says so when a range holds only the release commit" {
  tag "v1.0.0"
  commit "chore(release): v1.0.1"
  tag "v1.0.1"

  run release_notes_body v1.0.1 v1.0.0
  [[ "$output" == *"No changes recorded for this release."* ]]
}

@test "body appends the compare link when the repository is known" {
  tag "v1.0.0"
  commit "feat: Add a thing"
  tag "v1.1.0"

  GITHUB_REPOSITORY="owner/repo" run release_notes_body v1.1.0 v1.0.0
  [[ "$output" == *"**Full changelog**: https://github.com/owner/repo/compare/v1.0.0...v1.1.0"* ]]
}

@test "body omits the compare link outside CI" {
  tag "v1.0.0"
  commit "feat: Add a thing"
  tag "v1.1.0"

  GITHUB_REPOSITORY="" run release_notes_body v1.1.0 v1.0.0
  [[ "$output" != *"Full changelog"* ]]
}
