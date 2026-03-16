#!/bin/bash
# Build IPA for OtaNet Mobile
# Usage: ./build-ipa.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_DIR="$SCRIPT_DIR/ios"
WORKSPACE="OtaNet.xcworkspace"
SCHEME="OtaNet"
TEAM_ID="5MG74J2YDH"
BUILD_DIR="$SCRIPT_DIR/build_output"
ARCHIVE_PATH="$BUILD_DIR/OtaNet.xcarchive"
IPA_DIR="$BUILD_DIR/ipa"
EXPORT_PLIST="$BUILD_DIR/ExportOptions.plist"

echo "📱 OtaNet IPA Builder"
echo "====================="
echo ""

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$IPA_DIR"

# Create ExportOptions.plist for development (ad-hoc / personal device)
cat > "$EXPORT_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

cd "$IOS_DIR"

# Step 1: Clean
echo "🧹 Cleaning previous build..."
xcodebuild clean \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -quiet

# Step 2: Archive
echo "📦 Archiving (this may take a few minutes)..."
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_IDENTITY="Apple Development" \
    CODE_SIGN_STYLE=Automatic \
    -quiet

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ Archive failed!"
    exit 1
fi

echo "✅ Archive created at $ARCHIVE_PATH"

# Step 3: Export IPA
echo "📤 Exporting IPA..."
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$IPA_DIR" \
    -exportOptionsPlist "$EXPORT_PLIST" \
    -quiet

IPA_FILE=$(find "$IPA_DIR" -name "*.ipa" -print -quit)

if [ -z "$IPA_FILE" ]; then
    echo "❌ IPA export failed!"
    exit 1
fi

echo ""
echo "✅ IPA built successfully!"
echo "📍 Location: $IPA_FILE"
echo ""
echo "To install on your phone, run:"
echo "  ./deploy-to-phone.sh"
