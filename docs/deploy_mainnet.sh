#!/bin/bash

# ================================================================
# JUNO WEBSOCKET - DEPLOY MAINNET
# ================================================================

set -e

echo "🚀 Juno WebSocket - Deploy Mainnet"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}1. Verificando prerequisiti...${NC}"

if ! command -v dfx &> /dev/null; then
    echo -e "${RED}❌ dfx non installato${NC}"
    echo "Installa con: sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"""
    exit 1
fi
echo -e "${GREEN}✅ dfx installato${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm non installato${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm installato${NC}"

echo ""
echo -e "${YELLOW}2. Building WASM...${NC}"
RUSTFLAGS='--cfg getrandom_backend="custom"' cargo build --release --target wasm32-unknown-unknown -p satellite

if [ ! -f "target/wasm32-unknown-unknown/release/satellite.wasm" ]; then
    echo -e "${RED}❌ Build fallito${NC}"
    exit 1
fi

WASM_SIZE=$(stat -f%z "target/wasm32-unknown-unknown/release/satellite.wasm" 2>/dev/null || stat -c%s "target/wasm32-unknown-unknown/release/satellite.wasm")
echo -e "${GREEN}✅ WASM creato: ${WASM_SIZE} bytes${NC}"

echo ""
echo -e "${YELLOW}3. Verificando identità...${NC}"

# Check if user is logged in
if ! dfx identity whoami &> /dev/null; then
    echo -e "${RED}❌ Non autenticato${NC}"
    echo "Autenticati con: dfx identity login"
    exit 1
fi

IDENTITY=$(dfx identity whoami)
PRINCIPAL=$(dfx identity get-principal)
echo -e "${GREEN}✅ Autenticato come: ${IDENTITY}${NC}"
echo -e "${GREEN}   Principal: ${PRINCIPAL}${NC}"

echo ""
echo -e "${YELLOW}4. Opzioni di deploy:${NC}"
echo ""
echo "Seleziona modalità:"
echo "  1) Deploy con Juno CLI (raccomandato)"
echo "  2) Deploy con dfx (manuale)"
echo "  3) Solo build WASM (no deploy)"
echo ""
read -p "Scelta [1-3]: " choice

case $choice in
  1)
    echo ""
    echo -e "${YELLOW}Deploy con Juno CLI...${NC}"

    if ! command -v juno &> /dev/null; then
        echo "Installo Juno CLI..."
        npm install -g @junobuild/cli
    fi

    echo "Deploying in production..."
    juno deploy --production
    ;;
  2)
    echo ""
    echo -e "${YELLOW}Deploy con dfx...${NC}"
    echo "Network: ic (mainnet)"
    echo ""
    read -p "Satellite ID (lascia vuoto per crearne uno nuovo): " SATELLITE_ID

    if [ -z "$SATELLITE_ID" ]; then
      dfx deploy --network ic satellite
    else
      dfx canister --network ic install "$SATELLITE_ID" \
        --wasm target/wasm32-unknown-unknown/release/satellite.wasm \
        --argument "(record {controllers = vec {principal \"${PRINCIPAL}\"}})"
    fi
    ;;
  3)
    echo ""
    echo -e "${GREEN}✅ WASM pronto per deploy manuale${NC}"
    echo "File: target/wasm32-unknown-unknown/release/satellite.wasm"
    echo ""
    echo "Per deploy manuale:"
    echo "  dfx canister --network ic install <satellite-id> \\"
    echo "    --wasm target/wasm32-unknown-unknown/release/satellite.wasm"
    exit 0
    ;;
  *)
    echo -e "${RED}❌ Scelta non valida${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✅ Deploy completato!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo "Prossimi passi:"
echo "  1. Configura le collections con set_rule"
echo "  2. Integra il client WebSocket nel frontend"
echo "  3. Testa con: dfx canister call <satellite-id> ws_stats"
echo ""
echo "Documentazione: DEPLOYMENT_MAINNET.md"
