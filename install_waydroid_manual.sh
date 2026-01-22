#!/bin/bash
set -e

echo "========================================="
echo "⚡ WAYDROID MANUAL INSTALLATION"
echo "========================================="
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
sudo apt update
sudo apt install -y \
    curl \
    git \
    ca-certificates \
    wget \
    libwayland-0 \
    libpulse0 \
    pipewire \
    pulseaudio \
    dnsmasq \
    containerd \
    docker.io \
    python3 \
    python3-pip

echo ""
echo "✅ Dependencies installed!"
echo ""

# 2. Clone Waydroid repository
echo "📥 Cloning Waydroid..."
cd /tmp
git clone https://github.com/waydroid/waydroid.git
cd waydroid

echo ""
echo "✅ Waydroid cloned!"
echo ""

# 3. Install Waydroid
echo "🚀 Installing Waydroid..."
./install.sh

echo ""
echo "✅ Waydroid installed!"
echo ""

# 4. Initialize Waydroid
echo "🔧 Initializing Waydroid (this will take time)..."
waydroid init

echo ""
echo "✅ Waydroid initialized!"
echo ""

# 5. Start Waydroid
echo "🔥 Starting Waydroid container..."
waydroid container start

echo ""
echo "✅ Waydroid started!"
echo ""

echo "========================================="
echo "✨ INSTALLATION COMPLETE!"
echo "========================================="
echo ""
echo "To install APKs:"
echo "  waydroid app install <path-to-apk>"
echo ""
echo "To launch apps:"
echo "  waydroid app launch com.zhiliaoapp.musically"
echo ""
