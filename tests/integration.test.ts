import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tabManager } from '../src/core/tabManager';

describe('Multi-Tab Terminal Integration', () => {
  beforeEach(() => {
    // Clear localStorage to start fresh
    localStorage.clear();
    
    // Clear any existing sessions
    const sessions = tabManager.getSessions();
    sessions.forEach(session => {
      tabManager.closeSession(session.id, true);
    });
    
    // Reset the tab manager state
    (tabManager as any).state = {
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
  });

  afterEach(() => {
    tabManager.destroy();
  });

  describe('Tab Management Integration', () => {
    it('should create and manage multiple terminal sessions', () => {
      // Create multiple sessions
      const session1 = tabManager.createSession('Development');
      const session2 = tabManager.createSession('Testing');
      const session3 = tabManager.createSession('Production');

      // Verify sessions were created
      expect(tabManager.getSessionCount()).toBe(3);
      expect(tabManager.getActiveSession()?.id).toBe(session3.id);

      // Switch between sessions
      tabManager.switchToSession(session1.id);
      expect(tabManager.getActiveSession()?.id).toBe(session1.id);

      tabManager.switchToSession(session2.id);
      expect(tabManager.getActiveSession()?.id).toBe(session2.id);

      // Close a session
      tabManager.closeSession(session1.id);
      expect(tabManager.getSessionCount()).toBe(2);
      expect(tabManager.getActiveSession()?.id).toBe(session2.id);
    });

    it('should handle session state updates', () => {
      const session = tabManager.createSession('Test Session');
      
      // Update session state
      tabManager.updateSessionState(session.id, {
        currentPath: '/home/user/projects',
        name: 'Updated Session'
      });

      const updatedSession = tabManager.getSession(session.id);
      expect(updatedSession?.currentPath).toBe('/home/user/projects');
      expect(updatedSession?.name).toBe('Updated Session');
    });

    it('should mark sessions as dirty and clean', () => {
      const session = tabManager.createSession('Test Session');
      
      // Mark as dirty
      tabManager.markSessionDirty(session.id, true);
      expect(session.isDirty).toBe(true);
      expect(session.hasUnsavedChanges).toBe(true);

      // Mark as clean
      tabManager.markSessionDirty(session.id, false);
      expect(session.isDirty).toBe(false);
      expect(session.hasUnsavedChanges).toBe(false);
    });

    it('should track process count', () => {
      const session = tabManager.createSession('Test Session');
      
      // Update process count
      tabManager.updateProcessCount(session.id, 3);
      expect(session.processCount).toBe(3);
      expect(session.isDirty).toBe(true);

      // Clear processes
      tabManager.updateProcessCount(session.id, 0);
      expect(session.processCount).toBe(0);
      expect(session.isDirty).toBe(false);
    });

    it('should restore closed tabs', () => {
      // Create and close a session
      const session = tabManager.createSession('Closable Session');
      const sessionName = session.name;
      
      tabManager.closeSession(session.id);
      expect(tabManager.getSessionCount()).toBe(0);
      expect(tabManager.hasClosedTabs()).toBe(true);

      // Restore session
      const restoredSession = tabManager.restoreClosedTab();
      expect(restoredSession).toBeDefined();
      expect(restoredSession?.name).toBe(sessionName);
      expect(tabManager.getSessionCount()).toBe(1);
      expect(tabManager.hasClosedTabs()).toBe(false);
    });

    it('should handle tab reordering', () => {
      const session1 = tabManager.createSession('Session 1');
      const session2 = tabManager.createSession('Session 2');
      const session3 = tabManager.createSession('Session 3');

      const initialOrder = tabManager.getState().tabOrder;
      expect(initialOrder).toEqual([session1.id, session2.id, session3.id]);

      // Move session3 before session1
      tabManager.reorderTabs(session3.id, session1.id, 'before');
      
      const newOrder = tabManager.getState().tabOrder;
      expect(newOrder).toEqual([session3.id, session1.id, session2.id]);
    });

    it('should enforce max tab limit', () => {
      const maxTabs = 20;
      
      // Create max + 1 tabs
      const sessions = [];
      for (let i = 0; i < maxTabs + 1; i++) {
        sessions.push(tabManager.createSession(`Session ${i + 1}`));
      }

      // Should have exactly maxTabs
      expect(tabManager.getSessionCount()).toBe(maxTabs);
      expect(tabManager.canCreateNewTab()).toBe(false);
    });

    it('should handle settings updates', () => {
      const newSettings = {
        closeConfirmation: false,
        showTabNumbers: false,
        enableDragDrop: false
      };

      tabManager.updateSettings(newSettings);
      
      const state = tabManager.getState();
      expect(state.settings.closeConfirmation).toBe(false);
      expect(state.settings.showTabNumbers).toBe(false);
      expect(state.settings.enableDragDrop).toBe(false);

      // Other settings should remain unchanged
      expect(state.settings.autoSave).toBe(true);
      expect(state.settings.tabScrollable).toBe(true);
    });
  });

  describe('Session Persistence', () => {
    it('should persist session state', () => {
      // Create session with some state
      const session = tabManager.createSession('Persistent Session');
      tabManager.updateSessionState(session.id, {
        currentPath: '/tmp',
        history: [
          {
            id: 'cmd1',
            command: 'ls -la',
            output: 'file1\nfile2',
            timestamp: new Date().toISOString(),
            exitCode: 0
          }
        ]
      });

      // Force persistence
      tabManager.destroy();

      // Create new instance to test loading
      const newTabManager = new (tabManager.constructor as any)();
      
      expect(newTabManager.getSessionCount()).toBe(1);
      const loadedSession = newTabManager.getSessions()[0];
      expect(loadedSession.name).toBe('Persistent Session');
      expect(loadedSession.currentPath).toBe('/tmp');
      expect(loadedSession.history).toHaveLength(1);
      
      newTabManager.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle operations on non-existent sessions gracefully', () => {
      const fakeId = 'non-existent-session-id';

      expect(tabManager.switchToSession(fakeId)).toBe(false);
      expect(tabManager.closeSession(fakeId)).toBe(false);
      expect(tabManager.updateSessionState(fakeId, {})).toBe(false);
      expect(tabManager.markSessionDirty(fakeId, true)).toBe(false);
      expect(tabManager.updateProcessCount(fakeId, 1)).toBe(false);
      expect(tabManager.getSession(fakeId)).toBeNull();
    });

    it('should handle empty state gracefully', () => {
      expect(tabManager.getSessionCount()).toBe(0);
      expect(tabManager.getActiveSession()).toBeNull();
      expect(tabManager.getSessions()).toEqual([]);
      expect(tabManager.hasClosedTabs()).toBe(false);
      expect(tabManager.restoreClosedTab()).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should provide correct session count', () => {
      expect(tabManager.getSessionCount()).toBe(0);
      
      tabManager.createSession('Session 1');
      expect(tabManager.getSessionCount()).toBe(1);
      
      tabManager.createSession('Session 2');
      expect(tabManager.getSessionCount()).toBe(2);
    });

    it('should check tab creation availability', () => {
      expect(tabManager.canCreateNewTab()).toBe(true);
      
      // Create sessions up to limit - 1
      for (let i = 0; i < 19; i++) {
        tabManager.createSession(`Session ${i + 1}`);
      }
      
      expect(tabManager.canCreateNewTab()).toBe(true);
      
      // Create one more to hit the limit
      tabManager.createSession('Session 20');
      expect(tabManager.canCreateNewTab()).toBe(false);
    });

    it('should track closed tabs availability', () => {
      expect(tabManager.hasClosedTabs()).toBe(false);
      
      const session = tabManager.createSession('Test Session');
      expect(tabManager.hasClosedTabs()).toBe(false);
      
      tabManager.closeSession(session.id);
      expect(tabManager.hasClosedTabs()).toBe(true);
      
      tabManager.restoreClosedTab();
      expect(tabManager.hasClosedTabs()).toBe(false);
    });
  });

  describe('State Subscription', () => {
    it('should notify subscribers of state changes', () => {
      let notificationCount = 0;
      let lastState = null;

      const unsubscribe = tabManager.subscribe((state) => {
        notificationCount++;
        lastState = state;
      });

      // Create session should trigger notification
      const session = tabManager.createSession('Test Session');
      expect(notificationCount).toBe(1);
      expect(lastState).toBeDefined();

      // Switch session should trigger notification
      tabManager.switchToSession(session.id);
      expect(notificationCount).toBe(2);

      // Update state should trigger notification
      tabManager.updateSessionState(session.id, { currentPath: '/tmp' });
      expect(notificationCount).toBe(3);

      unsubscribe();

      // After unsubscribe, no more notifications
      tabManager.createSession('Another Session');
      expect(notificationCount).toBe(3);
    });
  });
});