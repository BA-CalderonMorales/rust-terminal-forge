
// Home module - Model layer for terminal data management
import { AuthState, TerminalSession, TerminalCommand, User } from '../core/types';
import { Storage } from '../core/storage';

export class HomeModel {
  private authState: AuthState;

  constructor() {
    this.authState = this.loadAuthState();
  }

  private loadAuthState(): AuthState {
    const saved = Storage.get<AuthState>('auth');
    return saved || {
      isAuthenticated: false,
      user: null,
      sessions: [],
      activeSessionId: null
    };
  }

  private saveAuthState(): void {
    Storage.set('auth', this.authState);
  }

  authenticateUser(username: string): User {
    const user: User = {
      id: Date.now().toString(),
      username,
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
      id: Date.now().toString(),
      name,
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

  switchSession(sessionId: string): void {
    this.authState.sessions.forEach(s => s.isActive = s.id === sessionId);
    this.authState.activeSessionId = sessionId;
    this.saveAuthState();
  }

  removeSession(sessionId: string): void {
    this.authState.sessions = this.authState.sessions.filter(s => s.id !== sessionId);
    
    if (this.authState.activeSessionId === sessionId) {
      const firstSession = this.authState.sessions[0];
      this.authState.activeSessionId = firstSession ? firstSession.id : null;
      if (firstSession) {
        firstSession.isActive = true;
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
