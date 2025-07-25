
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
  // Enhanced tab features
  isRenamable: boolean;
  hasUnsavedChanges: boolean;
  processCount: number;
  lastActivityAt: string;
  environmentVariables: Record<string, string>;
  workingDirectory: string;
  shellPid?: number;
  terminalSize: { cols: number; rows: number };
  isDirty: boolean; // Has running processes or unsaved state
  tabColor?: string; // Optional color coding
  icon?: string; // Optional icon for tab
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  exitCode: number;
  duration?: number; // Command execution time
  workingDirectory?: string;
  sessionId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  sessions: TerminalSession[];
  activeSessionId: string | null;
}

export interface TabAction {
  type: 'CREATE_TAB' | 'CLOSE_TAB' | 'SWITCH_TAB' | 'RENAME_TAB' | 'REORDER_TABS' | 'UPDATE_TAB_STATE';
  payload: any;
}

export interface TabState {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  maxTabs: number;
  tabOrder: string[]; // For maintaining tab order
  closedTabs: TerminalSession[]; // For tab restoration
  settings: {
    closeConfirmation: boolean;
    tabScrollable: boolean;
    showTabNumbers: boolean;
    showCloseButtons: boolean;
    enableDragDrop: boolean;
    autoSave: boolean;
  };
}

export interface TerminalSocketData {
  sessionId: string;
  data: string;
  type: 'input' | 'output' | 'error' | 'exit';
  timestamp: string;
}

export interface DragInfo {
  draggedTabId: string | null;
  dropTargetId: string | null;
  draggedIndex: number;
  dropTargetIndex: number;
  isDragging: boolean;
}
