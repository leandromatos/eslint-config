#!/bin/bash

# Set a clean semver version for a production (latest) release.
# Strips any -snapshot suffix, then applies the bump. Symmetric to
# snapshot-version-bump.sh: it only edits package.json. Commit the
# "chore(release): vX.Y.Z" and tag it yourself; deploy.yaml publishes to latest.
#
# Usage: ./scripts/production-version-bump.sh [promote|patch|minor|major|X.Y.Z]
#   promote  drop the -snapshot suffix, release the current base as-is (default)
#   patch    X.Y.Z -> X.Y.(Z+1)
#   minor    X.Y.Z -> X.(Y+1).0
#   major    X.Y.Z -> (X+1).0.0
#   X.Y.Z    set an explicit version

# The bump to apply, defaulting to promote
BUMP="${1:-promote}"

# Path to the package.json file
PACKAGE_JSON="package.json"

# Extract the current version and strip any -snapshot suffix to get the base
CURRENT_VERSION=$(grep '"version"' "$PACKAGE_JSON" | head -1 | awk -F '"' '{print $4}')
BASE_VERSION="${CURRENT_VERSION%-snapshot.*}"
IFS='.' read -r MAJOR MINOR PATCH <<< "$BASE_VERSION"

# Resolve the new version from the requested bump
case "$BUMP" in
  promote) NEW_VERSION="$BASE_VERSION" ;;
  patch) NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
  minor) NEW_VERSION="$MAJOR.$((MINOR + 1)).0" ;;
  major) NEW_VERSION="$((MAJOR + 1)).0.0" ;;
  *.*.*) NEW_VERSION="$BUMP" ;;
  *)
    echo "Unknown bump '$BUMP'. Use promote, patch, minor, major, or an explicit X.Y.Z." >&2
    exit 1
    ;;
esac

# Update the version in package.json with the new production version
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"

# Output the new version to the console for reference
echo "Production version set to \"v$NEW_VERSION\". Use this for your git tag."
