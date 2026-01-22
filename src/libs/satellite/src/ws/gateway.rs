//! # WebSocket gateway configuration
//!
//! This module handles the configuration and management of the WebSocket gateway
//! that enables bidirectional communication between clients and the satellite.

use serde::{Deserialize, Serialize};
use std::cell::RefCell;

/// Gateway configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    /// Gateway principal ID
    pub gateway_principal: String,
    /// Gateway URL (for client connections)
    pub gateway_url: String,
    /// Whether to use the public Omnia gateway
    pub use_public_gateway: bool,
}

impl Default for GatewayConfig {
    fn default() -> Self {
        Self {
            gateway_principal: "k4prv-2plrg-jtznn-vvrjq-ybdxf-ybb43-pgjkk-ib7fr-n2gg6-kbo6c-gqe".to_string(), // Local gateway
            gateway_url: "ws://localhost:8080".to_string(),
            use_public_gateway: false,
        }
    }
}

/// Gateway manager for WebSocket connections
pub struct GatewayManager {
    config: RefCell<GatewayConfig>,
    is_initialized: RefCell<bool>,
}

impl GatewayManager {
    /// Create a new gateway manager with default configuration
    pub fn new() -> Self {
        Self {
            config: RefCell::new(GatewayConfig::default()),
            is_initialized: RefCell::new(false),
        }
    }

    /// Initialize the gateway connection
    ///
    /// This should be called during canister initialization.
    pub fn init(&self) {
        let config = self.config.borrow();

        ic_cdk::println!("🌐 Initializing WebSocket Gateway:");
        ic_cdk::println!("   Principal: {}", config.gateway_principal);
        ic_cdk::println!("   URL: {}", config.gateway_url);
        ic_cdk::println!("   Public Gateway: {}", config.use_public_gateway);

        // Initialize gateway connection using ic-websocket-cdk
        ic_websocket_cdk::ws_init(config.gateway_principal.parse().unwrap());

        *self.is_initialized.borrow_mut() = true;

        ic_cdk::println!("✅ WebSocket Gateway initialized");
    }

    /// Set custom gateway configuration
    ///
    /// # Arguments
    /// * `config` - Custom gateway configuration
    pub fn set_config(&self, config: GatewayConfig) {
        *self.config.borrow_mut() = config;
        ic_cdk::println!("⚙️ Gateway configuration updated");
    }

    /// Get the current gateway configuration
    pub fn get_config(&self) -> GatewayConfig {
        self.config.borrow().clone()
    }

    /// Get the gateway URL for client connections
    pub fn get_gateway_url(&self) -> String {
        self.config.borrow().gateway_url.clone()
    }

    /// Check if the gateway is initialized
    pub fn is_ready(&self) -> bool {
        *self.is_initialized.borrow()
    }

    /// Queue a message for a specific client
    ///
    /// # Arguments
    /// * `client_key` - Target client identifier
    /// * `data` - Message data to send
    ///
    /// # Returns
    /// `true` if message was queued successfully
    pub fn queue_message(&self, client_key: &str, data: Vec<u8>) -> bool {
        if !self.is_ready() {
            ic_cdk::println!("⚠️ Gateway not initialized, cannot queue message");
            return false;
        }

        // Queue message using ic-websocket-cdk
        ic_websocket_cdk::ws_queue_message(client_key, data);

        ic_cdk::println!("📤 Queued message for {} ({} bytes)", client_key, data.len());
        true
    }

    /// Broadcast a message to multiple clients
    ///
    /// # Arguments
    /// * `client_keys` - List of target client identifiers
    /// * `data` - Message data to send
    ///
    /// # Returns
    /// Number of clients the message was queued for
    pub fn broadcast(&self, client_keys: &[String], data: &[u8]) -> usize {
        if !self.is_ready() {
            ic_cdk::println!("⚠️ Gateway not initialized, cannot broadcast");
            return 0;
        }

        let data_vec = data.to_vec();
        let mut queued = 0;

        for client_key in client_keys {
            if self.queue_message(client_key, data_vec.clone()) {
                queued += 1;
            }
        }

        ic_cdk::println!("📢 Broadcasted to {} clients", queued);
        queued
    }
}

impl Default for GatewayManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Global gateway manager instance
thread_local! {
    static GATEWAY: GatewayManager = GatewayManager::new();
}

/// Initialize the global gateway manager
pub fn init_gateway() {
    GATEWAY.with(|gateway| gateway.init());
}

/// Get the gateway URL for client connections
pub fn get_gateway_url() -> String {
    GATEWAY.with(|gateway| gateway.get_gateway_url())
}

/// Queue a message for a specific client using the global gateway
pub fn queue_message(client_key: &str, data: Vec<u8>) -> bool {
    GATEWAY.with(|gateway| gateway.queue_message(client_key, data))
}

/// Broadcast a message to multiple clients using the global gateway
pub fn broadcast_messages(client_keys: &[String], data: &[u8]) -> usize {
    GATEWAY.with(|gateway| gateway.broadcast(client_keys, data))
}

/// Check if the gateway is ready
pub fn is_gateway_ready() -> bool {
    GATEWAY.with(|gateway| gateway.is_ready())
}
