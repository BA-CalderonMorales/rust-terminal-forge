
// Core types used across the application
export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  currentPath: string;
  history: TerminalCommand[];
  isActive: boolean;
  createdAt: string;
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  exitCode: number;
}

export interface EditorSession {
  id: string;
  filePath: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export const OPEN_EDITOR_PREFIX = '__OPEN_EDITOR__:';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  sessions: TerminalSession[];
  activeSessionId: string | null;
}
