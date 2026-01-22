# Juno WebSocket Integration

## 🎯 Obiettivo

Trasformare Juno da un sistema di **polling** (che chiede ogni secondo "ci sono novità?") in un sistema **Real-Time Push** (che dice "tieni, ecco un aggiornamento!").

### Stato Attuale vs Stato Desiderato

| Aspect | Polling (Attuale) | WebSocket (Desiderato) |
|--------|-------------------|------------------------|
| **Latenza** | ~2 secondi | < 500ms |
| **Costo** | Brucia cicli inutilmente | Zero cicli quando idle |
| **Scalabilità** | Limitata | Eccellente |
| **User Experience** | Scadente | Stile Telegram/Firebase |

---

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    JUNO SATELLITE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐        ┌──────────────────────┐   │
│  │   HOOK ESISTENTI    │──┬──>   │  MODULO WEBSOCKET    │   │
│  │   (db.rs)           │  │     │  (ws/mod.rs)        │   │
│  │                     │  │     │                      │   │
│  │  on_set_doc()  ────┼──┘     │  broadcast()         │   │
│  │  on_delete_doc()    │        │  on_open()           │   │
│  │  on_upload_asset()  │        │  on_message()        │   │
│  │                     │        │  on_close()          │   │
│  └─────────────────────┘        └──────────────────────┘   │
│           ▲                              │                  │
│           │                              ▼                  │
│  Juno continua                   Client connessi           │
│  a funzionare                   ricevono notifiche         │
│  normalmente                     in real-time               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Struttura dei File

```
src/libs/satellite/
├── src/
│   ├── ws/
│   │   ├── mod.rs           # Modulo principale WebSocket
│   │   ├── gateway.rs       # Gestione gateway WebSocket
│   │   ├── client.rs        # Gestione client connessi
│   │   └── message.rs       # Gestione messaggi
│   ├── hooks/
│   │   ├── db.rs            # Hook del database + integrazione WebSocket
│   │   └── storage.rs       # Hook degli asset + integrazione WebSocket
│   ├── types.rs             # Tipi inclusa NotificationMessage
│   └── lib.rs               # Funzioni di export WebSocket
├── Cargo.toml               # Dipendenze con ic-websocket-cdk
└── satellite.did            # Interfaccia Candid con metodi WebSocket
```

---

## 🚀 Installazione e Configurazione

### 1. Abilitare il Feature WebSocket

Nel tuo `Cargo.toml`, aggiungi il feature `websocket`:

```toml
[dependencies]
junobuild-satellite = { version = "0.4", features = ["websocket"] }
```

Oppure, se stai sviluppando il satellite stesso:

```toml
[features]
websocket = ["ic-websocket-cdk"]
```

### 2. Deploy del Satellite

```bash
# Build con feature WebSocket abilitato
cargo build --features websocket

# Deploy su IC
dfx deploy --argument "(<init_args>)"
```

---

## 💻 Frontend: Utilizzo del SDK

### Esempio Base - Vanilla JavaScript

```javascript
import { JunoWebSocket } from './juno-websocket.js';

// Crea connessione WebSocket
const junoWs = new JunoWebSocket({
  canisterId: 'your-satellite-canister-id',
  gatewayUrl: 'wss://ws.omnia-network.ic0.app' // URL gateway pubblico
});

// Ascolta eventi di connessione
window.addEventListener('junows:connected', () => {
  console.log('WebSocket connesso!');
});

window.addEventListener('junows:disconnected', () => {
  console.log('WebSocket disconnesso');
});

window.addEventListener('junows:error', (event) => {
  console.error('Errore WebSocket:', event.detail.error);
});

// Sottoscrivi a modifiche documenti
const unsubscribe = junoWs.subscribe('users', (notification) => {
  console.log('Dato modificato:', notification);
  // Aggiorna la UI
  updateUI(notification);
});

// Per disiscriverti:
// unsubscribe();
```

### Esempio - React

```jsx
import { useEffect, useState } from 'react';
import { JunoWebSocket } from './juno-websocket';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [junoWs, setJunoWs] = useState(null);

  useEffect(() => {
    // Crea connessione WebSocket
    const ws = new JunoWebSocket({
      canisterId: process.env.CANISTER_ID,
      gatewayUrl: 'wss://ws.omnia-network.ic0.app'
    });
    setJunoWs(ws);

    // Sottoscrivi a modifiche utenti
    const unsubscribe = ws.subscribe('users', (notification) => {
      if (notification.type === 'doc_set') {
        // Ricarica i dati quando cambiano
        loadUserData(notification.key);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      ws.disconnect();
    };
  }, []);

  return (
    <div>
      {user ? <UserProfile data={user} /> : <Loading />}
    </div>
  );
}
```

### Esempio - Vue

```vue
<template>
  <div>
    <p v-if="connected">🟢 Connesso</p>
    <p v-else>🔴 Disconnesso</p>
    <UserList :users="users" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { JunoWebSocket } from './juno-websocket';

const users = ref([]);
const connected = ref(false);
let junoWs = null;
let unsubscribe = null;

onMounted(() => {
  junoWs = new JunoWebSocket({
    canisterId: import.meta.env.CANISTER_ID
  });

  // Ascolta stato connessione
  window.addEventListener('junows:connected', () => {
    connected.value = true;
  });
  window.addEventListener('junows:disconnected', () => {
    connected.value = false;
  });

  // Sottoscrivi modifiche
  unsubscribe = junoWs.subscribe('users', (notification) => {
    loadUsers();
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  if (junoWs) junoWs.disconnect();
});
</script>
```

---

## 🔧 API Reference

### JunoWebSocket

#### Constructor

```javascript
new JunoWebSocket(config)
```

**Parametri:**
- `config.canisterId` (string, obbligatorio) - ID del canister satellite
- `config.gatewayUrl` (string, opzionale) - URL del gateway WebSocket (default: `wss://ws.omnia-network.ic0.app`)
- `config.reconnectInterval` (number, opzionale) - Intervallo riconnessione in ms (default: 5000)
- `config.heartbeatInterval` (number, opzionale) - Intervallo heartbeat in ms (default: 30000)
- `config.autoConnect` (boolean, opzionale) - Connessione automatica (default: true)

#### Metodi

##### `subscribe(collection, callback)`

Sottoscrivi a notifiche per una collection specifica.

**Parametri:**
- `collection` (string) - Nome della collection
- `callback` (function) - Funzione chiamata quando arriva una notifica

**Ritorna:** Funzione di unsubscribe

```javascript
const unsubscribe = junoWs.subscribe('users', (notification) => {
  console.log(notification.type);     // "doc_set" o "doc_deleted"
  console.log(notification.collection); // "users"
  console.log(notification.key);      // Chiave del documento
  console.log(notification.caller);   // Principal dell'utente
  console.log(notification.timestamp); // Timestamp in nanosecondi
});

// Disiscriviti
unsubscribe();
```

##### `unsubscribe(collection, callback)`

Disiscriviti da una collection specifica.

##### `connect()`

Connetti manualmente al gateway WebSocket.

##### `disconnect()`

Disconnetti dal gateway WebSocket.

##### `isConnectionOpen()`

Verifica se la connessione è attiva.

**Ritorna:** boolean

---

### Tipi di Notifica

#### `NotificationMessage`

```typescript
interface NotificationMessage {
  type: 'doc_set' | 'doc_deleted' | 'asset_uploaded' | 'asset_deleted';
  collection: string;
  key: string;
  caller: string;  // Principal
  timestamp: number;  // Nanosecondi
  data?: any;  // Dati opzionali
}
```

---

## 🧪 Testing

### Test Manuale - Due Browser

1. Apri due browser/window
2. In entrambi, connettiti allo stesso satellite
3. In un browser, modifica un documento
4. Nell'altro browser, vedrai la notifica in real-time!

### Esempio di Test

```html
<!DOCTYPE html>
<html>
<head>
  <title>Juno WebSocket Test</title>
</head>
<body>
  <h1>WebSocket Test</h1>
  <div id="status"></div>
  <div id="notifications"></div>

  <button onclick="testSet()">Test set_doc</button>
  <button onclick="testDelete()">Test del_doc</button>

  <script type="module">
    import { JunoWebSocket } from './juno-websocket.js';

    const junoWs = new JunoWebSocket({
      canisterId: 'your-canister-id'
    });

    // Mostra stato
    window.addEventListener('junows:connected', () => {
      document.getElementById('status').textContent = '🟢 Connesso';
    });

    // Sottoscrivi notifiche
    junoWs.subscribe('test', (notif) => {
      const div = document.createElement('div');
      div.textContent = `${notif.type}: ${notif.key}`;
      document.getElementById('notifications').prepend(div);
    });

    // Funzioni di test
    window.testSet = async () => {
      await junoWs.api.set_doc('test', 'key1', { data: 'test' });
    };

    window.testDelete = async () => {
      await junoWs.api.del_doc('test', 'key1', {});
    };
  </script>
</body>
</html>
```

---

## ⚡ Performance

### Confronto Polling vs WebSocket

| Metrica | Polling (1s) | Polling (5s) | WebSocket |
|---------|-------------|-------------|-----------|
| **Latenza max** | 1000ms | 5000ms | < 500ms |
| **Cicli/ora (idle)** | ~3600 | ~720 | 0 |
| **Cicli/ora (attivo)** | ~3600 | ~720 | Variabile |
| **Richieste/ora** | 3600 | 720 | Minime |

### Risparmio dei Cicli

Con 100 utenti connessi:

- **Polling (5s)**: ~72,000 cicli/ora
- **WebSocket**: ~100-500 cicli/ora (solo quando ci sono modifiche reali)

**Risparmio: ~99%**

---

## 🔒 Sicurezza

### Autenticazione

Le connessioni WebSocket attraverso il gateway Omnia sono autenticate automaticamente usando l'identity del caller.

### Autorizzazione

Gli hook di Juno verificano automaticamente i permessi prima di broadcastare le notifiche. Solo gli utenti autorizzati ricevono notifiche per le collection a cui hanno accesso.

---

## 🐛 Troubleshooting

### "Cannot connect to WebSocket"

1. Verifica che il gateway URL sia corretto
2. Verifica che il satellite abbia il feature WebSocket abilitato
3. Controlla la console browser per errori

### "Not receiving notifications"

1. Verifica di aver sottoscritto alla collection corretta
2. Verifica che il satellite stia usando le funzioni `*_with_websocket`
3. Controlla i log del satellite per errori

### "Reconnection loop"

1. Verifica che il satellite sia deployato e accessibile
2. Aumenta l'intervallo di riconnessione
3. Controlla la rete locale

---

## 📚 Risorse

- [IC WebSocket Documentation](https://docs.internetcomputer.org/docs/building-apps/advanced-features/websockets)
- [Omnia Network](https://omnia.network/)
- [Juno Documentation](https://juno.build/)

---

## 🤝 Contribuire

Per contribuire all'integrazione WebSocket di Juno:

1. Fork il repository
2. Crea un branch feature
3. Commit le tue modifiche
4. Push al branch
5. Apri una Pull Request

---

## 📄 License

MIT

---

**Grazie al Team Cinese per l'architettura chirurgica!** 🙏

```text
Il Modulo (ws/mod.rs): È il MOTORE.
Gli Hook (hooks/db.rs): Sono l'INTERRUTTORE.
Insieme: Un sistema Real-Time Push perfetto.
```
