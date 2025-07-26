# 🦀 Server Module Architecture

> **Server-First Design**: Comprehensive documentation for Rust Terminal Forge's backend architecture following the Screaming Architecture blueprint.

## 🎨 Architecture Overview

### 🎯 Current State Analysis

The Rust Terminal Forge backend currently operates with a **mixed architecture** that will be transformed into a clean, Rails-inspired **Screaming Architecture**:

**Current Structure**:
```
src/
├── server.rs           # HTTP API server (scattered)
├── pty_server.rs       # WebSocket PTY server (isolated)
└── [frontend code]     # Mixed concerns
```

**Target Structure** (Screaming Architecture):
```
server/                 # 🚀 Dedicated server module
├── http/               # HTTP API concerns
├── pty/                # Terminal/PTY concerns  
├── shared/             # Common server utilities
├── bin/                # Binary entry points
└── tests/              # Server-specific tests
```

### 🎆 Design Principles

1. **📢 Screaming Architecture**: Server structure immediately communicates its purpose
2. **🔄 Separation of Concerns**: Clear boundaries between HTTP, PTY, and shared functionality
3. **🔧 DRY Principles**: Shared utilities prevent code duplication
4. **⚡ Performance-First**: Async-first design for high-throughput terminal operations
5. **🔒 Security-Minded**: Built-in validation, sanitization, and rate limiting

---

## 🗺️ Detailed Architecture

### 🏠 Module Structure

```
server/
├── 🌐 HTTP Module (server/http/)
│   ├── mod.rs              # Module root & public API
│   ├── handlers/           # Route request handlers
│   │   ├── mod.rs
│   │   ├── health.rs        # Health check endpoint
│   │   ├── execute.rs       # Command execution API
│   │   └── static_files.rs  # Static file serving
│   ├── middleware/         # HTTP middleware stack
│   │   ├── mod.rs
│   │   ├── cors.rs          # CORS handling
│   │   ├── logging.rs       # Request logging
│   │   └── error_handling.rs # Error responses
│   ├── routes.rs           # Route definitions
│   └── config.rs           # HTTP server configuration
│
├── 🔌 PTY Module (server/pty/)
│   ├── mod.rs              # Module root & public API
│   ├── session.rs          # Terminal session management
│   ├── websocket.rs        # WebSocket connection handling
│   ├── command_processor.rs # Command execution & validation
│   └── config.rs           # PTY server configuration
│
├── 🔗 Shared Module (server/shared/)
│   ├── mod.rs              # Shared utilities root
│   ├── types.rs            # Common data structures
│   ├── errors.rs           # Error type definitions
│   ├── logging.rs          # Structured logging setup
│   └── security.rs         # Security utilities
│
├── 🔀 Binary Entry Points (server/bin/)
│   ├── http_server.rs      # HTTP server main entry
│   └── pty_server.rs       # PTY server main entry
│
├── 🧪 Testing (server/tests/)
│   ├── integration/        # Integration tests
│   │   ├── http_api.rs      # HTTP API integration tests
│   │   └── pty_websocket.rs # PTY WebSocket tests
│   └── unit/               # Unit tests
│       ├── handlers.rs      # Handler unit tests
│       └── sessions.rs      # Session management tests
│
├── mod.rs                  # Server module root
└── Cargo.toml             # Server dependencies
```

### 🔗 Workspace Configuration

#### Root Cargo.toml
```toml
[workspace]
members = [
    "server",
]
resolver = "2"

[workspace.dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
tracing = "0.1"
thiserror = "1.0"
```

#### Server Cargo.toml
```toml
[package]
name = "server"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "http_server"
path = "bin/http_server.rs"

[[bin]]
name = "pty_server"
path = "bin/pty_server.rs"

[dependencies]
# Async runtime
tokio = { workspace = true }
futures-util = "0.3"

# Web framework
warp = "0.3"
tokio-tungstenite = "0.20"
tower = "0.4"
tower-http = { version = "0.4", features = ["cors", "fs"] }

# Serialization
serde = { workspace = true }
serde_json = "1.0"

# Terminal handling
portable-pty = "0.8"

# Utilities
uuid = { version = "1.0", features = ["v4"] }
bytes = "1.0"
chrono = { version = "0.4", features = ["serde"] }

# Logging & tracing
tracing = { workspace = true }
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Error handling
thiserror = { workspace = true }

# Security
argon2 = "0.5"
rand = "0.8"

[dev-dependencies]
tokio-test = "0.4"
hyper = "0.14"
```

---

## 🌐 HTTP Module Deep Dive

### 🔌 Request Flow Architecture

```
┌────────────────────┐
│     HTTP Request       │
└─────────┬──────────┘
            │
            ▼
┌────────────────────┐
│    CORS Middleware     │
└─────────┬──────────┘
            │
            ▼
┌────────────────────┐
│  Logging Middleware   │
└─────────┬──────────┘
            │
            ▼
┌────────────────────┐
│  Error Middleware     │
└─────────┬──────────┘
            │
            ▼
┌────────────────────┐
│     Route Handler     │
└─────────┬──────────┘
            │
            ▼
┌────────────────────┐
│    HTTP Response      │
└────────────────────┘
```

### 📁 Route Definitions

```rust
// server/http/routes.rs
use warp::{Filter, Reply};
use crate::http::handlers::{health, execute, static_files};
use crate::http::middleware::{cors, logging, error_handling};

pub fn routes() -> impl Filter<Extract = impl Reply> + Clone {
    let health_route = warp::path("health")
        .and(warp::get())
        .and_then(health::get_health);
    
    let execute_route = warp::path!("api" / "execute")
        .and(warp::post())
        .and(warp::body::json())
        .and_then(execute::execute_command);
    
    let static_route = warp::path("static")
        .and(warp::fs::dir("./dist"));
    
    let spa_route = warp::path::end()
        .or(warp::path!("app" / ..))
        .and(warp::fs::file("./dist/index.html"));
    
    // Combine all routes with middleware
    health_route
        .or(execute_route)
        .or(static_route)
        .or(spa_route)
        .with(cors::cors_middleware())
        .with(logging::log_middleware())
        .recover(error_handling::handle_rejection)
}
```

### 📦 Handler Implementation

```rust
// server/http/handlers/execute.rs
use serde::{Deserialize, Serialize};
use warp::Reply;
use crate::shared::{types::CommandRequest, errors::ServerError};

#[derive(Deserialize)]
pub struct ExecuteRequest {
    pub command: String,
    pub session_id: Option<String>,
    pub environment: Option<std::collections::HashMap<String, String>>,
}

#[derive(Serialize)]
pub struct ExecuteResponse {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub execution_time_ms: u64,
}

pub async fn execute_command(
    request: ExecuteRequest,
) -> Result<impl Reply, warp::Rejection> {
    let start_time = std::time::Instant::now();
    
    // Validate command
    if request.command.trim().is_empty() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&ExecuteResponse {
                success: false,
                output: String::new(),
                error: Some("Empty command".to_string()),
                execution_time_ms: 0,
            }),
            warp::http::StatusCode::BAD_REQUEST,
        ));
    }
    
    // Execute command (implementation depends on requirements)
    match execute_command_internal(&request.command).await {
        Ok(output) => {
            let execution_time = start_time.elapsed().as_millis() as u64;
            Ok(warp::reply::with_status(
                warp::reply::json(&ExecuteResponse {
                    success: true,
                    output,
                    error: None,
                    execution_time_ms: execution_time,
                }),
                warp::http::StatusCode::OK,
            ))
        }
        Err(error) => {
            let execution_time = start_time.elapsed().as_millis() as u64;
            Ok(warp::reply::with_status(
                warp::reply::json(&ExecuteResponse {
                    success: false,
                    output: String::new(),
                    error: Some(error.to_string()),
                    execution_time_ms: execution_time,
                }),
                warp::http::StatusCode::INTERNAL_SERVER_ERROR,
            ))
        }
    }
}

async fn execute_command_internal(command: &str) -> Result<String, ServerError> {
    // Implementation will vary based on security requirements
    // This is a simplified example
    let output = tokio::process::Command::new("sh")
        .arg("-c")
        .arg(command)
        .output()
        .await
        .map_err(|e| ServerError::CommandExecution(e.to_string()))?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(ServerError::CommandExecution(
            String::from_utf8_lossy(&output.stderr).to_string()
        ))
    }
}
```

### 🔒 Middleware Implementation

```rust
// server/http/middleware/cors.rs
use warp::Filter;

pub fn cors_middleware() -> warp::cors::Cors {
    warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type"])
        .allow_methods(vec!["GET", "POST", "DELETE"])
        .max_age(3600)
}

// server/http/middleware/logging.rs
use warp::Filter;
use tracing::info;

pub fn log_middleware() -> impl Filter<Extract = ()> + Copy {
    warp::log::custom(|info| {
        info!(
            method = %info.method(),
            path = %info.path(),
            status = %info.status(),
            elapsed = ?info.elapsed(),
            remote_addr = ?info.remote_addr(),
            "HTTP request completed"
        );
    })
}
```

---

## 🔌 PTY Module Deep Dive

### 🔄 Session Management Architecture

```
┌─────────────────────────────────┐
│        WebSocket Connection Manager        │
└──────────────┬─────────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│         Session Manager              │
│                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │Session 1│  │Session 2│  │Session N│  │
│  └──┬───────┘  └──┬───────┘  └──┬───────┘  │
└─────┬───────────┬───────────┬─────────┘
       │               │               │
       ▼               ▼               ▼
  ┌────────┐   ┌────────┐   ┌────────┐
  │ PTY 1  │   │ PTY 2  │   │ PTY N  │
  └────────┘   └────────┘   └────────┘
```

### 📋 Session Management Implementation

```rust
// server/pty/session.rs
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, mpsc};
use portable_pty::{PtySize, PtyPair, CommandBuilder};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::shared::errors::ServerError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSession {
    pub id: String,
    pub name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub is_active: bool,
    pub size: PtySize,
}

#[derive(Debug)]
pub struct ActiveSession {
    pub metadata: TerminalSession,
    pub pty_pair: PtyPair,
    pub command_sender: mpsc::UnboundedSender<String>,
    pub output_receiver: mpsc::UnboundedReceiver<Vec<u8>>,
}

pub struct SessionManager {
    sessions: Arc<Mutex<HashMap<String, ActiveSession>>>,
    max_sessions: usize,
    session_timeout: std::time::Duration,
}

impl SessionManager {
    pub fn new(max_sessions: usize) -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            max_sessions,
            session_timeout: std::time::Duration::from_secs(3600), // 1 hour
        }
    }
    
    pub async fn create_session(
        &self,
        name: Option<String>,
        size: PtySize,
    ) -> Result<String, ServerError> {
        let mut sessions = self.sessions.lock().await;
        
        // Check session limit
        if sessions.len() >= self.max_sessions {
            return Err(ServerError::SessionLimitReached);
        }
        
        let session_id = Uuid::new_v4().to_string();
        
        // Create PTY
        let pty_system = portable_pty::native_pty_system();
        let pty_pair = pty_system
            .openpty(size)
            .map_err(|e| ServerError::PtyCreation(e.to_string()))?;
        
        // Spawn shell process
        let cmd = CommandBuilder::new("/bin/bash");
        let child = pty_pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| ServerError::ProcessSpawn(e.to_string()))?;
        
        // Create communication channels
        let (command_sender, command_receiver) = mpsc::unbounded_channel();
        let (output_sender, output_receiver) = mpsc::unbounded_channel();
        
        // Spawn output reader task
        let reader = pty_pair.master.try_clone_reader()
            .map_err(|e| ServerError::PtyClone(e.to_string()))?;
        
        tokio::spawn(async move {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf).await {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        if output_sender.send(buf[..n].to_vec()).is_err() {
                            break; // Channel closed
                        }
                    }
                    Err(_) => break,
                }
            }
        });
        
        // Spawn command writer task
        let writer = pty_pair.master.take_writer()
            .map_err(|e| ServerError::PtyWriter(e.to_string()))?;
        
        tokio::spawn(async move {
            let mut command_receiver = command_receiver;
            while let Some(command) = command_receiver.recv().await {
                if writer.write_all(command.as_bytes()).await.is_err() {
                    break;
                }
            }
        });
        
        // Create session metadata
        let session = TerminalSession {
            id: session_id.clone(),
            name,
            created_at: Utc::now(),
            last_activity: Utc::now(),
            is_active: true,
            size,
        };
        
        // Create active session
        let active_session = ActiveSession {
            metadata: session,
            pty_pair,
            command_sender,
            output_receiver,
        };
        
        sessions.insert(session_id.clone(), active_session);
        
        Ok(session_id)
    }
    
    pub async fn get_session(&self, session_id: &str) -> Option<TerminalSession> {
        let sessions = self.sessions.lock().await;
        sessions.get(session_id).map(|s| s.metadata.clone())
    }
    
    pub async fn send_command(
        &self,
        session_id: &str,
        command: String,
    ) -> Result<(), ServerError> {
        let sessions = self.sessions.lock().await;
        
        match sessions.get(session_id) {
            Some(session) => {
                session.command_sender
                    .send(command)
                    .map_err(|_| ServerError::SessionClosed)?;
                Ok(())
            }
            None => Err(ServerError::SessionNotFound),
        }
    }
    
    pub async fn close_session(&self, session_id: &str) -> Result<(), ServerError> {
        let mut sessions = self.sessions.lock().await;
        
        match sessions.remove(session_id) {
            Some(_) => Ok(()),
            None => Err(ServerError::SessionNotFound),
        }
    }
    
    pub async fn cleanup_inactive_sessions(&self) {
        let mut sessions = self.sessions.lock().await;
        let now = Utc::now();
        
        sessions.retain(|_, session| {
            let inactive_duration = now - session.metadata.last_activity;
            inactive_duration.to_std().unwrap_or_default() < self.session_timeout
        });
    }
}
```

### 🔌 WebSocket Handler

```rust
// server/pty/websocket.rs
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{WebSocketStream, tungstenite::Message};
use serde::{Serialize, Deserialize};
use tracing::{info, warn, error};
use crate::pty::session::SessionManager;
use crate::shared::errors::ServerError;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketMessage {
    CreateSession {
        name: Option<String>,
        cols: u16,
        rows: u16,
    },
    Command {
        session_id: String,
        data: String,
    },
    Resize {
        session_id: String,
        cols: u16,
        rows: u16,
    },
    CloseSession {
        session_id: String,
    },
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketResponse {
    SessionCreated {
        session_id: String,
    },
    Output {
        session_id: String,
        data: String,
    },
    Error {
        message: String,
    },
    SessionClosed {
        session_id: String,
    },
}

pub async fn handle_websocket<S>(
    ws_stream: WebSocketStream<S>,
    session_manager: std::sync::Arc<SessionManager>,
) where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    
    // Handle incoming messages
    while let Some(message) = ws_receiver.next().await {
        match message {
            Ok(Message::Text(text)) => {
                match serde_json::from_str::<WebSocketMessage>(&text) {
                    Ok(msg) => {
                        let response = handle_message(msg, &session_manager).await;
                        
                        if let Ok(response_json) = serde_json::to_string(&response) {
                            if ws_sender.send(Message::Text(response_json)).await.is_err() {
                                break;
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to parse WebSocket message: {}", e);
                        let error_response = WebSocketResponse::Error {
                            message: format!("Invalid message format: {}", e),
                        };
                        
                        if let Ok(error_json) = serde_json::to_string(&error_response) {
                            let _ = ws_sender.send(Message::Text(error_json)).await;
                        }
                    }
                }
            }
            Ok(Message::Close(_)) => {
                info!("WebSocket connection closed");
                break;
            }
            Err(e) => {
                error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }
}

async fn handle_message(
    message: WebSocketMessage,
    session_manager: &SessionManager,
) -> WebSocketResponse {
    match message {
        WebSocketMessage::CreateSession { name, cols, rows } => {
            let size = portable_pty::PtySize {
                cols,
                rows,
                pixel_width: 0,
                pixel_height: 0,
            };
            
            match session_manager.create_session(name, size).await {
                Ok(session_id) => WebSocketResponse::SessionCreated { session_id },
                Err(e) => WebSocketResponse::Error {
                    message: e.to_string(),
                },
            }
        }
        
        WebSocketMessage::Command { session_id, data } => {
            match session_manager.send_command(&session_id, data).await {
                Ok(_) => WebSocketResponse::Output {
                    session_id,
                    data: "Command sent".to_string(),
                },
                Err(e) => WebSocketResponse::Error {
                    message: e.to_string(),
                },
            }
        }
        
        WebSocketMessage::CloseSession { session_id } => {
            match session_manager.close_session(&session_id).await {
                Ok(_) => WebSocketResponse::SessionClosed { session_id },
                Err(e) => WebSocketResponse::Error {
                    message: e.to_string(),
                },
            }
        }
        
        WebSocketMessage::Resize { session_id, cols, rows } => {
            // Implementation for resizing PTY
            // This would require additional session manager methods
            WebSocketResponse::Error {
                message: "Resize not yet implemented".to_string(),
            }
        }
    }
}
```

---

## 🔗 Shared Module Components

### 📊 Error Handling

```rust
// server/shared/errors.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ServerError {
    #[error("Session not found: {0}")]
    SessionNotFound,
    
    #[error("Session limit reached (max: {0})")]
    SessionLimitReached,
    
    #[error("Session has been closed")]
    SessionClosed,
    
    #[error("PTY creation failed: {0}")]
    PtyCreation(String),
    
    #[error("PTY clone failed: {0}")]
    PtyClone(String),
    
    #[error("PTY writer error: {0}")]
    PtyWriter(String),
    
    #[error("Process spawn failed: {0}")]
    ProcessSpawn(String),
    
    #[error("Command execution failed: {0}")]
    CommandExecution(String),
    
    #[error("WebSocket error: {0}")]
    WebSocket(String),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Invalid configuration: {0}")]
    Configuration(String),
}

impl warp::reject::Reject for ServerError {}
```

### 📝 Type Definitions

```rust
// server/shared/types.rs
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRequest {
    pub command: String,
    pub session_id: Option<String>,
    pub working_directory: Option<String>,
    pub environment: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResponse {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub exit_code: Option<i32>,
    pub execution_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub http_port: u16,
    pub pty_port: u16,
    pub max_sessions: usize,
    pub session_timeout_seconds: u64,
    pub log_level: String,
    pub cors_origins: Vec<String>,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            http_port: 3001,
            pty_port: 8081,
            max_sessions: 100,
            session_timeout_seconds: 3600,
            log_level: "info".to_string(),
            cors_origins: vec!["*".to_string()],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerHealth {
    pub status: String,
    pub uptime_seconds: u64,
    pub active_sessions: usize,
    pub memory_usage_mb: f64,
    pub cpu_usage_percent: f64,
    pub timestamp: DateTime<Utc>,
}
```

### 🔍 Logging Configuration

```rust
// server/shared/logging.rs
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use crate::shared::types::ServerConfig;

pub fn setup_logging(config: &ServerConfig) -> Result<(), Box<dyn std::error::Error>> {
    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            tracing_subscriber::EnvFilter::new(&config.log_level)
        });
    
    tracing_subscriber::registry()
        .with(env_filter)
        .with(
            tracing_subscriber::fmt::layer()
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true)
                .json()
        )
        .init();
    
    Ok(())
}
```

---

## 🔀 Binary Entry Points

### 🌐 HTTP Server Main

```rust
// server/bin/http_server.rs
use tracing::{info, error};
use server::http::routes;
use server::shared::{types::ServerConfig, logging};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load configuration
    let config = ServerConfig::default();
    
    // Setup logging
    logging::setup_logging(&config)?;
    
    info!("Starting HTTP server on port {}", config.http_port);
    
    // Create routes
    let routes = routes::routes();
    
    // Start server
    let server = warp::serve(routes)
        .run(([127, 0, 0, 1], config.http_port));
    
    info!("HTTP server started successfully");
    
    server.await;
    
    Ok(())
}
```

### 🔌 PTY Server Main

```rust
// server/bin/pty_server.rs
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Error};
use tracing::{info, error, warn};
use server::pty::{session::SessionManager, websocket::handle_websocket};
use server::shared::{types::ServerConfig, logging};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load configuration
    let config = ServerConfig::default();
    
    // Setup logging
    logging::setup_logging(&config)?;
    
    info!("Starting PTY server on port {}", config.pty_port);
    
    // Create session manager
    let session_manager = Arc::new(SessionManager::new(config.max_sessions));
    
    // Start session cleanup task
    let cleanup_manager = Arc::clone(&session_manager);
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(
            std::time::Duration::from_secs(300) // 5 minutes
        );
        
        loop {
            interval.tick().await;
            cleanup_manager.cleanup_inactive_sessions().await;
        }
    });
    
    // Create TCP listener
    let listener = TcpListener::bind(
        format!("127.0.0.1:{}", config.pty_port)
    ).await?;
    
    info!("PTY server started successfully");
    
    // Accept connections
    while let Ok((stream, addr)) = listener.accept().await {
        info!("New connection from: {}", addr);
        
        let session_manager = Arc::clone(&session_manager);
        
        tokio::spawn(async move {
            match accept_websocket(stream).await {
                Ok(ws_stream) => {
                    handle_websocket(ws_stream, session_manager).await;
                }
                Err(e) => {
                    warn!("Failed to accept WebSocket connection: {}", e);
                }
            }
        });
    }
    
    Ok(())
}

async fn accept_websocket(
    stream: TcpStream,
) -> Result<tokio_tungstenite::WebSocketStream<TcpStream>, Error> {
    accept_async(stream).await
}
```

---

## 🧪 Testing Strategy

### 🔬 Unit Tests

```rust
// server/tests/unit/sessions.rs
use server::pty::session::{SessionManager, TerminalSession};
use portable_pty::PtySize;

#[tokio::test]
async fn test_create_session() {
    let manager = SessionManager::new(10);
    
    let session_id = manager.create_session(
        Some("test-session".to_string()),
        PtySize::new(80, 24),
    ).await.expect("Failed to create session");
    
    assert!(!session_id.is_empty());
    
    let session = manager.get_session(&session_id).await;
    assert!(session.is_some());
    
    let session = session.unwrap();
    assert_eq!(session.name, Some("test-session".to_string()));
    assert!(session.is_active);
}

#[tokio::test]
async fn test_session_limit() {
    let manager = SessionManager::new(1); // Limit to 1 session
    
    // First session should succeed
    let session1 = manager.create_session(
        None,
        PtySize::new(80, 24),
    ).await;
    assert!(session1.is_ok());
    
    // Second session should fail
    let session2 = manager.create_session(
        None,
        PtySize::new(80, 24),
    ).await;
    assert!(session2.is_err());
}
```

### 🔗 Integration Tests

```rust
// server/tests/integration/http_api.rs
use hyper::{Body, Method, Request, StatusCode};
use serde_json::Value;
use server::http::routes;

#[tokio::test]
async fn test_health_endpoint() {
    let routes = routes::routes();
    
    let response = warp::test::request()
        .method("GET")
        .path("/health")
        .reply(&routes)
        .await;
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: Value = serde_json::from_slice(response.body()).unwrap();
    assert_eq!(body["status"], "healthy");
}

#[tokio::test]
async fn test_execute_endpoint() {
    let routes = routes::routes();
    
    let request_body = serde_json::json!({
        "command": "echo 'Hello, World!'",
        "session_id": null
    });
    
    let response = warp::test::request()
        .method("POST")
        .path("/api/execute")
        .json(&request_body)
        .reply(&routes)
        .await;
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: Value = serde_json::from_slice(response.body()).unwrap();
    assert_eq!(body["success"], true);
    assert!(body["output"].as_str().unwrap().contains("Hello, World!"));
}
```

---

## 📊 Performance Considerations

### ⚡ Optimization Strategies

#### Memory Management
```rust
// Use object pooling for frequently created objects
use std::sync::Arc;
use tokio::sync::Mutex;

struct SessionPool {
    available: Arc<Mutex<Vec<Session>>>,
    max_size: usize,
}

impl SessionPool {
    pub async fn acquire(&self) -> Option<Session> {
        let mut available = self.available.lock().await;
        available.pop()
    }
    
    pub async fn release(&self, session: Session) {
        let mut available = self.available.lock().await;
        if available.len() < self.max_size {
            available.push(session);
        }
    }
}
```

#### Connection Pooling
```rust
// Reuse WebSocket connections when possible
struct ConnectionPool {
    connections: Arc<Mutex<HashMap<String, WebSocketConnection>>>,
    max_idle_time: std::time::Duration,
}

impl ConnectionPool {
    pub async fn get_or_create_connection(
        &self,
        session_id: &str,
    ) -> Result<WebSocketConnection, ServerError> {
        let mut connections = self.connections.lock().await;
        
        match connections.get(session_id) {
            Some(conn) if !conn.is_expired() => Ok(conn.clone()),
            _ => {
                let new_conn = self.create_connection(session_id).await?;
                connections.insert(session_id.to_string(), new_conn.clone());
                Ok(new_conn)
            }
        }
    }
}
```

#### Async Optimization
```rust
// Use buffered channels for high-throughput scenarios
use tokio::sync::mpsc;

const BUFFER_SIZE: usize = 1000;

let (tx, mut rx) = mpsc::channel::<String>(BUFFER_SIZE);

// Batch process messages for efficiency
tokio::spawn(async move {
    let mut batch = Vec::with_capacity(100);
    let mut interval = tokio::time::interval(
        std::time::Duration::from_millis(10)
    );
    
    loop {
        tokio::select! {
            msg = rx.recv() => {
                match msg {
                    Some(msg) => {
                        batch.push(msg);
                        if batch.len() >= 100 {
                            process_batch(&mut batch).await;
                        }
                    }
                    None => break,
                }
            }
            _ = interval.tick() => {
                if !batch.is_empty() {
                    process_batch(&mut batch).await;
                }
            }
        }
    }
});
```

---

## 🔒 Security Implementation

### 🔐 Command Validation

```rust
// server/shared/security.rs
use regex::Regex;
use std::collections::HashSet;

pub struct CommandValidator {
    dangerous_patterns: Vec<Regex>,
    blocked_commands: HashSet<String>,
    max_command_length: usize,
}

impl CommandValidator {
    pub fn new() -> Self {
        let dangerous_patterns = vec![
            Regex::new(r"rm\s+-rf\s+/").unwrap(),
            Regex::new(r"sudo\s+").unwrap(),
            Regex::new(r"curl\s+.*\|\s*sh").unwrap(),
            Regex::new(r"wget\s+.*\|\s*sh").unwrap(),
            Regex::new(r"eval\s*\(").unwrap(),
            Regex::new(r"exec\s*\(").unwrap(),
        ];
        
        let blocked_commands = [
            "sudo", "su", "passwd", "usermod", "userdel",
            "chmod", "chown", "mount", "umount",
            "fdisk", "mkfs", "fsck",
        ].iter().map(|s| s.to_string()).collect();
        
        Self {
            dangerous_patterns,
            blocked_commands,
            max_command_length: 1000,
        }
    }
    
    pub fn validate(&self, command: &str) -> Result<(), SecurityError> {
        // Check length
        if command.len() > self.max_command_length {
            return Err(SecurityError::CommandTooLong);
        }
        
        // Check for dangerous patterns
        for pattern in &self.dangerous_patterns {
            if pattern.is_match(command) {
                return Err(SecurityError::DangerousPattern(
                    pattern.as_str().to_string()
                ));
            }
        }
        
        // Check for blocked commands
        let first_word = command.split_whitespace().next().unwrap_or("");
        if self.blocked_commands.contains(first_word) {
            return Err(SecurityError::BlockedCommand(
                first_word.to_string()
            ));
        }
        
        // Validate character set (prevent binary injection)
        if !command.chars().all(|c| c.is_ascii_graphic() || c.is_whitespace()) {
            return Err(SecurityError::InvalidCharacters);
        }
        
        Ok(())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SecurityError {
    #[error("Command too long (max {max} characters)", max = 1000)]
    CommandTooLong,
    
    #[error("Dangerous pattern detected: {0}")]
    DangerousPattern(String),
    
    #[error("Command blocked: {0}")]
    BlockedCommand(String),
    
    #[error("Invalid characters in command")]
    InvalidCharacters,
}
```

### 🔑 Rate Limiting

```rust
// Rate limiting implementation
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

pub struct RateLimiter {
    requests: Arc<Mutex<HashMap<String, RequestTracker>>>,
    max_requests: usize,
    window_duration: Duration,
}

#[derive(Debug)]
struct RequestTracker {
    count: usize,
    window_start: Instant,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_duration: Duration) -> Self {
        Self {
            requests: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window_duration,
        }
    }
    
    pub async fn check_rate_limit(&self, client_id: &str) -> Result<(), RateLimitError> {
        let mut requests = self.requests.lock().await;
        let now = Instant::now();
        
        let tracker = requests.entry(client_id.to_string())
            .or_insert(RequestTracker {
                count: 0,
                window_start: now,
            });
        
        // Reset window if expired
        if now.duration_since(tracker.window_start) > self.window_duration {
            tracker.count = 0;
            tracker.window_start = now;
        }
        
        // Check limit
        if tracker.count >= self.max_requests {
            return Err(RateLimitError::LimitExceeded {
                limit: self.max_requests,
                window: self.window_duration,
            });
        }
        
        tracker.count += 1;
        Ok(())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum RateLimitError {
    #[error("Rate limit exceeded: {limit} requests per {window:?}")]
    LimitExceeded {
        limit: usize,
        window: Duration,
    },
}
```

---

## 📈 Migration Plan

### 🔄 Phase 1: Infrastructure Setup (Week 1)

#### Day 1-2: Workspace Creation
```bash
# Create server module structure
mkdir -p server/{http,pty,shared,bin,tests/{integration,unit}}

# Initialize Cargo workspace
echo '[workspace]' > Cargo.toml
echo 'members = ["server"]' >> Cargo.toml

# Create server Cargo.toml
cp server_cargo_template.toml server/Cargo.toml
```

#### Day 3-4: Code Migration
```bash
# Move existing server code
mv src/server.rs server/bin/http_server.rs
mv src/pty_server.rs server/bin/pty_server.rs

# Extract shared utilities
# (Manual process - extract common code)
```

#### Day 5-7: Integration & Testing
```bash
# Update build scripts
npm run server:http   # Test HTTP server
npm run server:pty    # Test PTY server
npm run test:server   # Run server tests
```

### 🔄 Phase 2: Feature Implementation (Week 2)

- Implement session management
- Add WebSocket message handling
- Create middleware stack
- Add comprehensive error handling

### 🔄 Phase 3: Testing & Documentation (Week 3)

- Write comprehensive test suite
- Performance benchmarking
- Security audit
- Documentation completion

---

## 📅 Success Metrics

### 🏆 Technical Metrics
- **Build Time**: <30 seconds for full rebuild
- **Test Coverage**: >90% for server modules
- **Memory Usage**: <50MB per active session
- **Response Time**: <100ms for HTTP API calls
- **WebSocket Latency**: <10ms for command input

### 📈 Quality Metrics
- **Code Duplication**: <5% across modules
- **Cyclomatic Complexity**: <10 per function
- **Documentation Coverage**: 100% for public APIs
- **Security Vulnerabilities**: Zero critical issues

---

**This server architecture provides a solid foundation for scalable, maintainable, and secure terminal operations while following Rust best practices and the Screaming Architecture principles.**

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-15  
**Document Owner**: Architecture Team  
**Contributors**: Backend developers, DevOps engineers

*The server module architecture evolves with the project needs while maintaining backwards compatibility and performance standards.*