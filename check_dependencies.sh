#!/bin/bash
echo "Checking for required dependencies..."

if command -v pkg-config &> /dev/null; then
    echo "✅ pkg-config is installed."
else
    echo "❌ pkg-config is MISSING."
fi

# Check for OpenSSL development headers (this is heuristic)
if [ -f /usr/include/openssl/ssl.h ] || [ -f /usr/local/include/openssl/ssl.h ] || [ -f /usr/lib/pkgconfig/openssl.pc ] || [ -f /usr/lib64/pkgconfig/openssl.pc ]; then
    echo "✅ OpenSSL headers found (likely)."
else
    # Try using pkg-config if available
    if command -v pkg-config &> /dev/null; then
        if pkg-config --exists openssl; then
             echo "✅ OpenSSL found via pkg-config."
        else
             echo "❌ OpenSSL headers NOT found via pkg-config."
        fi
    else
         echo "❓ Could not verify OpenSSL headers (pkg-config missing)."
    fi
fi

echo "========================================"
echo "If dependencies are missing, please install them:"
echo "Debian/Ubuntu: sudo apt-get install pkg-config libssl-dev"
echo "Fedora: sudo dnf install pkgconf-pkg-config openssl-devel"
echo "Arch: sudo pacman -S pkgconf openssl"
