
// Home module - Enhanced ViewModel with secure command processing
import { HomeModel } from './model';
import { SecureCommandProcessor } from '../core/SecureCommandProcessor';
import { TerminalSession, TerminalCommand, User } from '../core/types';

export class HomeViewModel {
  private model: HomeModel;
  private commandProcessor: SecureCommandProcessor;
  private onStateChangeCallback?: () => void;

  constructor() {
    this.model = new HomeModel();
    this.commandProcessor = new SecureCommandProcessor();
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

    try {
      const command = this.commandProcessor.processCommand(input);
      this.model.addCommandToSession(activeSession.id, command);
      
      // Update session path if cd command was successful
      if (input.trim().startsWith('cd ') && command.exitCode === 0) {
        const currentPath = this.commandProcessor.getCurrentPath();
        this.model.updateSessionPath(activeSession.id, currentPath);
      }
      
      this.notifyStateChange();
    } catch (error) {
      // Handle command processing errors gracefully
      const errorCommand: TerminalCommand = {
        id: `error-${Date.now()}`,
        command: input,
        output: `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        exitCode: 1
      };
      
      this.model.addCommandToSession(activeSession.id, errorCommand);
      this.notifyStateChange();
    }
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

  getFileSystem() {
    return this.commandProcessor.getFileSystem();
  }
}
