#!/bin/bash

# Path to the package.json file
PACKAGE_JSON="package.json"

# Get today's date in the format YYYYMMDD
TODAY=$(date +%Y%m%d)

# Extract the current version from package.json
CURRENT_VERSION=$(cat $PACKAGE_JSON | grep '"version"' | awk -F '"' '{print $4}')
echo "Current version: $CURRENT_VERSION"

# Define the base for the new version (without the snapshot number)
VERSION_BASE="${CURRENT_VERSION%-snapshot.*}-snapshot.${TODAY}"

# Check if today's snapshot already exists in the current version
if [[ $CURRENT_VERSION == *"$TODAY"* ]]; then
  # Extract the last snapshot number and increment it
  LAST_SNAPSHOT=$(echo $CURRENT_VERSION | awk -F '.' '{print $NF}')
  NEXT_SNAPSHOT=$((LAST_SNAPSHOT + 1))
else
  # If it's a new day, reset the snapshot counter to 1
  NEXT_SNAPSHOT=1
fi

# Define the new snapshot version
NEW_VERSION="${VERSION_BASE}.${NEXT_SNAPSHOT}"

# Update the version in package.json with the new snapshot version
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" $PACKAGE_JSON

# Output the new version to the console for reference
echo "Snapshot version updated to \"v$NEW_VERSION\". Use this for your git tag."
