#!/bin/bash
set -e

echo "========================================="
echo "⚡ WAYDROID INSTALLATION SCRIPT"
echo "========================================="
echo ""

# 1. Install Waydroid
echo "📦 Installing Waydroid..."
sudo apt update
sudo apt install -y waydroid

echo ""
echo "✅ Waydroid installed!"
echo ""

# 2. Initialize Waydroid
echo "🚀 Initializing Waydroid (this will take a while)..."
waydroid init

echo ""
echo "✅ Waydroid initialized!"
echo ""

# 3. Start Waydroid container
echo "🔥 Starting Waydroid container..."
waydroid container start

echo ""
echo "✅ Waydroid container started!"
echo ""

# 4. Show status
echo "📊 Waydroid status:"
waydroid status

echo ""
echo "========================================="
echo "✨ INSTALLATION COMPLETE!"
echo "========================================="
echo ""
echo "To install APKs:"
echo "  waydroid app install <path-to-apk>"
echo ""
echo "To launch apps:"
echo "  waydroid app launch <package-name>"
echo ""
echo "Common commands:"
echo "  waydroid log cat              - View logs"
echo "  waydroid shell                - Open ADB shell"
echo "  waydroid container stop       - Stop container"
echo "  waydroid container start      - Start container"
echo ""
