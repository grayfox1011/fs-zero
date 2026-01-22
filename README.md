# FS-Zero (File System Zero)

> **Zero Latency. Zero Censorship. Zero Central Points of Failure.**

[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange?logo=rust)](https://www.rust-lang.org/)
[![ICP](https://img.shields.io/badge/Internet__Computer-Canister-blue?logo=dfinity)](https://internetcomputer.org/)
[![Flux](https://img.shields.io/badge/Powered__by-Flux-green)](https://runonflux.io/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

**FS-Zero** is a decentralized, real-time data protocol designed to shatter the limitations of traditional blockchain architectures. 
It abandons the legacy *polling-based* model (slow, expensive, and blind) for a **WebSocket Push-Native** architecture, orchestrated through a hybrid infrastructure utilizing the **Internet Computer (ICP)** for logic/storage and the **Flux Network** for transport resilience.

---

## 🏗 Architecture Overview

FS-Zero solves the "Decentralized Database Trilemma": **Speed (Real-time)**, **Cost**, and **Persistence**.

```mermaid
graph TD
    User((React Client))
    
    subgraph "The Shield (Flux Network)"
        FluxLB[Flux Load Balancer]
        FluxNodes[Flux WebSocket Gateway Nodes]
    end

    subgraph "The Core (ICP Canister)"
        WS[Rust WebSocket Handler]
        Engine[FS-Zero Engine]
        ICQL[ICQL Storage (Stable Memory)]
    end

    User -- "WebSocket Secure (WSS)" --> FluxLB
    FluxLB --> FluxNodes
    FluxNodes -- "Tunneled Request" --> WS
    WS -- "Direct Push" --> Engine
    Engine <--> ICQL
```

## 🚀 Core Features

### 1. WebSocket-First (Kill the Polling)
Standard ICP architectures suffer from a "blind spot" of several seconds due to consensus block time. Aggressive polling (e.g., every 500ms) burns cycles and creates bottlenecks.

**The FS-Zero Solution:** A persistent bidirectional tunnel. The Canister notifies the client of state changes in **near-real-time (approx. 1-2 seconds)**, matching the ICP block finality. This eliminates the uncertainty of polling intervals and prevents Race Conditions or Lost Updates in multi-user environments.

### 2. Flux Gateway Integration (Infrastructure Shield)
Direct HTTP Outcalls on ICP are computationally expensive and expose subnet IPs to potential external bans. FS-Zero leverages Flux Nodes as a decentralized shield and relay:
*   **IP Masking:** Protects the ICP Subnet from external rate-limiting or IP bans.
*   **High Availability:** If a Flux Node goes down, the Load Balancer automatically reroutes traffic.
*   **Cost Arbitrage:** Offloads TCP connection management to Flux (fixed cost), keeping ICP focused solely on critical business logic (variable cost).

### 3. ICQL Storage Engine
FS-Zero does not use a simple Key-Value store. It implements ICQL, a custom engine inspired by Document Stores (MongoDB) but optimized for WASM memory limits:
*   **Heap Indexing:** Lightweight indexes live in the Heap for instant query resolution.
*   **Stable Storage Data:** Heavy documents reside in Stable Memory (persistent and cheap).
*   **Atomic Journals (WAL):** Guarantees data integrity even in case of canister panic or upgrade.

---

## 🛠 Tech Stack

*   **Language:** Rust (Target wasm32-unknown-unknown)
*   **Protocol:** WebSocket (via custom `ic-websocket-cdk` implementation)
*   **Storage:** Stable Structures / Juno-based logic
*   **Infrastructure:** FluxOS (Dockerized Gateway)

---

## ⚡ Quick Start

### Prerequisites
*   Rust & Cargo
*   DFX SDK
*   Docker (for local Gateway testing)

### 1. Clone & Setup
```bash
git clone https://github.com/grayfox1011/fs-zero.git
cd fs-zero
```

### 2. Local Deploy (ICP Replica)
Start the local ICP environment:
```bash
dfx start --clean --background
```
Deploy the Backend Canister:
```bash
dfx deploy
```

### 3. Gateway Setup (Flux Simulation)
To test WebSockets locally without the live Flux network:
```bash
# Run the local gateway integration (example path)
cd ws_test_demo && cargo run
```

---

## 🧠 Philosophy: Why "FS-Zero"?

*   **Zero Latency:** Information must flow instantly.
*   **Zero Trust:** No central server holds the truth. Truth is encrypted on-chain.
*   **Zero Censorship:** The infrastructure is distributed across multiple jurisdictions and independent nodes.

> "We don't ask for data. We listen to the truth."

---

## 🗺 Roadmap

- [x] **Core:** Rust WebSocket Implementation
- [x] **Storage:** ICQL Engine (Indexing & Relations)
- [x] **Concurrency:** Atomic Transaction & Journaling
- [ ] **Infrastructure:** Flux Docker Container Auto-Deploy
- [ ] **Client:** React/Next.js SDK (`npm install fs-zero-client`)

---

## 🤝 Contributing

Pull Requests are welcome, but warning: this is not a standard CRUD app. Every line of code must respect **Memory Efficiency (WASM Limits)** and **Security First** principles.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.