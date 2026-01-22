#!/bin/bash

echo "🚀 STARTING LOCAL JUNO WEBSOCKET DEMO ENVIRONMENT"
echo "==================================================="

# 1. Check DFX
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx not found. Please install DFINITY SDK."
    exit 1
fi

echo "✅ dfx found."

# 2. Check if local replica is running
if ! pgrep -f "dfx start" > /dev/null; then
    echo "🔄 Starting local replica..."
    dfx start --background --clean
else
    echo "✅ Local replica already running."
fi

# 3. Deploy Satellite (with WebSocket fixes)
echo "🛠️  Building and Deploying Satellite..."
dfx deploy satellite

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    exit 1
fi

echo "✅ Satellite Deployed: uzt4z-lp777-77774-qaabq-cai"

# 4. Check WebSocket Gateway
echo "📡 Checking WebSocket Gateway..."

if command -v ic_websocket_gateway &> /dev/null; then
    echo "✅ Gateway binary found. Starting..."
    # Start gateway in background (simplistic)
    ic_websocket_gateway --ic-network-url http://127.0.0.1:4943 --gateway-address 0.0.0.0:8081 --polling-interval 400 &
    GATEWAY_PID=$!
    echo "started with PID $GATEWAY_PID"
else
    echo "⚠️  ic_websocket_gateway NOT FOUND."
    echo ""
    echo "To complete the demo, you MUST run the gateway:"
    echo "   cargo install --git https://github.com/omnia-network/ic-websocket-gateway ic_websocket_gateway"
    echo "   ic_websocket_gateway --ic-network-url http://127.0.0.1:4943 --gateway-address 0.0.0.0:8081 --polling-interval 400"
    echo ""
    echo "For now, the WebSocket connection will fail until the gateway is running."
fi

echo "==================================================="
echo "🎉 DEMO READY!"
echo ""
echo "1. Open Listener:  WEBSOCKET_FINAL_DEMO.html"
echo "2. Open Writer:    WEBSOCKET_WRITER.html"
echo ""
echo "Note: Ensure Gateway is running on port 8080."
