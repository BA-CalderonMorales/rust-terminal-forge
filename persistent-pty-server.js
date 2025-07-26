const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const sessions = new Map();

function checkClaudeAvailability() {
  return new Promise((resolve) => {
    const proc = spawn('which', ['claude'], { shell: true });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

function getEnhancedEnvironment() {
  return {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    CLAUDE_API_URL: process.env.CLAUDE_API_URL || 'https://api.anthropic.com',
    PATH: process.env.PATH + ':/usr/local/bin:/opt/homebrew/bin' + (process.env.HOME ? `:${process.env.HOME}/.npm/bin:${process.env.HOME}/.local/bin` : ''),
    FORCE_COLOR: '3',
    CLICOLOR_FORCE: '1',
    TERM_PROGRAM: 'RustTerminalForge',
    NO_COLOR: undefined,
    ANSIBLE_FORCE_COLOR: 'true',
    PY_COLORS: '1'
  };
}

console.log('Starting enhanced PTY server');

io.on('connection', (socket) => {
  const { sessionId: rawSessionId } = socket.handshake.query;
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim() !== ''
    ? rawSessionId
    : socket.id;
  console.log(`Client ${socket.id} connected. Session ID: ${sessionId}`);

  socket.on('create-terminal', async ({ cols = 80, rows = 24 } = {}) => {
    let session = sessions.get(sessionId);
    if (!session) {
      console.log(`Spawning new PTY for session ${sessionId}`);
      const claudeAvailable = await checkClaudeAvailability();
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.cwd(),
        env: getEnhancedEnvironment()
      });
      session = {
        pty: ptyProcess,
        id: sessionId,
        clients: new Set(),
        created: new Date(),
        claudeAvailable
      };
      sessions.set(sessionId, session);

      ptyProcess.onData((data) => {
        for (const clientId of session.clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.emit('terminal-output', data);
          }
        }
      });

      ptyProcess.onExit(({ exitCode }) => {
        console.log(`PTY ${ptyProcess.pid} in session ${sessionId} exited with code ${exitCode}`);
        for (const clientId of session.clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.emit('terminal-exit', { exitCode });
          }
        }
        session.pty = null;
      });
    }

    session.clients.add(socket.id);
    const ready = {
      pid: session.pty ? session.pty.pid : null,
      shell: session.pty ? (process.platform === 'win32' ? 'powershell.exe' : 'bash') : null,
      cwd: process.cwd(),
      claudeAvailable: session.claudeAvailable,
      sessionId
    };
    socket.emit('terminal-ready', ready);
  });

  socket.on('terminal-input', (data) => {
    const session = sessions.get(sessionId);
    if (!session || !session.pty) {
      return;
    }
    session.pty.write(data);
  });

  socket.on('terminal-resize', ({ cols, rows }) => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.resize(cols, rows);
    }
  });

  socket.on('terminal-interrupt', () => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.kill('SIGINT');
    }
  });

  socket.on('terminal-kill', () => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.kill('SIGTERM');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} disconnected from session ${sessionId}`);
    const session = sessions.get(sessionId);
    if (session) {
      session.clients.delete(socket.id);
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/sessions', (req, res) => {
  const info = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    pid: session.pty ? session.pty.pid : null,
    created: session.created,
    clients: Array.from(session.clients)
  }));
  res.json({ sessions: info });
});

server.listen(PORT, () => {
  console.log(`PTY server listening on port ${PORT}`);
});

/**
 * Persistent PTY server for Rust Terminal Forge
 *
 * This server supports session-aware PTY management. Clients pass
 * a sessionId when connecting. If a session exists, the PTY process is
 * reused and output is broadcast to all attached clients. When all
 * clients disconnect, the PTY is kept alive until terminated by SIGTERM or
 * SIGINT. HTTP endpoints provide health status and session metadata.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Session storage. Each sessionId maps to an object containing:
 * - pty: the PTY process
 * - clients: a Set of socket IDs attached to this session
 * - created: date
 * - claudeAvailable: boolean if `claude` CLI is available
 */
const sessions = new Map();

function checkClaudeAvailability() {
  return new Promise((resolve) => {
    const cmd = spawn('which', ['claude'], { shell: true });
    cmd.on('close', (code) => resolve(code === 0));
    cmd.on('error', () => resolve(false));
  });
}

function getEnhancedEnvironment() {
  const env = Object.assign({}, process.env);
  env.TERM = 'xterm-256color';
  env.COLORTERM = 'truecolor';
  env.CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com';
  env.PATH = (env.PATH || '') + ':/usr/local/bin:/opt/homebrew/bin' +
    (process.env.HOME ? `:${process.env.HOME}/.npm/bin:${process.env.HOME}/.local/bin` : '');
  env.FORCE_COLOR = '3';
  env.CLICOLOR_FORCE = '1';
  env.TERM_PROGRAM = 'RustTerminalForge';
  env.NO_COLOR = undefined;
  env.ANSIBLE_FORCE_COLOR = 'true';
  env.PY_COLORS = '1';
  return env;
}

console.log('Persistent PTY server starting...');

io.on('connection', (socket) => {
  const rawSessionId = socket.handshake.query.sessionId;
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim() !== ''
    ? rawSessionId
    : socket.id;

  console.log(`New client ${socket.id} connected for session ${sessionId}`);

  socket.on('create-terminal', async ({ cols = 80, rows = 24 } = {}) => {
    let session = sessions.get(sessionId);

    if (!session) {
      console.log(`Spawning new PTY for session ${sessionId}`);
      const claudeAvailable = await checkClaudeAvailability();
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.cwd(),
        env: getEnhancedEnvironment()
      });

      session = {
        pty: ptyProcess,
        id: sessionId,
        clients: new Set(),
        created: new Date(),
        claudeAvailable
      };
      sessions.set(sessionId, session);

      ptyProcess.onData((data) => {
        for (const clientId of session.clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.emit('terminal-output', data);
          }
        }
      });

      ptyProcess.onExit((exit) => {
        for (const clientId of session.clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.emit('terminal-exit', { exitCode: exit.exitCode });
          }
        }
        session.pty = null;
      });
    }

    session.clients.add(socket.id);
    const readyPayload = {
      pid: session.pty ? session.pty.pid : null,
      shell: session.pty ? (process.platform === 'win32' ? 'powershell.exe' : 'bash') : null,
      cwd: process.cwd(),
      claudeAvailable: session.claudeAvailable,
      sessionId
    };
    socket.emit('terminal-ready', readyPayload);
  });

  socket.on('terminal-input', (data) => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.write(data);
    }
  });

  socket.on('terminal-resize', ({ cols, rows }) => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.resize(cols, rows);
    }
  });

  socket.on('terminal-interrupt', () => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.kill('SIGINT');
    }
  });

  socket.on('terminal-kill', () => {
    const session = sessions.get(sessionId);
    if (session && session.pty) {
      session.pty.kill('SIGTERM');
    }
  });

  socket.on('disconnect', () => {
    const session = sessions.get(sessionId);
    if (session) {
      session.clients.delete(socket.id);
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/sessions', (req, res) => {
  const sessionInfo = [];
  sessions.forEach((session, id) => {
    sessionInfo.push({
      id,
      pid: session.pty ? session.pty.pid : null,
      created: session.created,
      clients: Array.from(session.clients)
    });
  });
  res.json({ sessions: sessionInfo });
});

server.listen(PORT, () => {
  console.log(`PTY server listening on port ${PORT}`);
  console.log('Session metadata available at /sessions');
  console.log('Health endpoint available at /health');
});

function shutdown() {
  console.log('Shutting down PTY server...');
  sessions.forEach((session) => {
    if (session.pty) {
      session.pty.kill();
    }
  });
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', () => {
  sessions.forEach((session) => {
  if (session.pty) {
      session.pty.kill();
    }
  });
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  sessions.forEach((session) => {
    if (session.pty) {
      session.pty.kill();
    }
  });
  server.process.on('SIGINT', () => {
  sessions.forEach((session) => {
    if (session.pty) {
      session.pty.kill();
    }
  });
  server.close(() => process.exit(0));
});
close(() => process.exit(0nt-pty-server.js
