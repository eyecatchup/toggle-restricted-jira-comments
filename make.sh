#!/bin/bash

version=$1

# Directory structure
SRC_DIR="src"
DIST_DIR="dist"
FIREFOX_ZIP="$DIST_DIR/gecko-${version}.zip"
CHROME_ZIP="$DIST_DIR/chromium-${version}.zip"

# Ensure the `dist` directory exists
mkdir -p "$DIST_DIR"

# Temporary directory for the Firefox build
FIREFOX_BUILD_DIR="firefox_build"
mkdir -p "$FIREFOX_BUILD_DIR"

# Step 1: Copy all other files to the Firefox build directory
echo "Copying source files for Firefox..."
cp -r "$SRC_DIR"/* "$FIREFOX_BUILD_DIR/"
rm "$FIREFOX_BUILD_DIR/manifest.json"

# Step 2: Create Firefox-specific manifest.json
echo "Creating Firefox-specific manifest.json..."
(
    # Read the original manifest.json
    manifest=$(<"$SRC_DIR/manifest.json")
    
    # Add the Firefox-specific key before the last closing brace
    firefox_manifest="${manifest%\}}"
    firefox_manifest="$firefox_manifest,
    \"browser_specific_settings\": {
        \"gecko\": {
            \"id\": \"jira-restricted-comments@eyecatchup\"
        }
    }
}"
    
    # Write the modified manifest to the Firefox build directory
    echo "$firefox_manifest" > "$FIREFOX_BUILD_DIR/manifest.json"
)

# Step 3: Create the Firefox zip file
echo "Creating Firefox extension zip..."
(
    cd "$FIREFOX_BUILD_DIR" || exit 1
    zip -r "../$FIREFOX_ZIP" *
)

# Step 4: Create the Chrome zip file
echo "Creating Chrome extension zip..."
(
    cd "$SRC_DIR" || exit 1
    zip -r "../$CHROME_ZIP" *
)

# Step 5: Cleanup
echo "Cleaning up temporary files..."
rm -rf "$FIREFOX_BUILD_DIR"

# Final message
echo "Build completed. Files are located in the '$DIST_DIR' directory:"
echo "  - Firefox: $FIREFOX_ZIP"
echo "  - Chrome: $CHROME_ZIP"
