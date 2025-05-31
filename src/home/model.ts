
// Home module - Enhanced Model with session path tracking and secure storage
import { AuthState, TerminalSession, TerminalCommand, User } from '../core/types';
import { SecureStorage } from '../core/secureStorage';
import { SecurityUtils } from '../core/securityUtils';

export class HomeModel {
  private authState: AuthState;
  private isLoading: boolean = false;

  constructor() {
    // Initialize with default state immediately
    this.authState = {
      isAuthenticated: false,
      user: null,
      sessions: [],
      activeSessionId: null
    };
    
    // Load saved state asynchronously
    this.loadAuthState();
  }

  private async loadAuthState(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    
    try {
      const saved = await SecureStorage.get<AuthState>('auth');
      if (saved) {
        this.authState = saved;
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      // Keep default state on error
    } finally {
      this.isLoading = false;
    }
  }

  private async saveAuthState(): Promise<void> {
    await SecureStorage.set('auth', this.authState);
  }

  authenticateUser(username: string): User {
    const user: User = {
      id: SecurityUtils.generateSecureId(),
      username: SecurityUtils.sanitizeInput(username),
      createdAt: new Date().toISOString()
    };

    this.authState.isAuthenticated = true;
    this.authState.user = user;
    this.saveAuthState();

    return user;
  }

  logout(): void {
    this.authState.isAuthenticated = false;
    this.authState.user = null;
    this.authState.sessions = [];
    this.authState.activeSessionId = null;
    this.saveAuthState();
  }

  createSession(name: string = 'Terminal'): TerminalSession {
    const session: TerminalSession = {
      id: SecurityUtils.generateSecureId(),
      name: SecurityUtils.sanitizeInput(name),
      currentPath: '/home/user/project',
      history: [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Deactivate other sessions
    this.authState.sessions.forEach(s => s.isActive = false);
    
    this.authState.sessions.push(session);
    this.authState.activeSessionId = session.id;
    this.saveAuthState();

    return session;
  }

  addCommandToSession(sessionId: string, command: TerminalCommand): void {
    const session = this.authState.sessions.find(s => s.id === sessionId);
    if (session) {
      session.history.push(command);
      this.saveAuthState();
    }
  }

  updateSessionPath(sessionId: string, newPath: string): void {
    const session = this.authState.sessions.find(s => s.id === sessionId);
    if (session) {
      session.currentPath = SecurityUtils.sanitizeInput(newPath);
      this.saveAuthState();
    }
  }

  switchSession(sessionId: string): void {
    this.authState.sessions.forEach(s => s.isActive = s.id === sessionId);
    this.authState.activeSessionId = sessionId;
    this.saveAuthState();
  }

  removeSession(sessionId: string): void {
    this.authState.sessions = this.authState.sessions.filter(s => s.id !== sessionId);
    
    if (this.authState.activeSessionId === sessionId) {
      const firstSession = this.authState.sessions[0];
      if (firstSession) {
        this.authState.activeSessionId = firstSession.id;
        firstSession.isActive = true;
      } else {
        this.authState.activeSessionId = null;
      }
    }
    
    this.saveAuthState();
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getActiveSession(): TerminalSession | null {
    return this.authState.sessions.find(s => s.isActive) || null;
  }

  getSessions(): TerminalSession[] {
    return [...this.authState.sessions];
  }
}
