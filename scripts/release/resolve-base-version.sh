# shellcheck shell=bash
#
# Resolves the base version for the next release from real state, not from
# package.json '.version'.
#
# '.version' is a derived value. A snapshot never rewrites it, and a production
# release only rewrites it on the way out, so between releases it is a stale
# cache of the last thing published. Bumping from it is what lets a snapshot name
# a version at or below what is already on 'latest' — a prerelease sorts below
# its own release, so 'X.Y.Z-snapshot.N' published against an existing 'X.Y.Z'
# lands the snapshot channel behind the stable one, and the later promote to
# 'X.Y.Z' collides with a version the registry already has.
#
# base = max(highest production tag, highest published registry version).
# Prereleases and anything that is not plain 'X.Y.Z' are ignored. With neither a
# tag nor a published version the base is 0.0.0 (greenfield). A tie resolves to
# the registry, the authoritative record of what actually exists.
#
# Sets globals (call WITHOUT command substitution, or a subshell swallows the
# assignments):
#   BASE_VERSION  base without the leading 'v' (e.g. '2.0.2' or '0.0.0')
#   BASE_SOURCE   where it came from: 'tag' | 'registry' | 'none'
#
# Args: <package-name> [exclude-tag]
#   package-name  npm package name, e.g. '@leandromatos/prettier-config'
#   exclude-tag   optional tag to ignore in both the git scan and the registry
#                 lookup, for callers that run after the tag already exists

RESOLVE_BASE_VERSION_SH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./patterns.sh
source "$RESOLVE_BASE_VERSION_SH_DIR/patterns.sh"

# Highest production tag, prereleases excluded, the released tag filtered out.
# git's own version sort keeps this portable: BSD sort has no reliable -V.
base_version_latest_tag() {
  local exclude_tag="$1"
  local candidate
  while IFS= read -r candidate; do
    [ -z "$candidate" ] && continue
    [ "$candidate" = "$exclude_tag" ] && continue
    printf '%s' "${candidate#v}"
    return 0
  done < <(git tag --list 'v*' --sort=-v:refname 2>/dev/null \
    | grep -vE -- "$PRERELEASE_PATTERN" \
    | grep -E "$TAG_PATTERN")
  printf ''
}

# Highest plain 'X.Y.Z' published to npm, excluding the version being released.
# Empty when the package is unpublished (npm exits non-zero) or when nothing
# published matches. node does the JSON parsing and the numeric compare, so this
# needs no jq: every repository consuming these scripts already has node.
base_version_registry() {
  local package_name="$1"
  local exclude_version="$2"
  local raw

  raw=$(npm view "$package_name" versions --json 2>/dev/null || true)
  [ -z "$raw" ] && {
    printf ''
    return 0
  }

  EXCLUDE_VERSION="$exclude_version" node -e '
    let parsed
    try {
      parsed = JSON.parse(require("fs").readFileSync(0, "utf8"))
    } catch {
      process.stdout.write("")
      process.exit(0)
    }
    // "--json" yields a bare string for a single published version, an array for many.
    const versions = Array.isArray(parsed) ? parsed : [parsed]
    const exclude = process.env.EXCLUDE_VERSION
    const production = versions
      .filter(version => /^\d+\.\d+\.\d+$/.test(version))
      .filter(version => version !== exclude)
      .map(version => version.split(".").map(Number))
    if (production.length === 0) {
      process.stdout.write("")
      process.exit(0)
    }
    production.sort(([aMajor, aMinor, aPatch], [bMajor, bMinor, bPatch]) =>
      aMajor - bMajor || aMinor - bMinor || aPatch - bPatch,
    )
    process.stdout.write(production[production.length - 1].join("."))
  ' <<<"$raw"
}

resolve_base_version() {
  local package_name="$1"
  local exclude_tag="${2:-}"
  local exclude_version="${exclude_tag#v}"

  local tag_version registry_version
  tag_version=$(base_version_latest_tag "$exclude_tag")
  registry_version=$(base_version_registry "$package_name" "$exclude_version")

  BASE_VERSION="0.0.0"
  BASE_SOURCE="none"

  if [ -n "$tag_version" ]; then
    BASE_VERSION="$tag_version"
    BASE_SOURCE="tag"
  fi

  if [ -n "$registry_version" ]; then
    if [ "$BASE_SOURCE" = "none" ]; then
      BASE_VERSION="$registry_version"
      BASE_SOURCE="registry"
    else
      local greater
      greater=$(printf '%s\n%s\n' "$BASE_VERSION" "$registry_version" \
        | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)
      if [ "$greater" = "$registry_version" ]; then
        BASE_VERSION="$registry_version"
        BASE_SOURCE="registry"
      fi
    fi
  fi
}
