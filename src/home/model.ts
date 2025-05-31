
// Home module - Enhanced Model with secure user-derived encryption
import { AuthState, TerminalSession, TerminalCommand, User } from '../core/types';
import { SecureStorage } from '../core/secureStorage';
import { SecurityUtils } from '../core/securityUtils';
import { InputValidator } from '../core/validation';

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
      SecurityUtils.logSecurityEvent('auth_load_failed', error);
      console.error('Failed to load auth state:', error);
      // Keep default state on error
    } finally {
      this.isLoading = false;
    }
  }

  private async saveAuthState(): Promise<void> {
    try {
      await SecureStorage.set('auth', this.authState);
    } catch (error) {
      SecurityUtils.logSecurityEvent('auth_save_failed', error);
      console.error('Failed to save auth state:', error);
    }
  }

  async authenticateUser(username: string): Promise<User> {
    // Validate username input
    const validation = InputValidator.validateUsername(username);
    if (!validation.isValid) {
      SecurityUtils.logSecurityEvent('invalid_username', { username, error: validation.error });
      throw new Error(validation.error || 'Invalid username');
    }

    // Initialize secure storage for this user
    await SecureStorage.initializeForUser(validation.value!);

    const user: User = {
      id: SecurityUtils.generateSecureId(),
      username: validation.value!,
      createdAt: new Date().toISOString()
    };

    this.authState.isAuthenticated = true;
    this.authState.user = user;
    await this.saveAuthState();

    SecurityUtils.logSecurityEvent('user_authenticated', { username: user.username });
    return user;
  }

  async logout(): Promise<void> {
    const username = this.authState.user?.username;
    
    this.authState.isAuthenticated = false;
    this.authState.user = null;
    this.authState.sessions = [];
    this.authState.activeSessionId = null;
    
    // Clear secure storage session
    SecureStorage.clearUserSession();
    await this.saveAuthState();
    
    SecurityUtils.logSecurityEvent('user_logged_out', { username });
  }

  async createSession(name: string = 'Terminal'): Promise<TerminalSession> {
    // Validate session name
    const validation = InputValidator.validateSessionName(name);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid session name');
    }

    const session: TerminalSession = {
      id: SecurityUtils.generateSecureId(),
      name: validation.value!,
      currentPath: '/home/user/project',
      history: [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Deactivate other sessions
    this.authState.sessions.forEach(s => s.isActive = false);
    
    this.authState.sessions.push(session);
    this.authState.activeSessionId = session.id;
    await this.saveAuthState();

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
