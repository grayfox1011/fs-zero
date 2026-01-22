#!/bin/bash
echo "Attempting to install ic_websocket_gateway and capturing output..."
cargo install --git https://github.com/omnia-network/ic-websocket-gateway ic_websocket_gateway > install_log.txt 2>&1
echo "Installation attempt finished. Check install_log.txt for details."
