
// Home module - Enhanced ViewModel with async security features
import { HomeModel } from './model';
import { SecureCommandProcessor } from '../core/SecureCommandProcessor';
import { TerminalSession, TerminalCommand, User, EditorSession } from '../core/types';
import { SecurityUtils } from '../core/securityUtils';

export class HomeViewModel {
  private model: HomeModel;
  private commandProcessor: SecureCommandProcessor;
  private onStateChangeCallback?: () => void;
  private editors: EditorSession[] = [];
  private activeEditorId: string | null = null;

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

  async login(username: string): Promise<User> {
    try {
      const user = await this.model.authenticateUser(username);
      
      // Create initial session
      if (this.model.getSessions().length === 0) {
        await this.model.createSession('Main Terminal');
      }
      
      this.notifyStateChange();
      return user;
    } catch (error) {
      SecurityUtils.logSecurityEvent('login_failed', { username, error });
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.model.logout();
    this.notifyStateChange();
  }

  executeCommand(input: string): void {
    const activeSession = this.model.getActiveSession();
    if (!activeSession) return;

    try {
      // Pass session ID for rate limiting
      const command = this.commandProcessor.processCommand(input, activeSession.id);
      this.model.addCommandToSession(activeSession.id, command);
      
      // Update session path if cd command was successful
      if (input.trim().startsWith('cd ') && command.exitCode === 0) {
        const currentPath = this.commandProcessor.getCurrentPath();
        this.model.updateSessionPath(activeSession.id, currentPath);
      }
      
      this.notifyStateChange();
    } catch (error) {
      SecurityUtils.logSecurityEvent('command_execution_error', { command: input, error });
      
      // Handle command processing errors gracefully
      const errorCommand: TerminalCommand = {
        id: SecurityUtils.generateSecureId(),
        command: input,
        output: `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        exitCode: 1
      };
      
      this.model.addCommandToSession(activeSession.id, errorCommand);
      this.notifyStateChange();
    }
  }

  async createNewSession(): Promise<TerminalSession> {
    const sessionCount = this.model.getSessions().length;
    const session = await this.model.createSession(`Terminal ${sessionCount + 1}`);
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

  openEditor(fileName: string): EditorSession {
    const content = this.commandProcessor.readFile(fileName);
    const editor: EditorSession = {
      id: SecurityUtils.generateSecureId(),
      fileName,
      content,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.editors.forEach(e => (e.isActive = false));
    this.editors.push(editor);
    this.activeEditorId = editor.id;
    this.notifyStateChange();
    return editor;
  }

  saveEditor(editorId: string, content: string): void {
    const editor = this.editors.find(e => e.id === editorId);
    if (editor) {
      editor.content = content;
      this.commandProcessor.writeFile(editor.fileName, content);
      this.notifyStateChange();
    }
  }

  closeEditor(editorId: string): void {
    this.editors = this.editors.filter(e => e.id !== editorId);
    if (this.activeEditorId === editorId) {
      this.activeEditorId = this.editors[0]?.id || null;
      if (this.activeEditorId) {
        this.editors[0].isActive = true;
      }
    }
    this.notifyStateChange();
  }

  switchEditor(editorId: string): void {
    this.editors.forEach(e => (e.isActive = e.id === editorId));
    this.activeEditorId = editorId;
    this.notifyStateChange();
  }

  getEditors(): EditorSession[] {
    return [...this.editors];
  }

  getActiveEditor(): EditorSession | null {
    return this.editors.find(e => e.id === this.activeEditorId) || null;
  }
}
