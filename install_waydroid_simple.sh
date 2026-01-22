#!/bin/bash
set -e

echo "========================================="
echo "⚡ WAYDROID INSTALLATION (SIMPLE)"
echo "========================================="
echo ""

# 1. Install only essential dependencies
echo "📦 Installing dependencies..."
sudo apt update
sudo apt install -y \
    curl \
    git \
    wget \
    python3 \
    python3-pip \
    cgroup-tools \
    lxc \
    lxc-templates \
    uidmap

echo ""
echo "✅ Dependencies installed!"
echo ""

# 2. Clone Waydroid
echo "📥 Cloning Waydroid..."
cd /tmp
rm -rf waydroid
git clone https://github.com/waydroid/waydroid.git
cd waydroid

echo ""
echo "✅ Waydroid cloned!"
echo ""

# 3. Install Waydroid (it will install other deps)
echo "🚀 Installing Waydroid..."
./install.sh

echo ""
echo "✅ Waydroid installed!"
echo ""

echo "========================================="
echo "✨ READY TO INITIALIZE!"
echo "========================================="
echo ""
echo "Now run:"
echo "  cd /tmp/waydroid"
echo "  waydroid init"
echo ""
echo "⚠️  WARNING: This will download ~1-2 GB!"
echo ""

