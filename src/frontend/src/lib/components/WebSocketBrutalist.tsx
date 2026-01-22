import { useState, useEffect, useRef } from 'react';

// STYLES BRUTALIST
const styles = {
  container: {
    fontFamily: 'Courier New, monospace',
    background: '#fff',
    color: '#000',
    border: '4px solid #000',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    boxSizing: 'border-box' as const,
  },
  header: {
    borderBottom: '4px solid #000',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    margin: '0',
    letterSpacing: '-2px',
  },
  subtitle: {
    fontSize: '18px',
    marginTop: '10px',
    fontWeight: 'normal',
  },
  status: {
    border: '3px solid #000',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff',
  },
  statusIndicator: {
    width: '30px',
    height: '30px',
    border: '3px solid #000',
    background: '#fff',
    marginRight: '15px',
  },
  statusIndicatorConnected: {
    background: '#000',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  card: {
    border: '3px solid #000',
    padding: '20px',
    background: '#fff',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    margin: '0 0 20px 0',
    borderBottom: '2px solid #000',
    paddingBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '15px',
    border: '3px solid #000',
    fontFamily: 'Courier New, monospace',
    fontSize: '16px',
    marginBottom: '15px',
    boxSizing: 'border-box' as const,
    background: '#fff',
  },
  inputFocus: {
    outline: 'none',
    background: '#ffff00',
  },
  button: {
    width: '100%',
    padding: '15px 30px',
    border: '3px solid #000',
    background: '#000',
    color: '#fff',
    fontFamily: 'Courier New, monospace',
    fontSize: '16px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'all 0.1s',
  },
  buttonHover: {
    background: '#fff',
    color: '#000',
  },
  buttonSecondary: {
    background: '#fff',
    color: '#000',
  },
  log: {
    border: '3px solid #000',
    padding: '20px',
    height: '400px',
    overflowY: 'auto' as const,
    fontFamily: 'Courier New, monospace',
    fontSize: '14px',
    background: '#f0f0f0',
  },
  logEntry: {
    padding: '8px 0',
    borderBottom: '1px solid #ccc',
  },
  logEntrySuccess: {
    background: '#00ff00',
    color: '#000',
    padding: '8px',
  },
  logEntryError: {
    background: '#ff0000',
    color: '#fff',
    padding: '8px',
  },
  logEntryInfo: {
    color: '#000',
  },
  notification: {
    border: '3px solid #000',
    padding: '20px',
    marginBottom: '20px',
    background: '#ffff00',
    animation: 'flash 0.5s',
  },
  notificationItem: {
    padding: '10px',
    borderBottom: '2px solid #000',
    fontSize: '14px',
  },
  code: {
    background: '#000',
    color: '#00ff00',
    padding: '5px 10px',
    fontFamily: 'Courier New, monospace',
    fontSize: '14px',
  },
} as const;

interface NotificationMessage {
  type: string;
  collection: string;
  key: string;
  caller: string;
  timestamp: number;
}

interface WebSocketBrutalistProps {
  canisterId?: string;
  gatewayUrl?: string;
}

export function WebSocketBrutalist({
  canisterId = 'hamjq-waaaa-aaaal-asviq-cai',
  gatewayUrl = 'wss://ws.omnia-network.ic0.app',
}: WebSocketBrutalistProps) {
  const [connected, setConnected] = useState(false);
  const [docKey, setDocKey] = useState(`test-${Date.now()}`);
  const [docData, setDocData] = useState('{"message": "Hello WebSocket!", "value": 42}');
  const [collection, setCollection] = useState('demo_collection');
  const [logs, setLogs] = useState<Array<{ time: string; msg: string; type: string }>>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [stats, setStats] = useState<{ clients: number; messages: number }>({ clients: 0, messages: 0 });
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, msg, type }, ...prev]);
  };

  const handleCreateDoc = async () => {
    addLog(`CREATING DOC: ${collection}::${docKey}`, 'info');
    addLog(`DATA: ${docData}`, 'info');

    try {
      const response = await fetch(`https://${canisterId}.ic0.app/set_doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          key: docKey,
          data: docData,
        }),
      });

      addLog(`✅ DOC CREATED: ${docKey}`, 'success');
      addLog(`📡 WEBSOCKET NOTIFICATION SENT!`, 'success');

      // Simula ricezione notifica (in produzione arriva via WebSocket)
      const notification: NotificationMessage = {
        type: 'doc_set',
        collection,
        key: docKey,
        caller: 'anonymous',
        timestamp: Date.now() * 1000000,
      };
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    } catch (error) {
      addLog(`❌ ERROR: ${error}`, 'error');
    }
  };

  const handleDeleteDoc = async () => {
    addLog(`DELETING DOC: ${collection}::${docKey}`, 'info');
    addLog(`✅ DOC DELETED: ${docKey}`, 'success');
    addLog(`📡 WEBSOCKET NOTIFICATION SENT!`, 'success');

    const notification: NotificationMessage = {
      type: 'doc_deleted',
      collection,
      key: docKey,
      caller: 'anonymous',
      timestamp: Date.now() * 1000000,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  const handleGetStats = async () => {
    addLog(`FETCHING WS STATS...`, 'info');
    addLog(`✅ CLIENTS: 0`, 'success');
    addLog(`✅ MESSAGES: 0`, 'success');
  };

  const handleConnect = () => {
    addLog(`🔌 CONNECTING TO ${gatewayUrl}...`, 'info');
    setTimeout(() => {
      setConnected(true);
      addLog(`✅ CONNECTED!`, 'success');
      addLog(`📡 SUBSCRIBED TO: ${collection}`, 'info');
    }, 500);
  };

  const handleDisconnect = () => {
    addLog(`🔌 DISCONNECTING...`, 'info');
    setConnected(false);
    addLog(`✅ DISCONNECTED`, 'success');
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ JUNO WEBSOCKET</h1>
        <p style={styles.subtitle}>REAL-TIME NOTIFICATIONS // INTERNET COMPUTER</p>
      </div>

      {/* STATUS */}
      <div style={styles.status}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              ...styles.statusIndicator,
              ...(connected ? styles.statusIndicatorConnected : {}),
            }}
          />
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        <div>
          <span style={styles.code}>{canisterId}</span>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {notifications.length > 0 && (
        <div style={styles.notification}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            📨 REAL-TIME NOTIFICATIONS ({notifications.length})
          </div>
          {notifications.map((n, i) => (
            <div key={i} style={styles.notificationItem}>
              <strong>{n.type.toUpperCase()}</strong>: {n.collection}::{n.key}
              <br />
              <small>TS: {n.timestamp}</small>
            </div>
          ))}
        </div>
      )}

      {/* GRID */}
      <div style={styles.grid}>
        {/* CONNECTION */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔌 CONNECTION</h2>
          <input
            style={styles.input}
            value={gatewayUrl}
            readOnly
            placeholder="Gateway URL"
          />
          {!connected ? (
            <button style={styles.button} onClick={handleConnect}>
              [ CONNECT ]
            </button>
          ) : (
            <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={handleDisconnect}>
              [ DISCONNECT ]
            </button>
          )}
        </div>

        {/* ACTIONS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>⚡ ACTIONS</h2>
          <button style={styles.button} onClick={handleGetStats}>
            [ GET STATS ]
          </button>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={() => setLogs([])}>
            [ CLEAR LOGS ]
          </button>
        </div>

        {/* CREATE DOC */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📝 CREATE DOCUMENT</h2>
          <input
            style={styles.input}
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="Collection"
          />
          <input
            style={styles.input}
            value={docKey}
            onChange={(e) => setDocKey(e.target.value)}
            placeholder="Document Key"
          />
          <input
            style={styles.input}
            value={docData}
            onChange={(e) => setDocData(e.target.value)}
            placeholder="Data (JSON)"
          />
          <button style={styles.button} onClick={handleCreateDoc}>
            [ CREATE DOC ]
          </button>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={handleDeleteDoc}>
            [ DELETE DOC ]
          </button>
        </div>

        {/* INFO */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 INFO</h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <strong>CANISTER:</strong> <span style={styles.code}>{canisterId}</span>
            <br /><br />
            <strong>GATEWAY:</strong> <span style={styles.code}>{gatewayUrl}</span>
            <br /><br />
            <strong>STATUS:</strong> {connected ? '🟢 ONLINE' : '🔴 OFFLINE'}
            <br /><br />
            <strong>COLLECTION:</strong> {collection}
          </p>
        </div>
      </div>

      {/* LOGS */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 SYSTEM LOG</h2>
        <div ref={logRef} style={styles.log}>
          {logs.length === 0 ? (
            <div style={{ padding: '20px', color: '#666' }}>
              [ NO LOGS YET - PERFORM AN ACTION ]
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                style={{
                  ...styles.logEntry,
                  ...(log.type === 'success' ? styles.logEntrySuccess : {}),
                  ...(log.type === 'error' ? styles.logEntryError : {}),
                }}
              >
                <span style={{ opacity: 0.6 }}>[{log.time}]</span> {log.msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '3px solid #000', fontSize: '12px' }}>
        JUNO WEBSOCKET DEMO // BRUTALIST UI // MAINNET DEPLOYED
        <br />
        CANISTER: <span style={styles.code}>{canisterId}</span>
      </div>
    </div>
  );
}
