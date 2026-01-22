//! # Juno WebSocket Module
//!
//! WebSocket implementation for Juno using ic-websocket-cdk v0.4+
//!
//! This module provides real-time push notifications for document and asset changes.

use crate::types::hooks::NotificationMessage;
use candid::Principal;
use ic_websocket_cdk::{
    OnCloseCallbackArgs, OnMessageCallbackArgs, OnOpenCallbackArgs, ClientPrincipal, WsHandlers,
    WsInitParams,
};
use std::cell::RefCell;
use std::collections::HashMap;

/// Connected clients: principal -> subscriptions
thread_local! {
    static SUBSCRIBERS: RefCell<HashMap<Principal, Vec<String>>> = RefCell::new(HashMap::new());
    static CDK_INITIALIZED: RefCell<bool> = RefCell::new(false);
}

/// Callback handlers for WebSocket events
mod handlers {
    use super::*;
    use ic_cdk::println;

    pub fn on_open(args: OnOpenCallbackArgs) {
        let client_principal = args.client_principal;

        SUBSCRIBERS.with(|subs| {
            subs.borrow_mut()
                .entry(client_principal)
                .or_insert_with(Vec::new);
        });

        println!("✅ WebSocket opened: {}", client_principal.to_text());
    }

    pub fn on_message(args: OnMessageCallbackArgs) {
        let client_principal = args.client_principal;
        let data = args.message;

        // Simple message parsing for subscribe/unsubscribe
        if let Ok(text) = String::from_utf8(data) {
            println!("📨 WebSocket message from {}: {}", client_principal.to_text(), text);

            if text.starts_with("subscribe:") {
                let collection = text.strip_prefix("subscribe:").unwrap_or("");
                subscribe(client_principal, collection.to_string());
            } else if text.starts_with("unsubscribe:") {
                let collection = text.strip_prefix("unsubscribe:").unwrap_or("");
                unsubscribe(client_principal, collection.to_string());
            }
        }
    }

    pub fn on_close(args: OnCloseCallbackArgs) {
        let client_principal = args.client_principal;

        SUBSCRIBERS.with(|subs| {
            subs.borrow_mut().remove(&client_principal);
        });

        println!("🔌 WebSocket closed: {}", client_principal.to_text());
    }

    fn subscribe(client_principal: Principal, collection: String) {
        SUBSCRIBERS.with(|subs| {
            if let Some(subs_list) = subs.borrow_mut().get_mut(&client_principal) {
                if !subs_list.contains(&collection) {
                    println!("📝 {} subscribed to {}", client_principal.to_text(), collection);
                    subs_list.push(collection);
                }
            }
        });
    }

    fn unsubscribe(client_principal: Principal, collection: String) {
        SUBSCRIBERS.with(|subs| {
            if let Some(subs_list) = subs.borrow_mut().get_mut(&client_principal) {
                subs_list.retain(|c| c != &collection);
                println!("🚫 {} unsubscribed from {}", client_principal.to_text(), collection);
            }
        });
    }
}

/// Initialize the WebSocket subsystem with ic-websocket-cdk
pub fn init() {
    CDK_INITIALIZED.with_borrow(|initialized| {
        if *initialized {
            return;
        }
    });

    // Create WebSocket handlers
    let ws_handlers = WsHandlers {
        on_open: Some(handlers::on_open),
        on_message: Some(handlers::on_message),
        on_close: Some(handlers::on_close),
    };

    // Initialize with parameters
    let params = WsInitParams::new(ws_handlers)
        .with_max_number_of_returned_messages(100)
        .with_send_ack_interval_ms(300_000); // 5 minutes

    ic_websocket_cdk::init(params);

    CDK_INITIALIZED.with_borrow_mut(|v| *v = true);

    ic_cdk::println!("✅ WebSocket CDK initialized");
}

/// Broadcast a notification to all subscribed clients
pub fn broadcast(notification: NotificationMessage) {
    let collection = notification.collection.clone();

    SUBSCRIBERS.with(|subs| {
        let subs = subs.borrow();
        if subs.is_empty() {
            return;
        }

        // Find clients subscribed to this collection
        let target_principals: Vec<_> = subs
            .iter()
            .filter(|(_, collections)| collections.is_empty() || collections.contains(&collection))
            .map(|(principal, _)| *principal)
            .collect();

        if target_principals.is_empty() {
            ic_cdk::println!("📭 No subscribers for collection: {}", collection);
            return;
        }

        ic_cdk::println!(
            "📢 Broadcasting to {} clients (collection: {})",
            target_principals.len(),
            collection
        );

        // Serialize and send notification using Candid encoding
        if let Ok(data) = candid::encode_one(&notification) {
            for principal in target_principals {
                match ic_websocket_cdk::send(principal, data.clone()) {
                    Ok(_) => ic_cdk::println!("📤 Sent to {}", principal.to_text()),
                    Err(e) => ic_cdk::println!("❌ Failed to send to {}: {:?}", principal.to_text(), e),
                }
            }
        } else {
            ic_cdk::println!("❌ Failed to serialize notification");
        }
    });
}

/// Get the number of connected clients
pub fn connected_client_count() -> usize {
    SUBSCRIBERS.with(|subs| subs.borrow().len())
}

/// Get information about all connected clients
pub fn connected_clients_info() -> Vec<(String, String, usize)> {
    SUBSCRIBERS.with(|subs| {
        subs.borrow()
            .iter()
            .map(|(principal, collections)| {
                (
                    principal.to_text(),
                    principal.to_text(),
                    collections.len(),
                )
            })
            .collect()
    })
}
