#!/usr/bin/env bats
#
# The three regexes every release decision leans on, and the tag scan they drive:
# which tags count as production, which are prereleases, and which commit subject
# is a release. A silent drift here misreads the baseline, the bump, and the notes
# at once.

setup() {
  load helpers/sandbox
  setup_sandbox
  source "$BATS_TEST_DIRNAME/../patterns.sh"
}

teardown() {
  teardown_sandbox
}

@test "latest_production_tag answers the highest production tag, prereleases left out" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v1.1.0-snapshot.20260725.1"
  [ "$(latest_production_tag)" = "v1.0.0" ]
}

@test "latest_production_tag leaves out the tag it is told to" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v1.1.0"
  [ "$(latest_production_tag v1.1.0)" = "v1.0.0" ]
}

@test "latest_production_tag is empty when only prereleases exist, or only the excluded tag" {
  tag "v0.1.0-snapshot.20260725.1"
  [ -z "$(latest_production_tag)" ]
  tag "v1.0.0"
  [ -z "$(latest_production_tag v1.0.0)" ]
}

@test "TAG_PATTERN accepts plain semver tags and nothing else" {
  [[ "v1.2.3" =~ $TAG_PATTERN ]]
  [[ "v10.20.30" =~ $TAG_PATTERN ]]
  ! [[ "v1.2" =~ $TAG_PATTERN ]]
  ! [[ "v1.2.3.4" =~ $TAG_PATTERN ]]
  ! [[ "1.2.3" =~ $TAG_PATTERN ]]
  ! [[ "v1.2.3-snapshot.20260725.1" =~ $TAG_PATTERN ]]
}

@test "PRERELEASE_PATTERN matches every prerelease flavor" {
  [[ "v1.2.3-snapshot.20260725.1" =~ $PRERELEASE_PATTERN ]]
  [[ "v1.2.3-rc.1" =~ $PRERELEASE_PATTERN ]]
  [[ "v1.2.3-beta.1" =~ $PRERELEASE_PATTERN ]]
  [[ "v1.2.3-alpha.1" =~ $PRERELEASE_PATTERN ]]
  [[ "v1.2.3-canary.1" =~ $PRERELEASE_PATTERN ]]
}

@test "PRERELEASE_PATTERN leaves production tags alone" {
  ! [[ "v1.2.3" =~ $PRERELEASE_PATTERN ]]
  # The identifier has to be followed by a dot, so a version that merely
  # contains the word is not a prerelease.
  ! [[ "v1.2.3-snapshotting" =~ $PRERELEASE_PATTERN ]]
}

@test "RELEASE_PATTERN matches a release subject and captures the tag" {
  [[ "chore(release): v1.2.3" =~ $RELEASE_PATTERN ]]
  [ "${BASH_REMATCH[1]}" = "v1.2.3" ]
}

@test "RELEASE_PATTERN rejects anything that is not a release subject" {
  ! [[ "feat: Add a thing" =~ $RELEASE_PATTERN ]]
  ! [[ "chore: v1.2.3" =~ $RELEASE_PATTERN ]]
  ! [[ "chore(release): Bump the version" =~ $RELEASE_PATTERN ]]
  # The release script writes the subject itself, so the suffix of a squash merge is refused.
  ! [[ "chore(release): v1.2.3 (#42)" =~ $RELEASE_PATTERN ]]
}
