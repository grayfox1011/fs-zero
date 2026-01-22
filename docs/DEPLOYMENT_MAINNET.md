# Juno WebSocket - Mainnet Deployment Guide

## 📋 Test Completati con Successo

### ✅ Componenti Verificati

1. **WebSocket Gateway Locale**
   - Container Docker: `juno-ws-gateway` attivo su `ws://localhost:8080`
   - Gateway ID: `k4prv-2plrg-jtznn-vvrjq-ybdxf-ybb43-pgjkk-ib7fr-n2gg6-kbo6c-gqe`

2. **Satellite Canister (Local)**
   - Canister ID: `uzt4z-lp777-77774-qaabq-cai`
   - WASM: `target/wasm32-unknown-unknown/release/satellite.wasm` (6.1 MB)
   - WebSocket Gateway URL: `ws://localhost:8080`

3. **Funzioni WebSocket Verificate**
   ```bash
   # Gateway URL
   dfx canister call satellite ws_get_gateway_url
   # Output: ("ws://localhost:8080")

   # Stats (nessun client connesso)
   dfx canister call satellite ws_stats
   # Output: (vec {})
   ```

## 🚀 Deploy in Mainnet

### 1. Preparazione

```bash
# Build WASM per produzione
RUSTFLAGS='--cfg getrandom_backend="custom"' cargo build --release --target wasm32-unknown-unknown -p satellite

# Il WASM è pronto in:
# target/wasm32-unknown-unknown/release/satellite.wasm
```

### 2. Deploy con Juno CLI

```bash
# Installa Juno CLI se non l'hai già
npm install -g @junobuild/cli

# Deploy in mainnet
juno deploy --production

# Oppure deploy su un satellite specifico
juno satellite deploy <your-satellite-id>
```

### 3. Deploy Manuale con dfx

```bash
# Crea il canister in mainnet
dfx deploy --network ic satellite

# Oppure specificando il WASM
dfx deploy --network ic --wasm target/wasm32-unknown-unknown/release/satellite.wasm satellite
```

### 4. Configurazione WebSocket Gateway per Mainnet

Per la mainnet, devi usare un gateway pubblico:

**Opzione A: Gateway Pubblico Omnia**
```rust
// Nel tuo codice satellite, cambia il gateway URL:
pub fn ws_get_gateway_url() -> String {
    "wss://ws.omnia-network.ic0.app".to_string()
}
```

**Opzione B: Deploy proprio Gateway**
```bash
# Deploy del WebSocket Gateway canister
# Segui le istruzioni su: https://omnia.network/

# Gateway Principal da configurare nel satellite
```

### 5. Configurazione Collections (Required)

Prima di poter scrivere dati, configura le collections:

```bash
# Configura collection per demo
dfx canister call <satellite-id> set_rule '(variant {DbConfig}, "demo_collection", record {read = variant {Public}; write = variant {Public}; max_size = null; max_capacity = null})'
```

## 📊 Architettura WebSocket Integrata

### Schema dei Messaggi

```rust
// NotificationMessage (serializzato con Candid)
pub struct NotificationMessage {
    pub type_: String,        // "doc_set", "doc_deleted", etc.
    pub collection: String,    // nome collection
    pub key: String,          // chiave documento
    pub caller: Principal,    // principal che ha fatto la modifica
    pub timestamp: u64,       // timestamp in nanosecondi
}
```

### Broadcast Automatico

Quando un documento viene modificato o eliminato, il satellite invia automaticamente notifiche ai client WebSocket connessi che sono sottoscritti alla collection.

## 🧪 Test in Produzione

### 1. Verifica Deploy

```bash
# Controlla che il canister sia attivo
dfx canister --network ic call <satellite-id> ws_get_gateway_url

# Dovresti vedere: ("wss://ws.omnia-network.ic0.app")
```

### 2. Test Client WebSocket

```javascript
// Frontend example per mainnet
const junoWs = new JunoWebSocket({
  canisterId: '<your-satellite-id>',
  gatewayUrl: 'wss://ws.omnia-network.ic0.app'
});

// Sottoscrivi alle modifiche
junoWs.subscribe('demo_collection', (notification) => {
  console.log('Dato modificato:', notification);
  // Aggiorna UI
});
```

### 3. Test Operazioni Database

```bash
# Crea documento (triggererà notifica WebSocket)
dfx canister --network ic call <satellite-id> set_doc \
  '("demo_collection", "test-mainnet", record {data = blob "{\"msg\":\"Hello Mainnet!\"}"})'

# I client WebSocket connessi riceveranno la notifica in real-time!
```

## 📝 Files Modificati

1. **src/libs/satellite/src/ws/mod.rs** - Modulo WebSocket semplificato
2. **src/libs/satellite/src/lib.rs** - Funzioni WebSocket esposte
3. **src/libs/satellite/src/memory/lifecycle.rs** - Init WebSocket
4. **Cargo.toml** - ic-cdk-timers v1.0.0
5. **packages/ic-websocket-cdk/** - Fix async closure per ic-cdk-timers v1.0

## 🔧 Troubleshooting

### Errori Comuni

1. **"Collection not found"**
   - Soluzione: Configura la collection con `set_rule` prima di scrivere dati

2. **"WebSocket gateway not reachable"**
   - Local: Verifica che `docker ps` mostri `juno-ws-gateway`
   - Mainnet: Verifica che l'URL del gateway sia corretto

3. **"No notifications received"**
   - Verifica che il client sia sottoscritto alla collection corretta
   - Controlla `ws_stats` per vedere i client connessi

## 🎯 Prossimi Passi

1. **Deploy Mainnet**
   ```bash
   juno deploy --production
   ```

2. **Configura Collections**
   ```bash
   juno satellite deploy <satellite-id>
   juno collection create <collection-name>
   ```

3. **Integra nel Frontend**
   - Installa il SDK WebSocket Juno
   - Sottoscrivi alle collections
   - Aggiorna la UI in real-time

4. **Monitoraggio**
   - Usa `juno satellite logs` per vedere i log WebSocket
   - Monitora `ws_stats` per i client connessi

## 📚 Risorse

- [Juno Documentation](https://juno.build)
- [IC WebSocket Docs](https://docs.internetcomputer.org/docs/building-apps/advanced-features/websockets)
- [Omnia Network](https://omnia.network/)

---

**Creato:** 2025-01-20
**Satellite WASM:** 6.1 MB (con supporto WebSocket)
**Stato:** ✅ Ready for Mainnet Deployment
