#!/bin/bash

# ================================================================
# JUNO WEBSOCKET TEST SCRIPT
# ================================================================
# Questo script simula operazioni sul satellite per triggerare
# notifiche WebSocket real-time

CANISTER_ID="uzt4z-lp777-77774-qaabq-cai"
COLLECTION="demo_collection"

echo "🚀 JUNO WEBSOCKET TEST"
echo "================================================"
echo ""
echo "Canister ID: $CANISTER_ID"
echo "Collection: $COLLECTION"
echo ""
echo "Assicurati che:"
echo "1. Il frontend WebSocket sia connesso (WEBSOCKET_TEST.html)"
echo "2. dfx sia in esecuzione (dfx start)"
echo ""

# Test 1: Creazione documento
echo "📝 Test 1: Creazione documento..."
TIMESTAMP=$(date +%s)
dfx canister call $CANISTER_ID set_doc "(record {
  collection = \"$COLLECTION\";
  key = \"test-$TIMESTAMP\";
  data = blob \"{\\\"message\\\":\\\"Hello WebSocket!\\\",\\\"timestamp\\\":$TIMESTAMP}\";
})" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Documento creato! Controlla il frontend per la notifica."
else
    echo "❌ Errore nella creazione"
fi

echo ""
sleep 2

# Test 2: Creazione multipla documents
echo "📝📝 Test 2: Creazione multipla documenti..."
for i in {1..3}; do
    TS=$(date +%s)
    dfx canister call $CANISTER_ID set_doc "(record {
      collection = \"$COLLECTION\";
      key = \"batch-$TS-$i\";
      data = blob \"{\\\"batch\\\":true,\\\"index\\\":$i}\";
    })" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Batch $i creato"
    fi
    sleep 0.5
done

echo ""
echo "📊 Test 3: Verifica WebSocket Stats..."
dfx canister call $CANISTER_ID ws_stats 2>/dev/null

echo ""
echo "================================================"
echo "✨ Test completati!"
echo ""
echo "Se il frontend WebSocket è connesso e sottoscritto"
echo "alla collection '$COLLECTION', dovresti aver ricevuto"
echo "4 notifiche real-time!"
echo ""
echo "Per testare ulteriormente:"
echo "  dfx canister call $CANISTER_ID set_doc '(record {collection = \"<collection>\"; key = \"<key>\"; data = blob \"{...}\"})'"
echo ""
