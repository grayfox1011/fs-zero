#!/bin/bash
set -e

echo "========================================="
echo "⚡ WS TEST CANISTER DEPLOY - LOCAL"
echo "========================================="
echo ""

# Build
echo "🔨 Building canister..."
RUSTFLAGS='--cfg getrandom_backend="custom"' cargo build --target wasm32-unknown-unknown --release

# Check if build was successful
if [ ! -f "target/wasm32-unknown-unknown/release/ws_test_canister.wasm" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Get WASM size
WASM_SIZE=$(wc -c < target/wasm32-unknown-unknown/release/ws_test_canister.wasm)
echo "📦 WASM size: $WASM_SIZE bytes"
echo ""

# Deploy with dfx
echo "🚀 Deploying canister..."
dfx deploy --network local

echo ""
echo "✅ Deploy complete!"
echo ""
echo "Canister info:"
dfx canister --network local id ws_test
dfx canister --network local info ws_test
