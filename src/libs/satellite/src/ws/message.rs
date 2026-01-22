//! # WebSocket message handling
//!
//! This module provides utilities for parsing and creating WebSocket messages
//! exchanged between clients and the Juno satellite.

use serde::{Deserialize, Serialize};
use std::string::String;

/// Represents a WebSocket message from client to server
#[derive(Debug, Clone, Deserialize)]
pub struct WsClientMessage {
    /// Command type (e.g., "subscribe", "unsubscribe", "ping")
    pub command: String,
    /// Optional list of collections for subscription commands
    #[serde(default)]
    pub collections: Option<Vec<String>>,
    /// Optional additional data
    #[serde(default)]
    pub data: Option<serde_json::Value>,
}

/// Represents a WebSocket message from server to client
#[derive(Debug, Clone, Serialize)]
pub struct WsServerMessage {
    /// Message type
    #[serde(rename = "type")]
    pub msg_type: String,
    /// Timestamp
    pub timestamp: u64,
    /// Optional payload
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payload: Option<serde_json::Value>,
}

/// Parse a raw WebSocket message from client
///
/// # Arguments
/// * `data` - Raw message bytes
///
/// # Returns
/// Parsed message or error
pub fn parse(data: &[u8]) -> Result<WsClientMessage, String> {
    let json_str = std::str::from_utf8(data)
        .map_err(|e| format!("Invalid UTF-8: {}", e))?;

    serde_json::from_str(json_str)
        .map_err(|e| format!("Invalid JSON: {}", e))
}

/// Create a pong response message
///
/// # Returns
/// Serialized pong message bytes
pub fn create_pong() -> Result<Vec<u8>, String> {
    let msg = WsServerMessage {
        msg_type: "pong".to_string(),
        timestamp: ic_cdk::api::time(),
        payload: None,
    };

    serde_json::to_vec(&msg)
        .map_err(|e| format!("Failed to serialize pong: {}", e))
}

/// Create an error message
///
/// # Arguments
/// * `error` - Error message
///
/// # Returns
/// Serialized error message bytes
pub fn create_error(error: &str) -> Result<Vec<u8>, String> {
    let msg = WsServerMessage {
        msg_type: "error".to_string(),
        timestamp: ic_cdk::api::time(),
        payload: Some(serde_json::json!({ "error": error })),
    };

    serde_json::to_vec(&msg)
        .map_err(|e| format!("Failed to serialize error: {}", e))
}

/// Create a welcome message sent on connection
///
/// # Arguments
/// * `client_key` - The client's unique key
///
/// # Returns
/// Serialized welcome message bytes
pub fn create_welcome(client_key: &str) -> Result<Vec<u8>, String> {
    let msg = WsServerMessage {
        msg_type: "welcome".to_string(),
        timestamp: ic_cdk::api::time(),
        payload: Some(serde_json::json!({
            "client_key": client_key,
            "server": "Juno Satellite WebSocket",
            "version": "1.0.0"
        })),
    };

    serde_json::to_vec(&msg)
        .map_err(|e| format!("Failed to serialize welcome: {}", e))
}
