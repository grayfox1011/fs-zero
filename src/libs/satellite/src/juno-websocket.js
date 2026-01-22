/**
 * Juno WebSocket SDK
 *
 * Provides real-time push notifications for Juno Satellite using IC WebSockets.
 *
 * @example
 * ```javascript
 * import { JunoWebSocket } from './juno-websocket.js';
 *
 * const junoWs = new JunoWebSocket({
 *   canisterId: 'your-canister-id',
 *   gatewayUrl: 'wss://ws.omnia.network'
 * });
 *
 * // Subscribe to document changes in a collection
 * const unsubscribe = junoWs.subscribe('users', (notification) => {
 *   console.log('User data changed:', notification);
 * });
 *
 * // Later: unsubscribe
 * unsubscribe();
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * @typedef {Object} JunoWsConfig
 * @property {string} canisterId - The Juno satellite canister ID
 * @property {string} [gatewayUrl] - WebSocket gateway URL (default: wss://ws.omnia.network)
 * @property {number} [reconnectInterval] - Reconnection interval in ms (default: 5000)
 * @property {number} [heartbeatInterval] - Heartbeat interval in ms (default: 30000)
 * @property {boolean} [autoConnect] - Auto-connect on initialization (default: true)
 */

/**
 * @typedef {Object} NotificationMessage
 * @property {string} type - Notification type (e.g., "doc_set", "doc_deleted")
 * @property {string} collection - Collection name
 * @property {string} key - Document/asset key
 * @property {string} caller - Principal that made the change
 * @property {number} timestamp - Unix timestamp (nanoseconds)
 * @property {*} [data] - Optional additional data
 */

// ============================================================================
// JunoWebSocket Class
// ============================================================================

export class JunoWebSocket {
  /**
   * Create a new Juno WebSocket connection
   * @param {JunoWsConfig} config - Configuration options
   */
  constructor(config) {
    /** @private */
    this.config = {
      gatewayUrl: config.gatewayUrl || 'wss://ws.omnia-network.ic0.app',
      canisterId: config.canisterId,
      reconnectInterval: config.reconnectInterval || 5000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      autoConnect: config.autoConnect !== false,
    };

    /** @private {WebSocket|null} */
    this.ws = null;

    /** @private {boolean} */
    this.isConnected = false;

    /** @private {Map<string, Set<Function>>} */
    this.subscriptions = new Map();

    /** @private {string} */
    this.clientKey = this.generateClientKey();

    /** @private {number|null} */
    this.heartbeatTimer = null;

    /** @private {number|null} */
    this.reconnectTimer = null;

    // Auto-connect if enabled
    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the WebSocket gateway
   * @public
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('[JunoWS] Already connected');
      return;
    }

    console.log('[JunoWS] Connecting to', this.config.gatewayUrl);

    try {
      this.ws = new WebSocket(this.config.gatewayUrl);

      this.ws.onopen = () => {
        this.handleOpen();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.handleClose();
      };

      this.ws.onerror = (error) => {
        this.handleError(error);
      };
    } catch (error) {
      console.error('[JunoWS] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket gateway
   * @public
   */
  disconnect() {
    console.log('[JunoWS] Disconnecting');

    this.clearHeartbeat();
    this.clearReconnect();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  /**
   * Subscribe to notifications for a specific collection
   * @param {string} collection - Collection name
   * @param {function(NotificationMessage): void} callback - Callback function
   * @returns {function(): void} Unsubscribe function
   * @public
   */
  subscribe(collection, callback) {
    if (!this.subscriptions.has(collection)) {
      this.subscriptions.set(collection, new Set());
    }

    this.subscriptions.get(collection).add(callback);

    // Send subscription message to server
    this.sendSubscribe([collection]);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(collection, callback);
    };
  }

  /**
   * Unsubscribe from notifications for a specific collection
   * @param {string} collection - Collection name
   * @param {function(NotificationMessage): void} callback - Callback function to remove
   * @public
   */
  unsubscribe(collection, callback) {
    const callbacks = this.subscriptions.get(collection);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(collection);
        this.sendUnsubscribe([collection]);
      }
    }
  }

  /**
   * Get current connection status
   * @returns {boolean}
   * @public
  */
  isConnectionOpen() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Handle WebSocket connection open
   * @private
   */
  handleOpen() {
    console.log('[JunoWS] Connected');
    this.isConnected = true;
    this.clearReconnect();

    // Send handshake message
    this.sendMessage({
      type: 'open',
      clientKey: this.clientKey,
      canisterId: this.config.canisterId,
    });

    // Start heartbeat
    this.startHeartbeat();

    // Emit custom event
    window.dispatchEvent(new CustomEvent('junows:connected', {
      detail: { clientKey: this.clientKey }
    }));

    // Resubscribe to all collections
    const collections = Array.from(this.subscriptions.keys());
    if (collections.length > 0) {
      this.sendSubscribe(collections);
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {string|ArrayBuffer} data - Message data
   * @private
   */
  handleMessage(data) {
    try {
      let message;

      if (typeof data === 'string') {
        message = JSON.parse(data);
      } else {
        const text = new TextDecoder().decode(data);
        message = JSON.parse(text);
      }

      this.processMessage(message);
    } catch (error) {
      console.error('[JunoWS] Failed to parse message:', error);
    }
  }

  /**
   * Process a parsed message
   * @param {*} message - Parsed message object
   * @private
   */
  processMessage(message) {
    // Handle different message types
    switch (message.type) {
      case 'welcome':
        console.log('[JunoWS] Welcome message received');
        break;

      case 'pong':
        // Heartbeat response - no action needed
        break;

      case 'doc_set':
      case 'doc_deleted':
      case 'asset_uploaded':
      case 'asset_deleted':
        this.notifySubscribers(message);
        break;

      case 'error':
        console.error('[JunoWS] Server error:', message.payload?.error);
        window.dispatchEvent(new CustomEvent('junows:error', {
          detail: { error: message.payload?.error }
        }));
        break;

      default:
        console.log('[JunoWS] Unknown message type:', message.type);
    }
  }

  /**
   * Notify subscribers of a notification
   * @param {NotificationMessage} notification - Notification message
   * @private
   */
  notifySubscribers(notification) {
    const callbacks = this.subscriptions.get(notification.collection);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(notification);
        } catch (error) {
          console.error('[JunoWS] Callback error:', error);
        }
      });
    }

    // Also emit global event
    window.dispatchEvent(new CustomEvent('junows:notification', {
      detail: notification
    }));
  }

  /**
   * Handle WebSocket connection close
   * @private
   */
  handleClose() {
    console.log('[JunoWS] Disconnected');
    this.isConnected = false;
    this.clearHeartbeat();

    window.dispatchEvent(new Event('junows:disconnected'));

    // Schedule reconnection
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error
   * @param {*} error - Error object
   * @private
   */
  handleError(error) {
    console.error('[JunoWS] WebSocket error:', error);
    window.dispatchEvent(new CustomEvent('junows:error', {
      detail: { error }
    }));
  }

  /**
   * Send a message to the server
   * @param {*} message - Message object to send
   * @private
   */
  sendMessage(message) {
    if (this.isConnectionOpen()) {
      const data = JSON.stringify(message);
      this.ws.send(data);
    } else {
      console.warn('[JunoWS] Cannot send message: not connected');
    }
  }

  /**
   * Send subscription message
   * @param {string[]} collections - Collections to subscribe to
   * @private
   */
  sendSubscribe(collections) {
    this.sendMessage({
      command: 'subscribe',
      collections: collections
    });
  }

  /**
   * Send unsubscribe message
   * @param {string[]} collections - Collections to unsubscribe from
   * @private
   */
  sendUnsubscribe(collections) {
    this.sendMessage({
      command: 'unsubscribe',
      collections: collections
    });
  }

  /**
   * Start heartbeat timer
   * @private
   */
  startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnectionOpen()) {
        this.sendMessage({ command: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear heartbeat timer
   * @private
   */
  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   * @private
   */
  scheduleReconnect() {
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      console.log('[JunoWS] Reconnecting...');
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * Clear reconnection timer
   * @private
   */
  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Generate a unique client key
   * @returns {string}
   * @private
   */
  generateClientKey() {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a Juno WebSocket connection with simplified API
 * @param {string} canisterId - The Juno satellite canister ID
 * @param {JunoWsConfig} [options] - Additional options
 * @returns {JunoWebSocket}
 * @example
 * ```javascript
 * const junoWs = createJunoWebSocket('your-canister-id');
 * junoWs.subscribe('users', (notif) => console.log(notif));
 * ```
 */
export function createJunoWebSocket(canisterId, options = {}) {
  return new JunoWebSocket({
    canisterId,
    ...options
  });
}

/**
 * React hook for Juno WebSocket (if using React)
 * @param {string} canisterId - The Juno satellite canister ID
 * @param {JunoWsConfig} [options] - Additional options
 * @returns {{ junoWs: JunoWebSocket|null, isConnected: boolean, subscribe: function }}
 * @example
 * ```javascript
 * function MyComponent() {
 *   const { junoWs, isConnected, subscribe } = useJunoWebSocket('your-canister-id');
 *
 *   useEffect(() => {
 *     const unsubscribe = subscribe('users', (notif) => {
 *       console.log('Notification:', notif);
 *     });
 *     return unsubscribe;
 *   }, [subscribe]);
 *
 *   return <div>{isConnected ? 'Connected' : 'Connecting...'}</div>;
 * }
 * ```
 */
export function useJunoWebSocket(canisterId, options = {}) {
  // This would typically be used with React
  // For now, return a placeholder
  const junoWs = new JunoWebSocket({ canisterId, ...options });

  return {
    junoWs,
    isConnected: junoWs.isConnectionOpen(),
    subscribe: (collection, callback) => junoWs.subscribe(collection, callback)
  };
}

// ============================================================================
// Export
// ============================================================================

export default JunoWebSocket;
