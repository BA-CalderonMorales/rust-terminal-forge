// Enhanced Tab Management System for Multi-Terminal Support
import { TerminalSession, TabAction, TabState, DragInfo } from './types';
import { getBrowserProcess, safeCwd } from '../utils/browserEnv';

export class TabManager {
  private state: TabState;
  private subscribers: Array<(state: TabState) => void> = [];
  private storageKey = 'rust-terminal-tabs';

  constructor() {
    this.state = {
      sessions: [],
      activeSessionId: null,
      maxTabs: 20,
      tabOrder: [],
      closedTabs: [],
      settings: {
        closeConfirmation: true,
        tabScrollable: true,
        showTabNumbers: true,
        showCloseButtons: true,
        enableDragDrop: true,
        autoSave: true,
      }
    };

    // Load persisted state
    this.loadPersistedState();

    // Auto-save state changes
    window.addEventListener('beforeunload', () => {
      if (this.state.settings.autoSave) {
        this.persistState();
      }
    });
  }

  // State subscription management
  subscribe(callback: (state: TabState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // State persistence
  private persistState() {
    try {
      const stateToSave = {
        ...this.state,
        sessions: this.state.sessions.map(session => ({
          ...session,
          // Don't persist sensitive runtime data
          shellPid: undefined,
          history: session.history.slice(-50) // Keep only last 50 commands
        }))
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to persist tab state:', error);
    }
  }

  private loadPersistedState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsedState,
          // Reset runtime state
          sessions: parsedState.sessions.map((session: TerminalSession) => ({
            ...session,
            isActive: false,
            shellPid: undefined,
            isDirty: false,
            processCount: 0
          }))
        };
        
        // Reactivate the previously active session if it exists
        if (this.state.activeSessionId && 
            this.state.sessions.some(s => s.id === this.state.activeSessionId)) {
          this.switchToSession(this.state.activeSessionId);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted tab state:', error);
    }
  }

  // Core tab operations
  createSession(name?: string): TerminalSession {
    const sessionNumber = this.state.sessions.length + 1;
    const session: TerminalSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Terminal ${sessionNumber}`,
      currentPath: '~',
      history: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      isRenamable: true,
      hasUnsavedChanges: false,
      processCount: 0,
      lastActivityAt: new Date().toISOString(),
      environmentVariables: {...getBrowserProcess().env},
      workingDirectory: safeCwd(),
      terminalSize: { cols: 80, rows: 24 },
      isDirty: false,
    };

    // Deactivate other sessions
    this.state.sessions.forEach(s => s.isActive = false);

    // Add to sessions and maintain order
    this.state.sessions.push(session);
    this.state.tabOrder.push(session.id);
    this.state.activeSessionId = session.id;

    // Enforce max tabs limit
    if (this.state.sessions.length > this.state.maxTabs) {
      this.closeOldestInactiveSession();
    }

    this.notifySubscribers();
    this.persistState();

    return session;
  }

  closeSession(sessionId: string, force = false): boolean {
    const sessionIndex = this.state.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return false;

    const session = this.state.sessions[sessionIndex];

    // Check for confirmation if session is dirty and not forced
    if (!force && this.state.settings.closeConfirmation && session.isDirty) {
      const shouldClose = window.confirm(
        `"${session.name}" has active processes or unsaved changes. Close anyway?`
      );
      if (!shouldClose) return false;
    }

    // Store for potential restoration
    this.state.closedTabs.unshift({
      ...session,
      isActive: false
    });

    // Keep only last 10 closed tabs
    if (this.state.closedTabs.length > 10) {
      this.state.closedTabs = this.state.closedTabs.slice(0, 10);
    }

    // Remove from sessions and tab order
    this.state.sessions.splice(sessionIndex, 1);
    this.state.tabOrder = this.state.tabOrder.filter(id => id !== sessionId);

    // Handle active session switching
    if (this.state.activeSessionId === sessionId) {
      if (this.state.sessions.length > 0) {
        // Switch to the next session or previous one
        const newActiveIndex = Math.min(sessionIndex, this.state.sessions.length - 1);
        this.switchToSession(this.state.sessions[newActiveIndex].id);
      } else {
        this.state.activeSessionId = null;
      }
    }

    this.notifySubscribers();
    this.persistState();

    return true;
  }

  switchToSession(sessionId: string): boolean {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    // Deactivate all sessions
    this.state.sessions.forEach(s => s.isActive = false);

    // Activate target session
    session.isActive = true;
    session.lastActivityAt = new Date().toISOString();
    this.state.activeSessionId = sessionId;

    this.notifySubscribers();
    return true;
  }

  renameSession(sessionId: string, newName: string): boolean {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session || !session.isRenamable) return false;

    const trimmedName = newName.trim();
    if (!trimmedName) return false;

    session.name = trimmedName;
    this.notifySubscribers();
    this.persistState();

    return true;
  }

  // Drag and drop functionality
  reorderTabs(draggedId: string, targetId: string, position: 'before' | 'after'): boolean {
    if (!this.state.settings.enableDragDrop) return false;

    const draggedIndex = this.state.tabOrder.findIndex(id => id === draggedId);
    const targetIndex = this.state.tabOrder.findIndex(id => id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return false;

    // Remove dragged item
    const [draggedItem] = this.state.tabOrder.splice(draggedIndex, 1);

    // Calculate new insertion index
    let insertIndex = targetIndex;
    if (position === 'after') {
      insertIndex++;
    }
    if (draggedIndex < targetIndex && position === 'before') {
      insertIndex--;
    }

    // Insert at new position
    this.state.tabOrder.splice(insertIndex, 0, draggedItem);

    // Reorder sessions array to match
    this.state.sessions.sort((a, b) => {
      const aIndex = this.state.tabOrder.indexOf(a.id);
      const bIndex = this.state.tabOrder.indexOf(b.id);
      return aIndex - bIndex;
    });

    this.notifySubscribers();
    this.persistState();

    return true;
  }

  // Session state management
  updateSessionState(sessionId: string, updates: Partial<TerminalSession>): boolean {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    Object.assign(session, updates);
    session.lastActivityAt = new Date().toISOString();

    this.notifySubscribers();
    return true;
  }

  markSessionDirty(sessionId: string, isDirty: boolean): boolean {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.isDirty = isDirty;
    session.hasUnsavedChanges = isDirty;

    this.notifySubscribers();
    return true;
  }

  updateProcessCount(sessionId: string, count: number): boolean {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.processCount = count;
    session.isDirty = count > 0;

    this.notifySubscribers();
    return true;
  }

  // Utility methods
  private closeOldestInactiveSession(): boolean {
    const inactiveSessions = this.state.sessions
      .filter(s => !s.isActive)
      .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());

    if (inactiveSessions.length > 0) {
      return this.closeSession(inactiveSessions[0].id, true);
    }

    return false;
  }

  restoreClosedTab(): TerminalSession | null {
    if (this.state.closedTabs.length === 0) return null;

    const [restoredTab] = this.state.closedTabs.splice(0, 1);
    
    // Create new session from restored data
    const newSession: TerminalSession = {
      ...restoredTab,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      isDirty: false,
      processCount: 0,
      shellPid: undefined,
    };

    // Deactivate other sessions
    this.state.sessions.forEach(s => s.isActive = false);

    this.state.sessions.push(newSession);
    this.state.tabOrder.push(newSession.id);
    this.state.activeSessionId = newSession.id;

    this.notifySubscribers();
    this.persistState();

    return newSession;
  }

  // Getters
  getState(): TabState {
    return { ...this.state };
  }

  getSessions(): TerminalSession[] {
    return [...this.state.sessions];
  }

  getActiveSession(): TerminalSession | null {
    return this.state.sessions.find(s => s.id === this.state.activeSessionId) || null;
  }

  getSession(sessionId: string): TerminalSession | null {
    return this.state.sessions.find(s => s.id === sessionId) || null;
  }

  getSessionCount(): number {
    return this.state.sessions.length;
  }

  canCreateNewTab(): boolean {
    return this.state.sessions.length < this.state.maxTabs;
  }

  hasClosedTabs(): boolean {
    return this.state.closedTabs.length > 0;
  }

  // Settings management
  updateSettings(newSettings: Partial<TabState['settings']>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.notifySubscribers();
    this.persistState();
  }

  // Cleanup
  destroy(): void {
    this.subscribers = [];
    if (this.state.settings.autoSave) {
      this.persistState();
    }
  }
}

// Singleton instance
export const tabManager = new TabManager();