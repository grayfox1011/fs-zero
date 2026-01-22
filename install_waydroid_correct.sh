#!/bin/bash
set -e

echo "========================================="
echo "⚡ WAYDROID INSTALLATION"
echo "========================================="
echo ""

# Vai nella directory Waydroid
cd /tmp/waydroid

# Installa Waydroid
echo "🚀 Installing Waydroid..."
sudo make install

echo ""
echo "✅ Waydroid installed!"
echo ""

# Verifica installazione
echo "📊 Checking installation..."
waydroid version || echo "⚠️  Waydroid not in PATH yet"

echo ""
echo "========================================="
echo "✨ READY TO INITIALIZE!"
echo "========================================="
echo ""
echo "Now run these commands:"
echo ""
echo "  waydroid init"
echo "  waydroid container start"
echo ""
echo "⚠️  WARNING: waydroid init will download ~1-2 GB!"
echo ""
