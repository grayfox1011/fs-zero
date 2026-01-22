#!/bin/bash

# ================================================================
# DEPLOY SATELLITE TO MAINNET
# Canister: hamjq-waaaa-aaaal-asviq-cai
# ================================================================

set -e

CANISTER_ID="hamjq-waaaa-aaaal-asviq-cai"
WASM_FILE="target/wasm32-unknown-unknown/release/satellite.wasm"

echo "⚡ JUNO WEBSOCKET - DEPLOY MAINNET"
echo "=================================="
echo ""
echo "Canister: $CANISTER_ID"
echo ""

# Check WASM exists
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM not found. Building..."
    RUSTFLAGS='--cfg getrandom_backend="custom"' cargo build --release --target wasm32-unknown-unknown -p satellite
fi

WASM_SIZE=$(stat -c%s "$WASM_FILE" 2>/dev/null || stat -f%z "$WASM_FILE")
echo "📦 WASM Size: $WASM_SIZE bytes"
echo ""

# Get current identity
IDENTITY=$(dfx identity whoami)
echo "🔑 Current Identity: $IDENTITY"

PRINCIPAL=$(dfx identity get-principal)
echo "🆔 Principal: $PRINCIPAL"
echo ""

echo "⚠️  Make sure you are a controller of $CANISTER_ID"
echo ""
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "🚀 Deploying to mainnet..."
echo ""

# Deploy to mainnet
DFX_WARNING=-mainnet_plaintext_identity dfx canister --network ic install "$CANISTER_ID" \
    --wasm "$WASM_FILE" \
    --argument "(record {controllers = vec {principal \"${PRINCIPAL}\"}})"

echo ""
echo "✅ Deploy completed!"
echo ""
echo "Verify deployment:"
echo "  dfx canister --network ic call $CANISTER_ID ws_get_gateway_url"
echo ""
echo "Configure collection:"
echo "  dfx canister --network ic call $CANISTER_ID set_rule '(variant {DbConfig}, \"demo_collection\", record {read = variant {Public}; write = variant {Public}})'"
