import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TabManager } from '../src/core/tabManager';
import { TerminalSession } from '../src/core/types';

// Mock localStorage for testing
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.data[key] || null;
  },
  setItem(key: string, value: string): void {
    this.data[key] = value;
  },
  removeItem(key: string): void {
    delete this.data[key];
  },
  clear(): void {
    this.data = {};
  }
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock process.env and process.cwd for Node.js environment
Object.defineProperty(process, 'env', {
  value: { PATH: '/usr/bin', HOME: '/home/user' },
  writable: true
});

global.process = {
  ...global.process,
  cwd: vi.fn(() => '/home/user'),
  env: { PATH: '/usr/bin', HOME: '/home/user' }
} as any;

describe('TabManager Core Functionality', () => {
  let tabManager: TabManager;

  beforeEach(() => {
    mockLocalStorage.clear();
    tabManager = new TabManager();
  });

  afterEach(() => {
    tabManager.destroy();
  });

  describe('Tab Creation', () => {
    it('should create a new terminal session with default name', () => {
      const session = tabManager.createSession();
      
      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session-\d+/);
      expect(session.name).toBe('Terminal 1');
      expect(session.isActive).toBe(true);
      expect(session.currentPath).toBe('~');
      expect(session.history).toEqual([]);
      expect(session.createdAt).toBeDefined();
    });

    it('should create a new terminal session with custom name', () => {
      const customName = 'Development Terminal';
      const session = tabManager.createSession(customName);
      
      expect(session.name).toBe(customName);
      expect(session.isActive).toBe(true);
    });

    it('should deactivate other sessions when creating a new one', () => {
      const session1 = tabManager.createSession('Session 1');
      const session2 = tabManager.createSession('Session 2');
      
      expect(session1.isActive).toBe(false);
      expect(session2.isActive).toBe(true);
      expect(tabManager.getActiveSession()?.id).toBe(session2.id);
    });

    it('should enforce maximum tab limit', () => {
      // Create max tabs + 1
      const sessions: TerminalSession[] = [];
      for (let i = 0; i < 21; i++) {
        sessions.push(tabManager.createSession(`Session ${i + 1}`));
      }
      
      // Should have at most maxTabs (20)
      expect(tabManager.getSessionCount()).toBe(20);
    });

    it('should add session to tab order', () => {
      const session = tabManager.createSession();
      const state = tabManager.getState();
      
      expect(state.tabOrder).toContain(session.id);
      expect(state.tabOrder.length).toBe(1);
    });
  });

  describe('Tab Switching', () => {
    let session1: TerminalSession;
    let session2: TerminalSession;

    beforeEach(() => {
      session1 = tabManager.createSession('Session 1');
      session2 = tabManager.createSession('Session 2');
    });

    it('should switch to an existing session', () => {
      const success = tabManager.switchToSession(session1.id);
      
      expect(success).toBe(true);
      expect(session1.isActive).toBe(true);
      expect(session2.isActive).toBe(false);
      expect(tabManager.getActiveSession()?.id).toBe(session1.id);
    });

    it('should update lastActivityAt when switching', async () => {
      const originalTime = session1.lastActivityAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      tabManager.switchToSession(session1.id);
      expect(session1.lastActivityAt).not.toBe(originalTime);
    });

    it('should return false when switching to non-existent session', () => {
      const success = tabManager.switchToSession('non-existent-id');
      expect(success).toBe(false);
    });

    it('should maintain only one active session at a time', () => {
      tabManager.switchToSession(session1.id);
      
      const activeSessions = tabManager.getSessions().filter(s => s.isActive);
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].id).toBe(session1.id);
    });
  });

  describe('Tab Removal', () => {
    let session1: TerminalSession;
    let session2: TerminalSession;

    beforeEach(() => {
      session1 = tabManager.createSession('Session 1');
      session2 = tabManager.createSession('Session 2');
    });

    it('should close a session successfully', () => {
      const success = tabManager.closeSession(session1.id);
      
      expect(success).toBe(true);
      expect(tabManager.getSessionCount()).toBe(1);
      expect(tabManager.getSession(session1.id)).toBeNull();
    });

    it('should store closed tab for restoration', () => {
      tabManager.closeSession(session1.id);
      
      const state = tabManager.getState();
      expect(state.closedTabs).toHaveLength(1);
      expect(state.closedTabs[0].name).toBe(session1.name);
    });

    it('should switch to next session when closing active session', () => {
      tabManager.switchToSession(session1.id);
      tabManager.closeSession(session1.id);
      
      expect(tabManager.getActiveSession()?.id).toBe(session2.id);
      expect(session2.isActive).toBe(true);
    });

    it('should handle closing the last session', () => {
      tabManager.closeSession(session1.id);
      tabManager.closeSession(session2.id);
      
      expect(tabManager.getSessionCount()).toBe(0);
      expect(tabManager.getActiveSession()).toBeNull();
    });

    it('should remove session from tab order', () => {
      tabManager.closeSession(session1.id);
      
      const state = tabManager.getState();
      expect(state.tabOrder).not.toContain(session1.id);
      expect(state.tabOrder).toContain(session2.id);
    });

    it('should limit closed tabs history to 10 items', () => {
      // Create and close 12 sessions
      for (let i = 0; i < 12; i++) {
        const session = tabManager.createSession(`Session ${i}`);
        tabManager.closeSession(session.id);
      }
      
      const state = tabManager.getState();
      expect(state.closedTabs).toHaveLength(10);
    });
  });

  describe('Tab Restoration', () => {
    it('should restore a closed tab', () => {
      const originalSession = tabManager.createSession('Test Session');
      const originalName = originalSession.name;
      
      tabManager.closeSession(originalSession.id);
      expect(tabManager.getSessionCount()).toBe(0);
      
      const restoredSession = tabManager.restoreClosedTab();
      
      expect(restoredSession).toBeDefined();
      expect(restoredSession?.name).toBe(originalName);
      expect(restoredSession?.isActive).toBe(true);
      expect(tabManager.getSessionCount()).toBe(1);
    });

    it('should return null when no closed tabs to restore', () => {
      const restoredSession = tabManager.restoreClosedTab();
      expect(restoredSession).toBeNull();
    });

    it('should deactivate other sessions when restoring', () => {
      const session1 = tabManager.createSession('Session 1');
      const session2 = tabManager.createSession('Session 2');
      
      tabManager.closeSession(session1.id);
      const restoredSession = tabManager.restoreClosedTab();
      
      expect(restoredSession?.isActive).toBe(true);
      expect(session2.isActive).toBe(false);
    });
  });

  describe('Session State Management', () => {
    let session: TerminalSession;

    beforeEach(() => {
      session = tabManager.createSession('Test Session');
    });

    it('should update session state', () => {
      const updates = {
        currentPath: '/home/user/projects',
        name: 'Updated Session'
      };
      
      const success = tabManager.updateSessionState(session.id, updates);
      
      expect(success).toBe(true);
      expect(session.currentPath).toBe(updates.currentPath);
      expect(session.name).toBe(updates.name);
    });

    it('should mark session as dirty', () => {
      tabManager.markSessionDirty(session.id, true);
      
      expect(session.isDirty).toBe(true);
      expect(session.hasUnsavedChanges).toBe(true);
    });

    it('should update process count', () => {
      tabManager.updateProcessCount(session.id, 3);
      
      expect(session.processCount).toBe(3);
      expect(session.isDirty).toBe(true);
    });

    it('should mark session as clean when process count is 0', () => {
      tabManager.updateProcessCount(session.id, 3);
      tabManager.updateProcessCount(session.id, 0);
      
      expect(session.processCount).toBe(0);
      expect(session.isDirty).toBe(false);
    });
  });

  describe('Tab Reordering', () => {
    let session1: TerminalSession;
    let session2: TerminalSession;
    let session3: TerminalSession;

    beforeEach(() => {
      session1 = tabManager.createSession('Session 1');
      session2 = tabManager.createSession('Session 2');
      session3 = tabManager.createSession('Session 3');
    });

    it('should reorder tabs by moving before', () => {
      const success = tabManager.reorderTabs(session3.id, session1.id, 'before');
      
      expect(success).toBe(true);
      
      const state = tabManager.getState();
      const expectedOrder = [session3.id, session1.id, session2.id];
      expect(state.tabOrder).toEqual(expectedOrder);
    });

    it('should reorder tabs by moving after', () => {
      const success = tabManager.reorderTabs(session1.id, session3.id, 'after');
      
      expect(success).toBe(true);
      
      const state = tabManager.getState();
      const expectedOrder = [session2.id, session3.id, session1.id];
      expect(state.tabOrder).toEqual(expectedOrder);
    });

    it('should not reorder when drag and drop is disabled', () => {
      tabManager.updateSettings({ enableDragDrop: false });
      
      const success = tabManager.reorderTabs(session1.id, session3.id, 'after');
      expect(success).toBe(false);
    });

    it('should handle invalid session IDs gracefully', () => {
      const success = tabManager.reorderTabs('invalid-id', session1.id, 'before');
      expect(success).toBe(false);
    });
  });

  describe('Session Persistence', () => {
    it('should persist state to localStorage', () => {
      const session = tabManager.createSession('Persistent Session');
      
      // Trigger persistence
      tabManager.destroy();
      
      expect(mockLocalStorage.data['rust-terminal-tabs']).toBeDefined();
      const savedState = JSON.parse(mockLocalStorage.data['rust-terminal-tabs']);
      expect(savedState.sessions).toHaveLength(1);
      expect(savedState.sessions[0].name).toBe('Persistent Session');
    });

    it('should load persisted state on initialization', () => {
      // Set up some state
      const session = tabManager.createSession('Loaded Session');
      tabManager.destroy();
      
      // Create new instance - should load from localStorage
      const newTabManager = new TabManager();
      
      expect(newTabManager.getSessionCount()).toBe(1);
      expect(newTabManager.getSessions()[0].name).toBe('Loaded Session');
      
      newTabManager.destroy();
    });

    it('should limit history size when persisting', () => {
      const session = tabManager.createSession('Test Session');
      
      // Add more than 50 history entries
      const longHistory = Array.from({ length: 60 }, (_, i) => ({
        id: `cmd-${i}`,
        command: `command ${i}`,
        output: `output ${i}`,
        timestamp: new Date().toISOString(),
        exitCode: 0
      }));
      
      tabManager.updateSessionState(session.id, { history: longHistory });
      tabManager.destroy();
      
      const savedState = JSON.parse(mockLocalStorage.data['rust-terminal-tabs']);
      expect(savedState.sessions[0].history).toHaveLength(50);
    });
  });

  describe('Utility Functions', () => {
    it('should check if new tabs can be created', () => {
      expect(tabManager.canCreateNewTab()).toBe(true);
      
      // Create max tabs
      for (let i = 0; i < 20; i++) {
        tabManager.createSession(`Session ${i + 1}`);
      }
      
      expect(tabManager.canCreateNewTab()).toBe(false);
    });

    it('should check if closed tabs exist', () => {
      expect(tabManager.hasClosedTabs()).toBe(false);
      
      const session = tabManager.createSession('Test');
      tabManager.closeSession(session.id);
      
      expect(tabManager.hasClosedTabs()).toBe(true);
    });

    it('should get session by ID', () => {
      const session = tabManager.createSession('Test Session');
      
      const foundSession = tabManager.getSession(session.id);
      expect(foundSession).toBeDefined();
      expect(foundSession?.id).toBe(session.id);
      
      const notFoundSession = tabManager.getSession('non-existent');
      expect(notFoundSession).toBeNull();
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const newSettings = {
        closeConfirmation: false,
        tabScrollable: false,
        showTabNumbers: false
      };
      
      tabManager.updateSettings(newSettings);
      
      const state = tabManager.getState();
      expect(state.settings.closeConfirmation).toBe(false);
      expect(state.settings.tabScrollable).toBe(false);
      expect(state.settings.showTabNumbers).toBe(false);
    });

    it('should maintain other settings when updating', () => {
      const originalState = tabManager.getState();
      
      tabManager.updateSettings({ closeConfirmation: false });
      
      const newState = tabManager.getState();
      expect(newState.settings.closeConfirmation).toBe(false);
      expect(newState.settings.autoSave).toBe(originalState.settings.autoSave);
      expect(newState.settings.enableDragDrop).toBe(originalState.settings.enableDragDrop);
    });
  });

  describe('Event Subscription', () => {
    it('should notify subscribers of state changes', () => {
      const mockCallback = vi.fn();
      const unsubscribe = tabManager.subscribe(mockCallback);
      
      tabManager.createSession('Test Session');
      
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(tabManager.getState());
      
      unsubscribe();
    });

    it('should allow unsubscribing', () => {
      const mockCallback = vi.fn();
      const unsubscribe = tabManager.subscribe(mockCallback);
      
      unsubscribe();
      tabManager.createSession('Test Session');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});