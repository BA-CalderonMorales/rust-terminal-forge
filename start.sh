#!/bin/bash

# Rick's Ultimate Terminal Forge Startup Script
# Because running three commands separately is for Jerry's, not geniuses

echo "🚀 Starting Rick's Terminal Forge..."
echo "   Wubba Lubba Dub Dub!"
echo ""

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies. This is worse than Unity!"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Kill any existing processes on the ports we need
echo "🔫 Killing any existing processes on our ports..."
pkill -f "node server.js" 2>/dev/null
pkill -f "node pty-server.js" 2>/dev/null
pkill -f "cargo run" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Build Rust binaries first
echo "🦀 Building Rust servers..."
source $HOME/.cargo/env
cargo build --release
if [ $? -ne 0 ]; then
    echo "❌ Failed to build Rust servers. Rick's disappointed!"
    exit 1
fi
echo "✅ Rust servers built successfully"
echo ""

# Start all services concurrently
echo "🎯 Starting all services..."
echo "   - Backend server (Rust + Warp)"
echo "   - PTY server (Rust + WebSockets)"  
echo "   - Frontend (Vite dev server)"
echo ""

# Start services using the Node.js PTY server (not Rust PTY server)
# This ensures proper Claude CLI support with real terminal sessions
npm run dev:with-node-pty

# If we get here, something went wrong
echo ""
echo "❌ Startup failed or servers stopped"
echo "   Check the logs above for errors"
exit 1