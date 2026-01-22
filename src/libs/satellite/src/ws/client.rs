//! # WebSocket client management
//!
//! This module handles client connection tracking and session management
//! for WebSocket connections to the Juno satellite.

use std::cell::RefCell;
use std::collections::HashMap;

use super::ConnectedClient;

/// Client activity timeout in nanoseconds (5 minutes)
const CLIENT_TIMEOUT_NS: u64 = 5 * 60 * 1_000_000_000;

/// Stale client cleanup interval in nanoseconds (1 minute)
const CLEANUP_INTERVAL_NS: u64 = 60 * 1_000_000_000;

/// Client session data
#[derive(Clone, Debug)]
pub struct ClientSession {
    /// Unique client key
    pub client_key: String,
    /// Client principal
    pub principal: String,
    /// Connection timestamp
    pub connected_at: u64,
    /// Last activity timestamp
    pub last_activity: u64,
    /// Subscribed collections
    pub subscriptions: Vec<String>,
}

/// Client manager for tracking WebSocket connections
pub struct ClientManager {
    clients: RefCell<HashMap<String, ClientSession>>,
}

impl ClientManager {
    /// Create a new client manager
    pub fn new() -> Self {
        Self {
            clients: RefCell::new(HashMap::new()),
        }
    }

    /// Register a new client connection
    ///
    /// # Arguments
    /// * `client_key` - Unique identifier for the client
    /// * `principal` - The client's principal
    pub fn register(&self, client_key: String, principal: String) {
        let now = ic_cdk::api::time();

        let session = ClientSession {
            client_key: client_key.clone(),
            principal,
            connected_at: now,
            last_activity: now,
            subscriptions: Vec::new(),
        };

        self.clients.borrow_mut().insert(client_key.clone(), session);
        ic_cdk::println!("👤 Client registered: {}", client_key);
    }

    /// Update client activity timestamp
    ///
    /// # Arguments
    /// * `client_key` - Unique identifier for the client
    pub fn update_activity(&self, client_key: &str) {
        let now = ic_cdk::api::time();

        if let Some(session) = self.clients.borrow_mut().get_mut(client_key) {
            session.last_activity = now;
        }
    }

    /// Remove a client connection
    ///
    /// # Arguments
    /// * `client_key` - Unique identifier for the client
    pub fn remove(&self, client_key: &str) -> Option<ClientSession> {
        self.clients.borrow_mut().remove(client_key)
    }

    /// Get client session
    ///
    /// # Arguments
    /// * `client_key` - Unique identifier for the client
    pub fn get(&self, client_key: &str) -> Option<ClientSession> {
        self.clients.borrow().get(client_key).cloned()
    }

    /// Get all connected clients
    pub fn get_all(&self) -> Vec<ClientSession> {
        self.clients.borrow().values().cloned().collect()
    }

    /// Get clients subscribed to a specific collection
    ///
    /// # Arguments
    /// * `collection` - Collection name
    pub fn get_subscribers(&self, collection: &str) -> Vec<ClientSession> {
        self.clients
            .borrow()
            .values()
            .filter(|session| {
                session.subscriptions.is_empty() || session.subscriptions.contains(&collection.to_string())
            })
            .cloned()
            .collect()
    }

    /// Subscribe a client to collections
    ///
    /// # Arguments
    /// * `client_key` - Unique identifier for the client
    /// * `collections` - List of collection names
    pub fn subscribe(&self, client_key: &str, collections: Vec<String>) {
        if let Some(session) = self.clients.borrow_mut().get_mut(client_key) {
            for collection in &collections {
                if !session.subscriptions.contains(collection) {
                    session.subscriptions.push(collection.clone());
                }
            }
            ic_cdk::println!("📝 Client {} subscribed to: {:?}", client_key, collections);
        }
    }

    /// Unsubscribe a client from collections
    ///
    /// # Arguments
    /// * `client_key` - Unique identifier for the client
    /// * `collections` - List of collection names
    pub fn unsubscribe(&self, client_key: &str, collections: Vec<String>) {
        if let Some(session) = self.clients.borrow_mut().get_mut(client_key) {
            session.subscriptions.retain(|c| !collections.contains(c));
            ic_cdk::println!("🚫 Client {} unsubscribed from: {:?}", client_key, collections);
        }
    }

    /// Get the number of connected clients
    pub fn count(&self) -> usize {
        self.clients.borrow().len()
    }

    /// Clean up stale clients
    ///
    /// Removes clients that haven't been active for more than CLIENT_TIMEOUT_NS
    pub fn cleanup_stale(&self) -> usize {
        let now = ic_cdk::api::time();
        let mut clients = self.clients.borrow_mut();

        let stale_keys: Vec<String> = clients
            .iter()
            .filter(|(_, session)| {
                now.saturating_sub(session.last_activity) > CLIENT_TIMEOUT_NS
            })
            .map(|(key, _)| key.clone())
            .collect();

        for key in &stale_keys {
            clients.remove(key);
        }

        if !stale_keys.is_empty() {
            ic_cdk::println!("🧹 Cleaned up {} stale clients", stale_keys.len());
        }

        stale_keys.len()
    }

    /// Get client statistics
    pub fn stats(&self) -> ClientStats {
        let clients = self.clients.borrow();
        let now = ic_cdk::api::time();

        let total_subscriptions = clients.values().map(|c| c.subscriptions.len()).sum();

        let active_sessions = clients
            .values()
            .filter(|s| now.saturating_sub(s.last_activity) < CLIENT_TIMEOUT_NS)
            .count();

        ClientStats {
            total_clients: clients.len(),
            active_sessions,
            total_subscriptions,
        }
    }
}

impl Default for ClientManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Client statistics
#[derive(Debug, Clone)]
pub struct ClientStats {
    pub total_clients: usize,
    pub active_sessions: usize,
    pub total_subscriptions: usize,
}
