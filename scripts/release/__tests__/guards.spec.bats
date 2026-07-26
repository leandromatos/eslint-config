#!/usr/bin/env bats
#
# The bump resolution decides which version gets published, so a wrong answer
# here ships a wrong version to npm. These pin the detection rules, the 0.x cap,
# and the confirmation prompt's behavior without a terminal — the path that broke
# the first real release attempt.

setup() {
  load helpers/sandbox
  setup_sandbox
  source "$BATS_TEST_DIRNAME/../guards.sh"
}

teardown() {
  teardown_sandbox
}

@test "last_production_tag ignores prereleases" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v1.1.0-snapshot.20260725.1"
  [ "$(last_production_tag)" = "v1.0.0" ]
}

@test "last_production_tag is empty when only prereleases exist" {
  tag "v0.1.0-snapshot.20260725.1"
  [ -z "$(last_production_tag)" ]
}

@test "bump_from_commits reports patch when nothing notable landed" {
  tag "v1.0.0"
  commit "fix: Correct a thing"
  commit "docs: Explain a thing"
  [ "$(bump_from_commits v1.0.0)" = "patch" ]
}

@test "bump_from_commits reports minor for a feat" {
  tag "v1.0.0"
  commit "fix: Correct a thing"
  commit "feat: Add a thing"
  [ "$(bump_from_commits v1.0.0)" = "minor" ]
}

@test "bump_from_commits reports major for a bang" {
  tag "v1.0.0"
  commit "feat: Add a thing"
  commit "fix!: Change a contract"
  [ "$(bump_from_commits v1.0.0)" = "major" ]
}

@test "bump_from_commits reports major for a BREAKING CHANGE footer" {
  tag "v1.0.0"
  commit "refactor: Rework a thing" "BREAKING CHANGE: The option was renamed."
  [ "$(bump_from_commits v1.0.0)" = "major" ]
}

@test "bump_from_commits only looks after the given tag" {
  commit "feat: An old feature"
  tag "v1.0.0"
  commit "docs: A new note"
  [ "$(bump_from_commits v1.0.0)" = "patch" ]
}

@test "resolve_target_version_from_bump applies each explicit bump" {
  resolve_target_version_from_bump patch "1.2.3"
  [ "$RESOLVED_VERSION" = "1.2.4" ]
  resolve_target_version_from_bump minor "1.2.3"
  [ "$RESOLVED_VERSION" = "1.3.0" ]
  resolve_target_version_from_bump major "1.2.3"
  [ "$RESOLVED_VERSION" = "2.0.0" ]
}

@test "resolve_target_version_from_bump accepts an explicit target" {
  resolve_target_version_from_bump "9.9.9" "1.2.3"
  [ "$RESOLVED_VERSION" = "9.9.9" ]
}

@test "resolve_target_version_from_bump rejects an unknown bump" {
  run resolve_target_version_from_bump sideways "1.2.3"
  [ "$status" -ne 0 ]
  [[ "$output" == *"must be 'auto', 'patch', 'minor', 'major', or 'X.Y.Z'"* ]]
}

@test "resolve_target_version_from_bump rejects a non-semver base" {
  run resolve_target_version_from_bump patch "1.2"
  [ "$status" -ne 0 ]
  [[ "$output" == *"base version is not semver"* ]]
}

@test "resolve_target_version_from_bump caps an inferred major while on 0.x" {
  tag "v0.1.0"
  commit "feat!: Break a contract"
  resolve_target_version_from_bump auto "0.1.0"
  [ "$RESOLVED_BUMP" = "minor" ]
  [ "$RESOLVED_VERSION" = "0.2.0" ]
  [[ "$DETECTION_NOTE" == *"capped to minor"* ]]
}

@test "resolve_target_version_from_bump honors an explicit major on 0.x" {
  resolve_target_version_from_bump major "0.6.0"
  [ "$RESOLVED_VERSION" = "1.0.0" ]
}

@test "confirm_or_abort proceeds when RELEASE_ASSUME_YES is set" {
  RELEASE_ASSUME_YES=1 run confirm_or_abort
  [ "$status" -eq 0 ]
}

@test "confirm_or_abort fails with a usable message when no terminal is reachable" {
  # 'env -u' is load-bearing. RELEASE_ASSUME_YES is exported by whoever runs a
  # release, so it reaches this suite through the pre-commit hook and sends the
  # function down the assume-yes path. Without unsetting it, the test passes in a
  # clean shell and fails during an actual release — the one moment it matters.
  run env -u RELEASE_ASSUME_YES bash -c "source '$BATS_TEST_DIRNAME/../guards.sh'; confirm_or_abort" </dev/null
  [ "$status" -eq 1 ]
  [[ "$output" == *"no terminal available to confirm"* ]]
  [[ "$output" == *"RELEASE_ASSUME_YES=1"* ]]
}

@test "require_tag_does_not_exist rejects a tag that is already there" {
  tag "v1.0.0"
  run require_tag_does_not_exist "v1.0.0"
  [ "$status" -ne 0 ]
  [[ "$output" == *"already exists"* ]]
}

@test "require_latest_commit_is_not_release rejects a release commit at HEAD" {
  commit "chore(release): v1.0.0"
  run require_latest_commit_is_not_release
  [ "$status" -ne 0 ]
  [[ "$output" == *"already a release"* ]]
}

@test "require_clean_working_tree rejects uncommitted changes" {
  printf 'dirty\n' >stray.txt
  git add stray.txt
  run require_clean_working_tree
  [ "$status" -ne 0 ]
  [[ "$output" == *"not clean"* ]]
}

@test "write_package_version rewrites only the version" {
  write_package_version "4.5.6"
  [ "$(node -p "require('$PWD/package.json').version")" = "4.5.6" ]
  [ "$(node -p "require('$PWD/package.json').name")" = "@scope/pkg" ]
}
