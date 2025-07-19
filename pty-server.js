import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as pty from 'node-pty';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Store active PTY sessions
const sessions = new Map();

// Check if Claude CLI is available
function checkClaudeAvailability() {
  return new Promise((resolve) => {
    const checkProcess = spawn('which', ['claude'], { shell: true });
    checkProcess.on('close', (code) => {
      resolve(code === 0);
    });
    checkProcess.on('error', () => {
      resolve(false);
    });
  });
}

// Enhanced environment for Claude CLI support
function getEnhancedEnvironment() {
  return {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    // Claude CLI specific environment variables
    CLAUDE_API_URL: process.env.CLAUDE_API_URL || 'https://api.anthropic.com',
    // Ensure PATH includes common locations for globally installed npm packages
    PATH: process.env.PATH + ':/usr/local/bin:/opt/homebrew/bin:' + 
          (process.env.HOME ? `${process.env.HOME}/.npm/bin:${process.env.HOME}/.local/bin` : ''),
    // Force colors in terminals - be more aggressive
    FORCE_COLOR: '3',
    CLICOLOR_FORCE: '1',
    TERM_PROGRAM: 'RickTerminal',
    // Remove NO_COLOR to ensure colors work
    NO_COLOR: undefined,
    // Additional color forcing
    ANSIBLE_FORCE_COLOR: 'true',
    PY_COLORS: '1'
  };
}

console.log('🚀 Rick\'s Interdimensional Terminal Server Starting...');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('📡 New terminal connection:', socket.id);

  // Create new PTY session
  socket.on('create-terminal', async ({ cols = 80, rows = 24 } = {}) => {
    console.log('🔧 Creating new PTY session for:', socket.id);
    
    // Check Claude CLI availability
    const claudeAvailable = await checkClaudeAvailability();
    console.log('🤖 Claude CLI availability check:', claudeAvailable ? '✅ Available' : '❌ Not found');
    
    // Spawn a real shell with PTY
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: cols,
      rows: rows,
      cwd: process.cwd(),
      env: getEnhancedEnvironment()
    });

    // Store session
    sessions.set(socket.id, {
      pty: ptyProcess,
      id: socket.id,
      created: new Date(),
      claudeAvailable: claudeAvailable
    });

    console.log('✅ PTY session created with PID:', ptyProcess.pid);

    // Handle PTY output - send to client
    ptyProcess.onData((data) => {
      // Enhanced logging to debug display issues
      console.log('📡 PTY OUTPUT:', {
        length: data.length,
        preview: data.substring(0, 100) + (data.length > 100 ? '...' : ''),
        hasAnsi: /\x1b\[[0-9;]*m/.test(data),
        hexDump: Buffer.from(data).toString('hex').substring(0, 50) + '...'
      });
      
      // Log Claude command output with more detail
      if (data.includes('claude') || data.includes('Claude') || data.includes('Anthropic')) {
        console.log('🤖 CLAUDE OUTPUT DETECTED:');
        console.log('🤖 Output length:', data.length, 'bytes');
        console.log('🤖 Raw bytes:', Buffer.from(data).toString('hex'));
        console.log('🤖 Output preview:', JSON.stringify(data.substring(0, 200)));
      }
      
      socket.emit('terminal-output', data);
    });

    // Handle PTY exit
    ptyProcess.onExit((exitCode) => {
      console.log('🏁 PTY session exited with code:', exitCode);
      socket.emit('terminal-exit', { exitCode });
      sessions.delete(socket.id);
    });

    // Don't send welcome message - let the shell show its natural prompt

    // Send initial prompt
    socket.emit('terminal-ready', { 
      pid: ptyProcess.pid,
      shell: shell,
      cwd: process.cwd(),
      claudeAvailable: claudeAvailable
    });
  });

  // Handle input from client
  socket.on('terminal-input', (data) => {
    const session = sessions.get(socket.id);
    if (session && session.pty) {
      const cleanData = data.replace(/\r?\n/g, '\\n');
      console.log('⌨️ Terminal input received:', cleanData);
      console.log('⌨️ Input length:', data.length, 'bytes');
      console.log('⌨️ Session ID:', socket.id, 'PID:', session.pty.pid);
      
      // Check if this looks like a Claude command
      if (cleanData.includes('claude')) {
        console.log('🤖 CLAUDE COMMAND DETECTED:', cleanData);
        console.log('🤖 Claude CLI Available:', session.claudeAvailable);
        console.log('🤖 Current Working Directory:', process.cwd());
        console.log('🤖 PATH:', process.env.PATH);
      }
      
      session.pty.write(data);
    } else {
      console.log('❌ No valid session found for input:', data.replace(/\r?\n/g, '\\n'));
    }
  });

  // Handle terminal resize
  socket.on('terminal-resize', ({ cols, rows }) => {
    const session = sessions.get(socket.id);
    if (session && session.pty) {
      console.log('📐 Terminal resize:', cols, 'x', rows);
      session.pty.resize(cols, rows);
    }
  });

  // Handle interrupt (Ctrl+C)
  socket.on('terminal-interrupt', () => {
    const session = sessions.get(socket.id);
    if (session && session.pty) {
      console.log('⛔ Terminal interrupt (Ctrl+C)');
      session.pty.kill('SIGINT');
    }
  });

  // Handle kill signal
  socket.on('terminal-kill', () => {
    const session = sessions.get(socket.id);
    if (session && session.pty) {
      console.log('💀 Terminal kill signal');
      session.pty.kill('SIGTERM');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔌 Terminal disconnected:', socket.id);
    const session = sessions.get(socket.id);
    if (session && session.pty) {
      console.log('🧹 Cleaning up PTY session:', session.pty.pid);
      session.pty.kill();
    }
    sessions.delete(socket.id);
  });
});

// HTTP Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeSessions: sessions.size,
    timestamp: new Date().toISOString() 
  });
});

// Session info endpoint
app.get('/sessions', (req, res) => {
  const sessionInfo = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    pid: session.pty.pid,
    created: session.created
  }));
  res.json({ sessions: sessionInfo });
});

server.listen(PORT, () => {
  console.log('🌟 Rick\'s PTY Terminal Server running on port', PORT);
  console.log('📊 Session management available at /sessions');
  console.log('💊 Health check at /health');
  console.log('🔥 WUBBA LUBBA DUB DUB - Real terminal is ONLINE!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down PTY server...');
  sessions.forEach((session) => {
    if (session.pty) {
      session.pty.kill();
    }
  });
  server.close();
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down PTY server...');
  sessions.forEach((session) => {
    if (session.pty) {
      session.pty.kill();
    }
  });
  process.exit(0);
});