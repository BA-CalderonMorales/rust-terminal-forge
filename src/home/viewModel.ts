
// Home module - ViewModel layer for terminal business logic
import { HomeModel } from './model';
import { CommandProcessor } from '../core/commands';
import { TerminalSession, TerminalCommand, User } from '../core/types';

export class HomeViewModel {
  private model: HomeModel;
  private commandProcessor: CommandProcessor;
  private onStateChangeCallback?: () => void;

  constructor() {
    this.model = new HomeModel();
    this.commandProcessor = new CommandProcessor();
  }

  onStateChange(callback: () => void): void {
    this.onStateChangeCallback = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  login(username: string): User {
    const user = this.model.authenticateUser(username);
    
    // Create initial session
    if (this.model.getSessions().length === 0) {
      this.model.createSession('Main Terminal');
    }
    
    this.notifyStateChange();
    return user;
  }

  logout(): void {
    this.model.logout();
    this.notifyStateChange();
  }

  executeCommand(input: string): void {
    const activeSession = this.model.getActiveSession();
    if (!activeSession) return;

    const command = this.commandProcessor.processCommand(input);
    this.model.addCommandToSession(activeSession.id, command);
    this.notifyStateChange();
  }

  createNewSession(): TerminalSession {
    const sessionCount = this.model.getSessions().length;
    const session = this.model.createSession(`Terminal ${sessionCount + 1}`);
    this.notifyStateChange();
    return session;
  }

  switchToSession(sessionId: string): void {
    this.model.switchSession(sessionId);
    this.notifyStateChange();
  }

  closeSession(sessionId: string): void {
    this.model.removeSession(sessionId);
    this.notifyStateChange();
  }

  isAuthenticated(): boolean {
    return this.model.getAuthState().isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.model.getAuthState().user;
  }

  getActiveSession(): TerminalSession | null {
    return this.model.getActiveSession();
  }

  getSessions(): TerminalSession[] {
    return this.model.getSessions();
  }

  getCurrentPath(): string {
    return this.commandProcessor.getCurrentPath();
  }
}
