#!/bin/bash
# iOS App Setup Script for OtaNet Mobile

echo "🎬 OtaNet iOS App Setup"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g expo-cli
else
    echo "✅ Expo CLI found: $(expo --version)"
fi

echo ""

# Navigate to ios_app directory
cd "$(dirname "$0")" || exit

echo "📁 Installing dependencies in ios_app..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Create .env.local file with your API endpoint:"
echo "   EXPO_PUBLIC_API_BASE=https://your-ec2-instance.amazonaws.com"
echo ""
echo "2. Start the development server:"
echo "   npm start"
echo ""
echo "3. For iOS Simulator:"
echo "   Press 'i' in the Expo dev tools"
echo ""
echo "4. For physical device:"
echo "   Download Expo Go app and scan the QR code"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Quick start guide"
echo "   - DEVELOPMENT.md - Development guide"
echo "   - FEATURE_MAPPING.md - Feature mapping from web app"
echo ""
