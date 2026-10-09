#!/usr/bin/env bats
#
# The base is what the bump is applied to. Between releases package.json
# '.version' holds the last published version, and a prerelease bumped from it
# sorts below what is already on 'latest', so the base is read from the tags and
# the registry instead. These pin that cascade.

setup() {
  load helpers/sandbox
  setup_sandbox
  source "$BATS_TEST_DIRNAME/../resolve-base-version.sh"
}

teardown() {
  teardown_sandbox
}

@test "falls back to 0.0.0 with no tags and nothing published" {
  resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "0.0.0" ]
  [ "$BASE_SOURCE" = "none" ]
}

@test "reads the highest production tag when nothing is published" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v1.2.0"
  resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.2.0" ]
  [ "$BASE_SOURCE" = "tag" ]
}

@test "sorts tags numerically, not lexicographically" {
  tag "v1.9.0"
  commit "feat: A feature"
  tag "v1.10.0"
  resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.10.0" ]
}

@test "ignores prerelease tags" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v2.0.0-snapshot.20260725.1"
  resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.0.0" ]
}

@test "reads the registry when there is no tag" {
  NPM_VIEW_VERSIONS='["1.0.0","1.1.0"]' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.1.0" ]
  [ "$BASE_SOURCE" = "registry" ]
}

@test "handles the single-version registry shape" {
  # 'npm view --json' echoes a bare string, not an array, for one version.
  NPM_VIEW_VERSIONS='"1.0.0"' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.0.0" ]
  [ "$BASE_SOURCE" = "registry" ]
}

@test "takes the registry when it is ahead of the tags" {
  tag "v1.0.0"
  NPM_VIEW_VERSIONS='["1.0.0","1.5.0"]' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.5.0" ]
  [ "$BASE_SOURCE" = "registry" ]
}

@test "takes the tag when it is ahead of the registry" {
  tag "v2.0.0"
  NPM_VIEW_VERSIONS='["1.0.0"]' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "2.0.0" ]
  [ "$BASE_SOURCE" = "tag" ]
}

@test "resolves a tie to the registry, the authoritative record" {
  tag "v1.0.0"
  NPM_VIEW_VERSIONS='["1.0.0"]' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.0.0" ]
  [ "$BASE_SOURCE" = "registry" ]
}

@test "ignores prerelease versions published to the registry" {
  NPM_VIEW_VERSIONS='["1.0.0","2.0.0-snapshot.20260725.1"]' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.0.0" ]
}

@test "excludes the tag being released from both sources" {
  tag "v1.0.0"
  commit "feat: A feature"
  tag "v2.0.0"
  NPM_VIEW_VERSIONS='["1.0.0","2.0.0"]' resolve_base_version "@scope/pkg" "v2.0.0"
  [ "$BASE_VERSION" = "1.0.0" ]
}

@test "survives a registry that returns nothing parseable" {
  tag "v1.0.0"
  NPM_VIEW_VERSIONS='not json' resolve_base_version "@scope/pkg"
  [ "$BASE_VERSION" = "1.0.0" ]
  [ "$BASE_SOURCE" = "tag" ]
}
