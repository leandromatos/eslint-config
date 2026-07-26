#!/usr/bin/env bats
#
# The three regexes every release decision leans on: which tags count as
# production, which are prereleases, and which commit subject is a release. A
# silent drift here misreads the baseline, the bump, and the notes at once.

setup() {
  source "$BATS_TEST_DIRNAME/../patterns.sh"
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
  # No pull requests here, so the squash suffix GitHub appends is not accepted.
  ! [[ "chore(release): v1.2.3 (#42)" =~ $RELEASE_PATTERN ]]
}
