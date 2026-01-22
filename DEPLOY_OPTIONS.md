# Opzioni per Deploy su Mainnet

## Problema
Principal del controller: `l7qnx-ad7ah-uzl47-egp4j-tje2l-x2te5-he2yk-uajay-zydhw-suwcv-wae`
Canister ID: `hamjq-waaaa-aaaal-asviq-cai`

L'identità con questo principal non è disponibile localmente (manca il JSON).

## Opzioni

### Opzione 1: Aggiungi Controller via Dashboard
1. Vai su https://dashboard.internetcomputer.org/satellite/hamjq-waaaa-aaaal-asviq-cai
2. Aggiungi il principal corrente come controller:
   ```
   ozifh-viclr-rmkl3-ziput-fee7k-oyui4-parjq-iqfn2-luzav-7nian-vqe
   ```
3. Esegui il deploy

### Opzione 2: Importa l'Identità Originale
Se hai il seed phrase o il backup dell'identità `l7qnx-ad7ah-uzl47-egp4j-tje2l-x2te5-he2yk-uajay-zydhw-suwcv-wae`:

```bash
# Crea nuova identità dal seed
dfx identity new mainnet-controller

# Importa la chiave (se hai il file PEM)
# Oppure usa il seed phrase durante la creazione
```

### Opzione 3: Deploy tramite Proxy (più complesso)
Usa un proxy canister per installare il WASM

### Opzione 4: Usa il frontend del canister (se abilitato)
Alcuni satelliti Juno hanno un pannello admin via web

## Soluzione Più Semplice: Opzione 1

Aggiungi il principal corrente (`ozifh-viclr...`) come controller del canister tramite:

1. **Dashboard IC**: https://dashboard.internetcomputer.org
2. **Oppure via dfx** (se sei ancora loggato con l'identità originale):

```bash
# Se puoi temporaneamente usare l'identità originale
dfx identity use <original-identity>
dfx canister --network ic update-settings hamjq-waaaa-aaaal-asviq-cai \
  --add-controller ozifh-viclr-rmkl3-ziput-fee7k-oyui4-parjq-iqfn2-luzav-7nian-vqe
```

Una volta aggiunto come controller, esegui:

```bash
./deploy_to_mainnet.sh
```

## Alternative: Deploy Manuale del WASM

Il file WASM è pronto in:
```
target/wasm32-unknown-unknown/release/satellite.wasm (6.1 MB)
```

Puoi caricarlo tramite qualsiasi tool che supporta l'IC management API.
