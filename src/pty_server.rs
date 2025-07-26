use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};
use uuid::Uuid;
use serde_json::json;
use log::{info, error, warn, debug};

type Sessions = Arc<Mutex<HashMap<String, Arc<Mutex<TerminalSession>>>>>;

struct TerminalSession {
    id: String,
    active: bool,
}

impl TerminalSession {
    fn new() -> Self {
        let id = Uuid::new_v4().to_string();
        Self {
            id,
            active: true,
        }
    }

    fn process_input(&mut self, input: &str) -> String {
        info!("⚙️ Processing input in session {}: '{}'", self.id, input.trim());
        
        // Mark session as active when processing input
        self.active = true;
        
        // For now, just echo back with Rick's style
        let response = format!(
            "🧪 Rick's Rust Terminal processed: {}\n\
            Wubba Lubba Dub Dub!\n\
            📊 Session: {} (Active: {})\n\
            ⏰ Processed at: {}\n",
            input.trim(),
            self.id,
            self.active,
            chrono::Utc::now().format("%H:%M:%S UTC")
        );
        
        info!("✅ Generated response for session {} ({} chars)", self.id, response.len());
        response
    }
}

#[tokio::main]
async fn main() {
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Debug)
        .init();
    
    info!("🚀 Rick's Interdimensional PTY Terminal Server Starting...");
    info!("🐛 MAXIMUM LOGGING enabled for WebSocket debugging!");
    
    let sessions: Sessions = Arc::new(Mutex::new(HashMap::new()));
    
    let listener = TcpListener::bind("127.0.0.1:3002").await
        .expect("Failed to bind to port 3002");
    
    info!("🌟 Rick's PTY Terminal Server running on port 3002");
    info!("📊 Session management available at /sessions");
    info!("💊 Health check at /health");
    info!("🔥 WUBBA LUBBA DUB DUB - Real terminal is ONLINE!");
    info!("👂 Listening for WebSocket connections...");
    
    while let Ok((stream, addr)) = listener.accept().await {
        info!("🔌 NEW CONNECTION from: {} (IP: {})", addr, addr.ip());
        info!("📈 Active sessions before new connection: {}", sessions.lock().unwrap().len());
        let sessions = sessions.clone();
        tokio::spawn(async move {
            info!("🚀 Spawning connection handler for {}", addr);
            handle_connection(stream, sessions).await;
            info!("🔚 Connection handler for {} completed", addr);
        });
    }
}

async fn handle_connection(stream: TcpStream, sessions: Sessions) {
    let peer_addr = stream.peer_addr().unwrap_or_else(|_| "unknown".parse().unwrap());
    info!("🔄 Starting WebSocket handshake for {}", peer_addr);
    
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => {
            info!("✅ WebSocket handshake successful for {}", peer_addr);
            ws
        },
        Err(e) => {
            error!("❌ WebSocket connection failed for {}: {}", peer_addr, e);
            return;
        }
    };

    info!("🎉 WebSocket connection established for {}", peer_addr);
    
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    
    // Create a new terminal session
    let session_id = Uuid::new_v4().to_string();
    info!("🆕 Creating new terminal session: {}", session_id);
    let terminal_session = TerminalSession::new();
    
    let session = Arc::new(Mutex::new(terminal_session));
    sessions.lock().unwrap().insert(session_id.clone(), session.clone());
    info!("📝 Session {} registered in session manager", session_id);
    info!("📊 Total active sessions: {}", sessions.lock().unwrap().len());
    
    // Send initial welcome message
    let welcome_msg = json!({
        "type": "output",
        "data": format!("🧪 Welcome to Rick's Interdimensional Rust Terminal!\nWubba Lubba Dub Dub! Type your commands below:\nSession ID: {}\nConnected from: {}\n\n$ ", session_id, peer_addr)
    });
    
    info!("📤 Sending welcome message to session {}", session_id);
    if let Err(e) = ws_sender.send(Message::Text(welcome_msg.to_string())).await {
        error!("❌ Failed to send welcome message to {}: {}", session_id, e);
        return;
    }
    info!("✅ Welcome message sent successfully to {}", session_id);
    
    // Handle incoming WebSocket messages
    info!("👂 Starting message loop for session {}", session_id);
    while let Some(msg) = ws_receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                info!("📨 Received text message from {}: {} chars", session_id, text.len());
                debug!("📋 Message content: {}", text);
                
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(json_msg) => {
                        info!("✅ JSON parsed successfully for session {}", session_id);
                        debug!("📄 Parsed JSON: {:?}", json_msg);
                        
                        if let Some(msg_type) = json_msg["type"].as_str() {
                            info!("🏷️ Message type: '{}' from session {}", msg_type, session_id);
                            match msg_type {
                                "input" => {
                                    if let Some(data) = json_msg["data"].as_str() {
                                        info!("⌨️ Processing input from {}: '{}'", session_id, data);
                                        
                                        let response = if let Ok(mut session_guard) = session.lock() {
                                            info!("🔓 Session lock acquired for {}", session_id);
                                            let result = session_guard.process_input(data);
                                            info!("⚙️ Input processed, response length: {}", result.len());
                                            result
                                        } else {
                                            error!("❌ Failed to acquire session lock for {}", session_id);
                                            "Session error!".to_string()
                                        };
                                        
                                        // Send the response back
                                        let response_msg = json!({
                                            "type": "output",
                                            "data": format!("{}$ ", response)
                                        });
                                        
                                        info!("📤 Sending response to session {}", session_id);
                                        if let Err(e) = ws_sender.send(Message::Text(response_msg.to_string())).await {
                                            error!("❌ Failed to send response to {}: {}", session_id, e);
                                            break;
                                        }
                                        info!("✅ Response sent successfully to {}", session_id);
                                    } else {
                                        warn!("⚠️ No 'data' field in input message from {}", session_id);
                                    }
                                }
                                "resize" => {
                                    if let (Some(cols), Some(rows)) = (
                                        json_msg["cols"].as_u64(),
                                        json_msg["rows"].as_u64()
                                    ) {
                                        info!("📐 Terminal resize request from {}: {}x{}", session_id, cols, rows);
                                        // Terminal resize acknowledged
                                    } else {
                                        warn!("⚠️ Invalid resize message from {}: missing cols/rows", session_id);
                                    }
                                }
                                _ => {
                                    warn!("❓ Unknown message type '{}' from session {}", msg_type, session_id);
                                }
                            }
                        } else {
                            warn!("⚠️ Message from {} missing 'type' field", session_id);
                        }
                    }
                    Err(e) => {
                        error!("❌ Failed to parse JSON message from {}: {}", session_id, e);
                        error!("📋 Raw message: {}", text);
                    }
                }
            }
            Ok(Message::Close(frame)) => {
                info!("🔚 WebSocket connection closed by {} - Frame: {:?}", session_id, frame);
                break;
            }
            Ok(Message::Binary(data)) => {
                info!("📦 Binary message received from {} ({} bytes)", session_id, data.len());
                warn!("⚠️ Binary messages not supported, ignoring");
            }
            Ok(Message::Ping(data)) => {
                info!("🏓 Ping received from {} ({} bytes)", session_id, data.len());
            }
            Ok(Message::Pong(data)) => {
                info!("🏓 Pong received from {} ({} bytes)", session_id, data.len());
            }
            Ok(Message::Frame(_)) => {
                // Raw frame messages - typically handled internally by the WebSocket library
                debug!("🔧 Raw frame message received from {}", session_id);
            }
            Err(e) => {
                error!("❌ WebSocket error for {}: {}", session_id, e);
                break;
            }
        }
    }
    
    // Clean up
    info!("🧹 Cleaning up session {}", session_id);
    sessions.lock().unwrap().remove(&session_id);
    let remaining_sessions = sessions.lock().unwrap().len();
    info!("✅ Terminal session {} ended. Remaining sessions: {}", session_id, remaining_sessions);
}