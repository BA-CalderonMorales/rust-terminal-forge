
// Secure command processor with input validation and path traversal protection
import { TerminalCommand } from './types';
import { SecurityUtils } from './securityUtils';
import { RateLimiter } from './rateLimiter';
import { FileSystemManager } from './filesystem/FileSystemManager';
import { FileSystemCommands } from './commands/FileSystemCommands';
import { SystemCommands } from './commands/SystemCommands';
import { UtilityCommands } from './commands/UtilityCommands';
import { CargoCommands } from './commands/CargoCommands';

export class SecureCommandProcessor {
  private rateLimiter = new RateLimiter();
  private fileSystemManager = new FileSystemManager();
  private fileSystemCommands = new FileSystemCommands(this.fileSystemManager);
  private systemCommands = new SystemCommands();
  private utilityCommands = new UtilityCommands();
  private cargoCommands = new CargoCommands();

  processCommand(input: string, sessionId: string = 'default'): TerminalCommand {
    // Rate limiting check
    if (!this.rateLimiter.isAllowed(sessionId)) {
      const remaining = this.rateLimiter.getRemainingCommands(sessionId);
      return {
        id: SecurityUtils.generateSecureId(),
        command: input,
        output: `Rate limit exceeded. Try again later. Remaining commands: ${remaining}`,
        timestamp: new Date().toISOString(),
        exitCode: 429
      };
    }

    // Input validation
    if (!SecurityUtils.validateCommand(input)) {
      return {
        id: SecurityUtils.generateSecureId(),
        command: input,
        output: 'Invalid command: contains forbidden characters or exceeds length limit',
        timestamp: new Date().toISOString(),
        exitCode: 400
      };
    }

    const sanitizedInput = SecurityUtils.sanitizeInput(input.trim());
    const command = this.utilityCommands.expandAliases(sanitizedInput);
    const parts = this.parseCommand(command);
    const baseCommand = parts[0];
    const args = parts.slice(1);

    const id = SecurityUtils.generateSecureId();
    const timestamp = new Date().toISOString();

    // Add to command history
    this.utilityCommands.addToHistory(command);

    try {
      switch (baseCommand) {
        case 'pwd':
          return this.fileSystemCommands.handlePwd(id, command, timestamp);
        case 'ls':
          return this.fileSystemCommands.handleLs(args, id, command, timestamp);
        case 'cd':
          return this.fileSystemCommands.handleCd(args, id, command, timestamp);
        case 'mkdir':
          return this.fileSystemCommands.handleMkdir(args, id, command, timestamp);
        case 'touch':
          return this.fileSystemCommands.handleTouch(args, id, command, timestamp);
        case 'cat':
          return this.fileSystemCommands.handleCat(args, id, command, timestamp);
        case 'find':
          return this.fileSystemCommands.handleFind(args, id, command, timestamp);
        case 'grep':
          return this.fileSystemCommands.handleGrep(args, id, command, timestamp);
        case 'edit':
          return this.fileSystemCommands.handleEdit(args, id, command, timestamp);
        case 'vim':
          return this.fileSystemCommands.handleVim(args, id, command, timestamp);
        case 'echo':
          return this.systemCommands.handleEcho(args, id, command, timestamp);
        case 'whoami':
          return this.systemCommands.handleWhoami(id, command, timestamp);
        case 'date':
          return this.systemCommands.handleDate(id, command, timestamp);
        case 'env':
          return this.systemCommands.handleEnv(id, command, timestamp);
        case 'which':
          return this.systemCommands.handleWhich(args, id, command, timestamp);
        case 'history':
          return this.utilityCommands.handleHistory(id, command, timestamp);
        case 'alias':
          return this.utilityCommands.handleAlias(args, id, command, timestamp);
        case 'clear':
          return this.utilityCommands.handleClear(id, command, timestamp);
        case 'help':
          return this.utilityCommands.handleHelp(id, command, timestamp);
        case 'cargo':
          return this.cargoCommands.handleCargo(args, id, command, timestamp);
        default:
          return {
            id,
            command,
            output: `bash: ${baseCommand}: command not found\n\nDid you mean:\n${this.suggestCommand(baseCommand)}`,
            timestamp,
            exitCode: 127
          };
      }
    } catch (error) {
      return {
        id,
        command,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp,
        exitCode: 1
      };
    }
  }

  private parseCommand(command: string): string[] {
    const parts = command.split(/\s+/).filter(part => part.length > 0);
    const result: string[] = [];
    
    for (const part of parts) {
      if (part.startsWith('-') && part.length > 2 && !part.includes('=')) {
        const flags = part.slice(1);
        for (const flag of flags) {
          result.push(`-${flag}`);
        }
      } else {
        result.push(part);
      }
    }
    
    return result;
  }

  private suggestCommand(command: string): string {
    const commands = ['pwd', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'find', 'grep', 'vim', 'echo', 'whoami', 'date', 'env', 'which', 'history', 'alias', 'cargo', 'clear', 'help'];
    const suggestions = commands.filter(cmd => 
      cmd.includes(command) || 
      this.levenshteinDistance(cmd, command) <= 2
    );
    
    return suggestions.length > 0 ? suggestions.join(', ') : 'Type "help" for available commands';
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  getCurrentPath(): string {
    return this.fileSystemManager.getCurrentPath();
  }

  getFileSystem() {
    return this.fileSystemManager.getFileSystem();
  }

  readFile(fileName: string): string | null {
    return this.fileSystemManager.getFileContent(this.getCurrentPath(), fileName);
  }

  writeFile(fileName: string, content: string): void {
    this.fileSystemManager.setFileContent(this.getCurrentPath(), fileName, content);
  }
}
