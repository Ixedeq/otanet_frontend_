#!/bin/bash
# Deploy OtaNet to connected iPhone via devicectl
# Usage: ./deploy-to-phone.sh

set -e

DEVICE_ID="00008110-000C3D5802E1801E"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_DIR="$SCRIPT_DIR/ios"
WORKSPACE="OtaNet.xcworkspace"
SCHEME="OtaNet"
TEAM_ID="5MG74J2YDH"

echo "📲 Deploying OtaNet to device..."

cd "$IOS_DIR"

# Build
xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination "id=$DEVICE_ID" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_IDENTITY="Apple Development" \
    CODE_SIGN_STYLE=Automatic \
    build 2>&1 | tail -3

# Find the built .app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -path "*/Build/Products/Release-iphoneos/OtaNet.app" -print -quit 2>/dev/null)

if [ -z "$APP_PATH" ]; then
    echo "❌ Could not find built app bundle"
    exit 1
fi

echo "📦 Installing..."
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"

echo "✅ OtaNet installed!"
